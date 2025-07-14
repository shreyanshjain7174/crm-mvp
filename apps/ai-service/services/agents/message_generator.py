"""
Message Generation Agent
Creates contextual messages for leads
"""

from typing import Dict, Any, Optional
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from services.crm_integration import CRMIntegration

class MessageGeneratorAgent:
    """AI agent specialized in generating contextual messages"""
    
    def __init__(self, llm):
        self.llm = llm
        self.crm = CRMIntegration()
        
        # Message generation prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert message generation agent for a CRM system.
            Your job is to create personalized, contextual messages for leads.
            
            Guidelines:
            1. Be professional but conversational
            2. Reference previous interactions when relevant
            3. Match the tone to the lead's communication style
            4. Include clear call-to-action
            5. Keep messages concise and valuable
            6. Adapt to business context and industry
            
            Message Types:
            - welcome: First contact messages
            - follow_up: Follow-up messages after interaction
            - nurture: Educational/value-add messages
            - promotion: Sales/promotional messages
            - re_engagement: Win-back messages for cold leads
            
            Respond in JSON format:
            {{
                "message": "Generated message content",
                "subject": "Email subject if applicable",
                "message_type": "follow_up",
                "tone": "professional",
                "call_to_action": "Schedule a call",
                "confidence": 0.9,
                "suggested_timing": "immediate"
            }}"""),
            ("human", """Context: {context}
            
            Lead Information:
            {lead_data}
            
            Recent Messages:
            {recent_messages}
            
            Business Profile:
            {business_profile}
            
            Message Type: {message_type}
            Special Instructions: {instructions}
            
            Generate an appropriate message:""")
        ])
    
    async def execute(self, lead_id: str, custom_prompt: str = "", context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute message generation"""
        
        # Get lead data and history
        lead_data = await self.crm.get_lead(lead_id) if lead_id else {}
        recent_messages = await self.crm.get_lead_messages(lead_id) if lead_id else []
        business_profile = await self.crm.get_business_profile() or {}
        
        # Determine message type from context
        message_type = context.get("message_type", "follow_up") if context else "follow_up"
        
        # Prepare generation context
        generation_context = {
            "context": custom_prompt or "Generate a contextual message for this lead",
            "lead_data": self._format_lead_data(lead_data),
            "recent_messages": self._format_recent_messages(recent_messages),
            "business_profile": self._format_business_profile(business_profile),
            "message_type": message_type,
            "instructions": context.get("instructions", "") if context else ""
        }
        
        try:
            messages = self.prompt_template.format_messages(**generation_context)
            response = await self.llm.ainvoke(messages)
            
            # Parse JSON response
            import json
            result = json.loads(response.content)
            
            # Add metadata
            result.update({
                "agent_type": "message_generator",
                "lead_id": lead_id,
                "timestamp": self._get_timestamp(),
                "input_context": context or {}
            })
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "agent_type": "message_generator",
                "lead_id": lead_id,
                "confidence": 0.0,
                "message": "Error generating message"
            }
    
    async def generate_sequence(self, lead_id: str, sequence_type: str, num_messages: int = 3) -> Dict[str, Any]:
        """Generate a sequence of messages for nurturing"""
        
        sequence_templates = {
            "welcome": [
                {"message_type": "welcome", "instructions": "Warm welcome message"},
                {"message_type": "nurture", "instructions": "Share valuable resource"},
                {"message_type": "follow_up", "instructions": "Check interest level"}
            ],
            "nurture": [
                {"message_type": "nurture", "instructions": "Educational content"},
                {"message_type": "nurture", "instructions": "Industry insights"},
                {"message_type": "follow_up", "instructions": "Soft sales approach"}
            ],
            "re_engagement": [
                {"message_type": "re_engagement", "instructions": "Check in message"},
                {"message_type": "promotion", "instructions": "Special offer"},
                {"message_type": "follow_up", "instructions": "Final attempt"}
            ]
        }
        
        templates = sequence_templates.get(sequence_type, sequence_templates["nurture"])
        messages = []
        
        for i, template in enumerate(templates[:num_messages]):
            try:
                result = await self.execute(lead_id, context=template)
                messages.append({
                    "sequence_position": i + 1,
                    "delay_days": i * 2 + 1,  # Space messages 1, 3, 5 days apart
                    **result
                })
            except Exception as e:
                messages.append({
                    "sequence_position": i + 1,
                    "error": str(e),
                    "confidence": 0.0
                })
        
        return {
            "sequence_type": sequence_type,
            "messages": messages,
            "total_messages": len(messages),
            "successful_generations": len([m for m in messages if "error" not in m])
        }
    
    def _format_lead_data(self, lead_data: Dict[str, Any]) -> str:
        """Format lead data for prompt"""
        if not lead_data:
            return "No lead data available"
        
        formatted = f"""
        Name: {lead_data.get('name', 'Unknown')}
        Status: {lead_data.get('status', 'Unknown')}
        Source: {lead_data.get('source', 'Unknown')}
        Industry: {lead_data.get('businessProfile', 'Unknown')}
        AI Score: {lead_data.get('aiScore', 'Not scored')}
        Days since contact: {self._calculate_days_since(lead_data.get('createdAt'))}
        """
        
        return formatted.strip()
    
    def _format_recent_messages(self, messages: list) -> str:
        """Format recent messages for context"""
        if not messages:
            return "No previous messages"
        
        formatted_messages = []
        for msg in messages[:3]:  # Last 3 messages
            direction = "Sent" if msg.get('direction') == 'OUTBOUND' else "Received"
            formatted_messages.append(f"""
            {direction}: {msg.get('content', 'No content')[:100]}...
            Date: {msg.get('timestamp', 'Unknown')}
            Status: {msg.get('status', 'Unknown')}
            """)
        
        return "\n---\n".join(formatted_messages)
    
    def _format_business_profile(self, profile: Dict[str, Any]) -> str:
        """Format business profile for context"""
        if not profile:
            return "No business profile available"
        
        return f"""
        Business: {profile.get('name', 'Unknown')}
        Industry: {profile.get('industry', 'Unknown')}
        Description: {profile.get('description', 'No description')}
        """
    
    def _calculate_days_since(self, date_str: str) -> str:
        """Calculate days since a date"""
        if not date_str:
            return "Unknown"
        
        try:
            from datetime import datetime
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            now = datetime.utcnow().replace(tzinfo=date.tzinfo)
            days = (now - date).days
            return f"{days} days"
        except:
            return "Unknown"
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    async def analyze_message_performance(self, message_ids: list) -> Dict[str, Any]:
        """Analyze performance of generated messages"""
        performance_data = {}
        
        for message_id in message_ids:
            message_data = await self.crm.get_message(message_id)
            if message_data:
                performance_data[message_id] = {
                    "status": message_data.get("status"),
                    "response_received": message_data.get("response_received", False),
                    "engagement_score": self._calculate_engagement_score(message_data)
                }
        
        return {
            "analyzed_messages": len(performance_data),
            "performance_data": performance_data,
            "average_engagement": self._calculate_average_engagement(performance_data)
        }
    
    def _calculate_engagement_score(self, message_data: Dict[str, Any]) -> float:
        """Calculate engagement score for a message"""
        score = 0.0
        
        if message_data.get("status") == "DELIVERED":
            score += 0.3
        if message_data.get("status") == "READ":
            score += 0.5
        if message_data.get("response_received"):
            score += 0.7
        
        return min(score, 1.0)
    
    def _calculate_average_engagement(self, performance_data: Dict[str, Any]) -> float:
        """Calculate average engagement across messages"""
        if not performance_data:
            return 0.0
        
        scores = [data.get("engagement_score", 0) for data in performance_data.values()]
        return sum(scores) / len(scores) if scores else 0.0