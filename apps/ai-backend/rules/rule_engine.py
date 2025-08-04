"""
Rule Engine - Handles custom rules for AI request/response processing
"""

import asyncio
import logging
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime

from schemas.ai_schemas import AIRequest, AIResponse, CustomRule, RuleSet, RuleType
from database.db_manager import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)

class RuleEngine:
    """Processes custom rules for AI requests and responses"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.rule_cache: Dict[str, RuleSet] = {}
        self.cache_ttl = 300  # 5 minutes cache TTL
        
    async def create_rule_set(self, rule_set: RuleSet) -> RuleSet:
        """Create a new rule set"""
        try:
            # Validate rules
            for rule in rule_set.rules:
                await self._validate_rule(rule)
            
            # Save to database
            rule_set_data = {
                "rule_set_id": rule_set.rule_set_id,
                "name": rule_set.name,
                "description": rule_set.description,
                "rules": [rule.dict() for rule in rule_set.rules],
                "is_active": rule_set.is_active,
                "applies_to_models": rule_set.applies_to_models,
                "created_by": rule_set.created_by,
                "created_at": rule_set.created_at,
                "updated_at": rule_set.updated_at
            }
            
            await self.db.insert_rule_set(rule_set_data)
            
            # Cache the rule set
            self.rule_cache[rule_set.rule_set_id] = rule_set
            
            logger.info(f"Created rule set: {rule_set.rule_set_id}")
            return rule_set
            
        except Exception as e:
            logger.error(f"Error creating rule set: {e}")
            raise
    
    async def get_rule_set(self, rule_set_id: str) -> Optional[RuleSet]:
        """Get a rule set by ID"""
        try:
            # Check cache first
            if rule_set_id in self.rule_cache:
                return self.rule_cache[rule_set_id]
            
            # Query database
            rule_set_data = await self.db.get_rule_set(rule_set_id)
            if not rule_set_data:
                return None
            
            # Convert to RuleSet object
            rule_set = self._deserialize_rule_set(rule_set_data)
            
            # Cache result
            self.rule_cache[rule_set_id] = rule_set
            
            return rule_set
            
        except Exception as e:
            logger.error(f"Error getting rule set: {e}")
            raise
    
    async def list_rule_sets(self, user_id: Optional[str] = None) -> List[RuleSet]:
        """List rule sets, optionally filtered by user"""
        try:
            rule_sets_data = await self.db.list_rule_sets(user_id)
            
            rule_sets = []
            for rule_set_data in rule_sets_data:
                rule_set = self._deserialize_rule_set(rule_set_data)
                rule_sets.append(rule_set)
                
                # Cache the rule set
                self.rule_cache[rule_set.rule_set_id] = rule_set
            
            return rule_sets
            
        except Exception as e:
            logger.error(f"Error listing rule sets: {e}")
            raise
    
    async def update_rule_set(self, rule_set_id: str, rule_set: RuleSet) -> RuleSet:
        """Update an existing rule set"""
        try:
            # Validate rules
            for rule in rule_set.rules:
                await self._validate_rule(rule)
            
            # Update timestamp
            rule_set.updated_at = datetime.utcnow()
            
            # Update in database
            rule_set_data = {
                "rule_set_id": rule_set_id,
                "name": rule_set.name,
                "description": rule_set.description,
                "rules": [rule.dict() for rule in rule_set.rules],
                "is_active": rule_set.is_active,
                "applies_to_models": rule_set.applies_to_models,
                "updated_at": rule_set.updated_at
            }
            
            await self.db.update_rule_set(rule_set_id, rule_set_data)
            
            # Update cache
            self.rule_cache[rule_set_id] = rule_set
            
            logger.info(f"Updated rule set: {rule_set_id}")
            return rule_set
            
        except Exception as e:
            logger.error(f"Error updating rule set: {e}")
            raise
    
    async def delete_rule_set(self, rule_set_id: str):
        """Delete a rule set"""
        try:
            await self.db.delete_rule_set(rule_set_id)
            
            # Remove from cache
            if rule_set_id in self.rule_cache:
                del self.rule_cache[rule_set_id]
            
            logger.info(f"Deleted rule set: {rule_set_id}")
            
        except Exception as e:
            logger.error(f"Error deleting rule set: {e}")
            raise
    
    async def apply_input_rules(self, request: AIRequest, rule_set: RuleSet) -> AIRequest:
        """Apply input processing rules to a request"""
        try:
            if not rule_set.is_active:
                return request
            
            # Get applicable rules for input processing
            input_rules = [
                rule for rule in rule_set.rules
                if rule.is_active and rule.rule_type in [
                    RuleType.INPUT_FILTER,
                    RuleType.CONTENT_MODERATION,
                    RuleType.PROMPT_ENHANCEMENT,
                    RuleType.COST_OPTIMIZATION
                ]
            ]
            
            # Sort by priority (lower number = higher priority)
            input_rules.sort(key=lambda r: r.priority)
            
            modified_request = request
            rules_applied = []
            
            for rule in input_rules:
                try:
                    if await self._check_rule_condition(rule, request=modified_request):
                        modified_request = await self._apply_input_rule_action(rule, modified_request)
                        rules_applied.append(rule.rule_id)
                        logger.debug(f"Applied input rule: {rule.rule_id}")
                        
                except Exception as e:
                    logger.error(f"Error applying input rule {rule.rule_id}: {e}")
                    continue
            
            # Track rule usage
            if rules_applied:
                await self._track_rule_usage(rule_set.rule_set_id, rules_applied, "input")
            
            return modified_request
            
        except Exception as e:
            logger.error(f"Error applying input rules: {e}")
            return request  # Return original request on error
    
    async def apply_output_rules(self, response: AIResponse, rule_set: RuleSet) -> AIResponse:
        """Apply output processing rules to a response"""
        try:
            if not rule_set.is_active:
                return response
            
            # Get applicable rules for output processing
            output_rules = [
                rule for rule in rule_set.rules
                if rule.is_active and rule.rule_type in [
                    RuleType.OUTPUT_FILTER,
                    RuleType.CONTENT_MODERATION,
                    RuleType.RESPONSE_FORMATTING
                ]
            ]
            
            # Sort by priority
            output_rules.sort(key=lambda r: r.priority)
            
            modified_response = response
            rules_applied = []
            
            for rule in output_rules:
                try:
                    if await self._check_rule_condition(rule, response=modified_response):
                        modified_response = await self._apply_output_rule_action(rule, modified_response)
                        rules_applied.append(rule.rule_id)
                        logger.debug(f"Applied output rule: {rule.rule_id}")
                        
                except Exception as e:
                    logger.error(f"Error applying output rule {rule.rule_id}: {e}")
                    continue
            
            # Update rules applied in response
            if not modified_response.rules_applied:
                modified_response.rules_applied = []
            modified_response.rules_applied.extend(rules_applied)
            
            # Track rule usage
            if rules_applied:
                await self._track_rule_usage(rule_set.rule_set_id, rules_applied, "output")
            
            return modified_response
            
        except Exception as e:
            logger.error(f"Error applying output rules: {e}")
            return response  # Return original response on error
    
    async def _validate_rule(self, rule: CustomRule):
        """Validate a rule's structure and logic"""
        if not rule.condition:
            raise ValueError(f"Rule {rule.rule_id} must have a condition")
        
        if not rule.action:
            raise ValueError(f"Rule {rule.rule_id} must have an action")
        
        # Validate condition structure
        condition = rule.condition
        if "type" not in condition:
            raise ValueError(f"Rule {rule.rule_id} condition must have a 'type' field")
        
        # Validate action structure
        action = rule.action
        if "type" not in action:
            raise ValueError(f"Rule {rule.rule_id} action must have a 'type' field")
        
        # Validate based on rule type
        await self._validate_rule_type_specific(rule)
    
    async def _validate_rule_type_specific(self, rule: CustomRule):
        """Validate rule based on its specific type"""
        rule_type = rule.rule_type
        condition = rule.condition
        action = rule.action
        
        if rule_type == RuleType.INPUT_FILTER:
            # Input filter rules should check request properties
            valid_conditions = ["contains", "matches", "equals", "length", "context"]
            if condition.get("type") not in valid_conditions:
                raise ValueError(f"Invalid condition type for INPUT_FILTER: {condition.get('type')}")
        
        elif rule_type == RuleType.OUTPUT_FILTER:
            # Output filter rules should check response properties
            valid_conditions = ["contains", "matches", "equals", "length", "confidence"]
            if condition.get("type") not in valid_conditions:
                raise ValueError(f"Invalid condition type for OUTPUT_FILTER: {condition.get('type')}")
        
        elif rule_type == RuleType.CONTENT_MODERATION:
            # Content moderation can apply to both input and output
            valid_conditions = ["contains", "matches", "banned_words", "sentiment"]
            if condition.get("type") not in valid_conditions:
                raise ValueError(f"Invalid condition type for CONTENT_MODERATION: {condition.get('type')}")
    
    async def _check_rule_condition(
        self, 
        rule: CustomRule, 
        request: Optional[AIRequest] = None, 
        response: Optional[AIResponse] = None
    ) -> bool:
        """Check if a rule's condition is met"""
        condition = rule.condition
        condition_type = condition.get("type")
        
        try:
            if condition_type == "contains":
                text = self._get_text_for_condition(condition, request, response)
                return condition.get("value", "") in text
            
            elif condition_type == "matches":
                text = self._get_text_for_condition(condition, request, response)
                pattern = condition.get("pattern", "")
                return bool(re.search(pattern, text, re.IGNORECASE))
            
            elif condition_type == "equals":
                text = self._get_text_for_condition(condition, request, response)
                return text == condition.get("value", "")
            
            elif condition_type == "length":
                text = self._get_text_for_condition(condition, request, response)
                min_length = condition.get("min_length", 0)
                max_length = condition.get("max_length", float('inf'))
                return min_length <= len(text) <= max_length
            
            elif condition_type == "context":
                if not request or not request.context:
                    return False
                key = condition.get("key", "")
                value = condition.get("value", "")
                return request.context.get(key) == value
            
            elif condition_type == "confidence":
                if not response or response.confidence_score is None:
                    return False
                min_confidence = condition.get("min_confidence", 0.0)
                return response.confidence_score >= min_confidence
            
            elif condition_type == "banned_words":
                text = self._get_text_for_condition(condition, request, response)
                banned_words = condition.get("words", [])
                text_lower = text.lower()
                return any(word.lower() in text_lower for word in banned_words)
            
            else:
                logger.warning(f"Unknown condition type: {condition_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking rule condition: {e}")
            return False
    
    def _get_text_for_condition(
        self, 
        condition: Dict[str, Any], 
        request: Optional[AIRequest], 
        response: Optional[AIResponse]
    ) -> str:
        """Get text content based on condition target"""
        target = condition.get("target", "prompt")
        
        if target == "prompt" and request:
            return request.prompt
        elif target == "response" and response:
            return response.content
        elif target == "context" and request and request.context:
            return json.dumps(request.context)
        else:
            return ""
    
    async def _apply_input_rule_action(self, rule: CustomRule, request: AIRequest) -> AIRequest:
        """Apply an action to modify an input request"""
        action = rule.action
        action_type = action.get("type")
        
        modified_request = request.copy()
        
        if action_type == "modify_prompt":
            operation = action.get("operation", "append")
            text = action.get("text", "")
            
            if operation == "append":
                modified_request.prompt = f"{request.prompt}\n{text}"
            elif operation == "prepend":
                modified_request.prompt = f"{text}\n{request.prompt}"
            elif operation == "replace":
                pattern = action.get("pattern", "")
                if pattern:
                    modified_request.prompt = re.sub(pattern, text, request.prompt)
        
        elif action_type == "set_parameter":
            param_name = action.get("parameter", "")
            param_value = action.get("value")
            
            if param_name == "temperature":
                modified_request.temperature = float(param_value)
            elif param_name == "max_tokens":
                modified_request.max_tokens = int(param_value)
            elif param_name == "top_p":
                modified_request.top_p = float(param_value)
            elif param_name == "preferred_model":
                modified_request.preferred_model = str(param_value)
        
        elif action_type == "add_context":
            key = action.get("key", "")
            value = action.get("value", "")
            if not modified_request.context:
                modified_request.context = {}
            modified_request.context[key] = value
        
        elif action_type == "block":
            # This would typically raise an exception or return an error response
            # For now, we'll add a context flag
            if not modified_request.context:
                modified_request.context = {}
            modified_request.context["_blocked_by_rule"] = rule.rule_id
        
        return modified_request
    
    async def _apply_output_rule_action(self, rule: CustomRule, response: AIResponse) -> AIResponse:
        """Apply an action to modify an output response"""
        action = rule.action
        action_type = action.get("type")
        
        modified_response = response.copy()
        
        if action_type == "modify_content":
            operation = action.get("operation", "append")
            text = action.get("text", "")
            
            if operation == "append":
                modified_response.content = f"{response.content}\n{text}"
            elif operation == "prepend":
                modified_response.content = f"{text}\n{response.content}"
            elif operation == "replace":
                pattern = action.get("pattern", "")
                if pattern:
                    modified_response.content = re.sub(pattern, text, response.content)
        
        elif action_type == "format":
            format_type = action.get("format", "")
            
            if format_type == "markdown":
                # Simple markdown formatting
                content = response.content.strip()
                if not content.startswith("#"):
                    modified_response.content = f"## Response\n\n{content}"
            elif format_type == "json":
                # Wrap content in JSON structure
                modified_response.content = json.dumps({"response": response.content})
        
        elif action_type == "filter":
            # Remove or replace inappropriate content
            banned_words = action.get("banned_words", [])
            replacement = action.get("replacement", "[FILTERED]")
            
            content = response.content
            for word in banned_words:
                content = re.sub(re.escape(word), replacement, content, flags=re.IGNORECASE)
            modified_response.content = content
        
        elif action_type == "block":
            # Replace content with blocked message
            blocked_message = action.get("message", "Content blocked by content policy")
            modified_response.content = blocked_message
        
        return modified_response
    
    async def _track_rule_usage(self, rule_set_id: str, rules_applied: List[str], phase: str):
        """Track rule usage statistics"""
        try:
            usage_data = {
                "rule_set_id": rule_set_id,
                "rules_applied": rules_applied,
                "phase": phase,
                "timestamp": datetime.utcnow()
            }
            
            await self.db.track_rule_usage(usage_data)
            
            # Update rule set usage count
            if rule_set_id in self.rule_cache:
                rule_set = self.rule_cache[rule_set_id]
                rule_set.usage_count += 1
                rule_set.last_used = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Error tracking rule usage: {e}")
    
    def _deserialize_rule_set(self, rule_set_data: Dict[str, Any]) -> RuleSet:
        """Convert database data to RuleSet object"""
        rules = []
        for rule_data in rule_set_data.get("rules", []):
            rule = CustomRule(**rule_data)
            rules.append(rule)
        
        return RuleSet(
            rule_set_id=rule_set_data["rule_set_id"],
            name=rule_set_data["name"],
            description=rule_set_data.get("description"),
            rules=rules,
            is_active=rule_set_data.get("is_active", True),
            applies_to_models=rule_set_data.get("applies_to_models"),
            created_by=rule_set_data.get("created_by"),
            created_at=rule_set_data.get("created_at", datetime.utcnow()),
            updated_at=rule_set_data.get("updated_at", datetime.utcnow()),
            usage_count=rule_set_data.get("usage_count", 0),
            last_used=rule_set_data.get("last_used")
        )
    
    async def get_status(self) -> Dict[str, Any]:
        """Get rule engine status"""
        try:
            total_rule_sets = await self.db.count_rule_sets()
            active_rule_sets = await self.db.count_active_rule_sets()
            
            return {
                "status": "healthy",
                "cached_rule_sets": len(self.rule_cache),
                "total_rule_sets": total_rule_sets,
                "active_rule_sets": active_rule_sets,
                "cache_ttl_seconds": self.cache_ttl,
                "database_connected": await self.db.is_connected(),
                "last_check": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }
    
    def clear_cache(self):
        """Clear rule cache"""
        self.rule_cache.clear()
        logger.info("Rule engine cache cleared")