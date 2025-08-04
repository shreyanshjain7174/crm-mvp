"""
Token Tracker - Tracks token usage and calculates pricing
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

from schemas.ai_schemas import TokenUsage, ModelStats, UsageReport
from database.db_manager import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)

class TokenTracker:
    """Tracks token usage and calculates pricing across all models"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.usage_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes cache TTL
        
    async def track_usage(
        self, 
        model_id: str, 
        token_usage: TokenUsage, 
        user_id: str,
        request_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Track token usage for a request"""
        try:
            usage_data = {
                "model_id": model_id,
                "user_id": user_id,
                "request_id": request_id,
                "input_tokens": token_usage.input_tokens,
                "output_tokens": token_usage.output_tokens,
                "total_tokens": token_usage.total_tokens,
                "estimated_cost": token_usage.estimated_cost,
                "currency": token_usage.currency,
                "timestamp": datetime.utcnow(),
                "context": json.dumps(context) if context else None
            }
            
            await self.db.insert_usage_record(usage_data)
            
            # Update cache
            cache_key = f"usage:{user_id}:{datetime.utcnow().date()}"
            if cache_key in self.usage_cache:
                del self.usage_cache[cache_key]  # Invalidate cache
            
            logger.debug(f"Tracked usage: {token_usage.total_tokens} tokens for {model_id}")
            
        except Exception as e:
            logger.error(f"Error tracking usage: {e}")
    
    async def get_user_usage(
        self, 
        user_id: str, 
        days: int = 30
    ) -> UsageReport:
        """Get usage statistics for a user"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Check cache
            cache_key = f"user_usage:{user_id}:{days}:{start_date.date()}"
            if cache_key in self.usage_cache:
                cache_entry = self.usage_cache[cache_key]
                if (datetime.utcnow() - cache_entry["timestamp"]).seconds < self.cache_ttl:
                    return cache_entry["data"]
            
            # Query database
            usage_records = await self.db.get_user_usage(user_id, start_date, end_date)
            
            # Calculate statistics
            total_requests = len(usage_records)
            total_cost = sum(record.get("estimated_cost", 0) for record in usage_records)
            
            # Group by model
            model_stats = {}
            for record in usage_records:
                model_id = record["model_id"]
                if model_id not in model_stats:
                    model_stats[model_id] = {
                        "model_id": model_id,
                        "name": await self._get_model_name(model_id),
                        "total_requests": 0,
                        "successful_requests": 0,
                        "failed_requests": 0,
                        "total_input_tokens": 0,
                        "total_output_tokens": 0,
                        "total_tokens": 0,
                        "total_cost": 0.0,
                        "currency": record.get("currency", "USD")
                    }
                
                stats = model_stats[model_id]
                stats["total_requests"] += 1
                stats["successful_requests"] += 1  # Assume successful if recorded
                stats["total_input_tokens"] += record.get("input_tokens", 0)
                stats["total_output_tokens"] += record.get("output_tokens", 0)
                stats["total_tokens"] += record.get("total_tokens", 0)
                stats["total_cost"] += record.get("estimated_cost", 0)
            
            # Calculate derived metrics
            for stats in model_stats.values():
                if stats["total_requests"] > 0:
                    stats["success_rate"] = (stats["successful_requests"] / stats["total_requests"]) * 100
                    stats["average_cost_per_request"] = stats["total_cost"] / stats["total_requests"]
                else:
                    stats["success_rate"] = 0
                    stats["average_cost_per_request"] = 0
                
                # Add period info
                stats["period_start"] = start_date
                stats["period_end"] = end_date
            
            # Group by day for daily breakdown
            daily_usage = {}
            for record in usage_records:
                day = record["timestamp"].date()
                if day not in daily_usage:
                    daily_usage[day] = {
                        "date": day.isoformat(),
                        "requests": 0,
                        "total_tokens": 0,
                        "cost": 0.0
                    }
                
                daily_usage[day]["requests"] += 1
                daily_usage[day]["total_tokens"] += record.get("total_tokens", 0)
                daily_usage[day]["cost"] += record.get("estimated_cost", 0)
            
            # Create usage report
            report = UsageReport(
                user_id=user_id,
                period_start=start_date,
                period_end=end_date,
                total_requests=total_requests,
                total_cost=total_cost,
                currency="USD",
                model_usage=[
                    ModelStats(**stats) for stats in model_stats.values()
                ],
                daily_usage=list(daily_usage.values())
            )
            
            # Cache result
            self.usage_cache[cache_key] = {
                "data": report,
                "timestamp": datetime.utcnow()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error getting user usage: {e}")
            raise
    
    async def get_total_usage(self, days: int = 30) -> UsageReport:
        """Get total system usage statistics"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Check cache
            cache_key = f"total_usage:{days}:{start_date.date()}"
            if cache_key in self.usage_cache:
                cache_entry = self.usage_cache[cache_key]
                if (datetime.utcnow() - cache_entry["timestamp"]).seconds < self.cache_ttl:
                    return cache_entry["data"]
            
            # Query database for all users
            usage_records = await self.db.get_total_usage(start_date, end_date)
            
            # Calculate statistics
            total_requests = len(usage_records)
            total_cost = sum(record.get("estimated_cost", 0) for record in usage_records)
            
            # Group by model
            model_stats = {}
            user_stats = {}
            
            for record in usage_records:
                model_id = record["model_id"]
                user_id = record["user_id"]
                
                # Model statistics
                if model_id not in model_stats:
                    model_stats[model_id] = {
                        "model_id": model_id,
                        "name": await self._get_model_name(model_id),
                        "total_requests": 0,
                        "successful_requests": 0,
                        "failed_requests": 0,
                        "total_input_tokens": 0,
                        "total_output_tokens": 0,
                        "total_tokens": 0,
                        "total_cost": 0.0,
                        "currency": record.get("currency", "USD"),
                        "period_start": start_date,
                        "period_end": end_date
                    }
                
                stats = model_stats[model_id]
                stats["total_requests"] += 1
                stats["successful_requests"] += 1
                stats["total_input_tokens"] += record.get("input_tokens", 0)
                stats["total_output_tokens"] += record.get("output_tokens", 0)
                stats["total_tokens"] += record.get("total_tokens", 0)
                stats["total_cost"] += record.get("estimated_cost", 0)
                
                # User statistics
                if user_id not in user_stats:
                    user_stats[user_id] = {
                        "user_id": user_id,
                        "requests": 0,
                        "tokens": 0,
                        "cost": 0.0
                    }
                
                user_stats[user_id]["requests"] += 1
                user_stats[user_id]["tokens"] += record.get("total_tokens", 0)
                user_stats[user_id]["cost"] += record.get("estimated_cost", 0)
            
            # Calculate derived metrics
            for stats in model_stats.values():
                if stats["total_requests"] > 0:
                    stats["success_rate"] = (stats["successful_requests"] / stats["total_requests"]) * 100
                    stats["average_cost_per_request"] = stats["total_cost"] / stats["total_requests"]
                else:
                    stats["success_rate"] = 0
                    stats["average_cost_per_request"] = 0
            
            # Get top users
            top_users = sorted(
                user_stats.values(),
                key=lambda x: x["cost"],
                reverse=True
            )[:10]
            
            # Group by day for daily breakdown
            daily_usage = {}
            for record in usage_records:
                day = record["timestamp"].date()
                if day not in daily_usage:
                    daily_usage[day] = {
                        "date": day.isoformat(),
                        "requests": 0,
                        "total_tokens": 0,
                        "cost": 0.0
                    }
                
                daily_usage[day]["requests"] += 1
                daily_usage[day]["total_tokens"] += record.get("total_tokens", 0)
                daily_usage[day]["cost"] += record.get("estimated_cost", 0)
            
            # Create usage report
            report = UsageReport(
                user_id=None,  # System-wide report
                period_start=start_date,
                period_end=end_date,
                total_requests=total_requests,
                total_cost=total_cost,
                currency="USD",
                model_usage=[
                    ModelStats(**stats) for stats in model_stats.values()
                ],
                daily_usage=list(daily_usage.values())
            )
            
            # Add top users to model stats
            for model_stat in report.model_usage:
                model_stat.top_users = top_users
            
            # Cache result
            self.usage_cache[cache_key] = {
                "data": report,
                "timestamp": datetime.utcnow()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error getting total usage: {e}")
            raise
    
    async def get_model_stats(self, model_id: str, days: int = 30) -> ModelStats:
        """Get detailed statistics for a specific model"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            usage_records = await self.db.get_model_usage(model_id, start_date, end_date)
            
            # Calculate statistics
            total_requests = len(usage_records)
            successful_requests = total_requests  # Assume all recorded requests are successful
            total_input_tokens = sum(record.get("input_tokens", 0) for record in usage_records)
            total_output_tokens = sum(record.get("output_tokens", 0) for record in usage_records)
            total_tokens = sum(record.get("total_tokens", 0) for record in usage_records)
            total_cost = sum(record.get("estimated_cost", 0) for record in usage_records)
            
            # Calculate derived metrics
            success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
            average_cost_per_request = total_cost / total_requests if total_requests > 0 else 0
            
            # Get top users for this model
            user_stats = {}
            for record in usage_records:
                user_id = record["user_id"]
                if user_id not in user_stats:
                    user_stats[user_id] = {"user_id": user_id, "requests": 0, "cost": 0.0}
                
                user_stats[user_id]["requests"] += 1
                user_stats[user_id]["cost"] += record.get("estimated_cost", 0)
            
            top_users = sorted(
                user_stats.values(),
                key=lambda x: x["cost"],
                reverse=True
            )[:5]
            
            return ModelStats(
                model_id=model_id,
                name=await self._get_model_name(model_id),
                total_requests=total_requests,
                successful_requests=successful_requests,
                failed_requests=0,
                success_rate=success_rate,
                total_input_tokens=total_input_tokens,
                total_output_tokens=total_output_tokens,
                total_tokens=total_tokens,
                total_cost=total_cost,
                average_cost_per_request=average_cost_per_request,
                currency="USD",
                period_start=start_date,
                period_end=end_date,
                top_users=top_users
            )
            
        except Exception as e:
            logger.error(f"Error getting model stats: {e}")
            raise
    
    async def calculate_pricing(
        self, 
        model_id: str, 
        input_tokens: int, 
        output_tokens: int
    ) -> Dict[str, Any]:
        """Calculate pricing for token usage"""
        try:
            model_config = await self._get_model_config(model_id)
            if not model_config:
                return {"error": f"Model {model_id} not found"}
            
            pricing = model_config.get("pricing", {})
            pricing_model = pricing.get("pricing_model", "per_token")
            
            if pricing_model == "free":
                cost = 0.0
            elif pricing_model == "per_token":
                input_cost = input_tokens * pricing.get("input_token_cost", 0.0)
                output_cost = output_tokens * pricing.get("output_token_cost", 0.0)
                cost = input_cost + output_cost
            elif pricing_model == "per_request":
                cost = pricing.get("request_cost", 0.0)
            else:
                cost = 0.0
            
            return {
                "model_id": model_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "estimated_cost": cost,
                "currency": pricing.get("currency", "USD"),
                "pricing_model": pricing_model,
                "breakdown": {
                    "input_cost": input_tokens * pricing.get("input_token_cost", 0.0),
                    "output_cost": output_tokens * pricing.get("output_token_cost", 0.0)
                } if pricing_model == "per_token" else None
            }
            
        except Exception as e:
            logger.error(f"Error calculating pricing: {e}")
            return {"error": str(e)}
    
    async def get_status(self) -> Dict[str, Any]:
        """Get token tracker status"""
        try:
            # Get recent activity
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(hours=24)
            
            recent_usage = await self.db.get_total_usage(start_date, end_date)
            
            return {
                "status": "healthy",
                "cache_entries": len(self.usage_cache),
                "cache_ttl_seconds": self.cache_ttl,
                "recent_24h_requests": len(recent_usage),
                "recent_24h_cost": sum(r.get("estimated_cost", 0) for r in recent_usage),
                "database_connected": await self.db.is_connected(),
                "last_check": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }
    
    async def _get_model_name(self, model_id: str) -> str:
        """Get human-readable model name"""
        # This would typically query the model manager or database
        # For now, return a formatted version of the model ID
        return model_id.replace("-", " ").replace("_", " ").title()
    
    async def _get_model_config(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get model configuration from database or cache"""
        try:
            # This would typically query the model manager
            # For now, return basic config
            return {
                "model_id": model_id,
                "pricing": {
                    "pricing_model": "per_token",
                    "input_token_cost": 0.001,
                    "output_token_cost": 0.002,
                    "currency": "USD"
                }
            }
        except Exception:
            return None
    
    def clear_cache(self):
        """Clear usage cache"""
        self.usage_cache.clear()
        logger.info("Token tracker cache cleared")