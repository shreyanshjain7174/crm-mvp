"""
Database Manager - Handles database operations for AI backend
"""

import asyncio
import logging
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncpg
from contextlib import asynccontextmanager

from utils.logger import setup_logger

logger = setup_logger(__name__)

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self):
        self.pool = None
        self.connection_string = self._build_connection_string()
        
    def _build_connection_string(self) -> str:
        """Build PostgreSQL connection string"""
        host = os.getenv("AI_DB_HOST", "localhost")
        port = os.getenv("AI_DB_PORT", "5432")
        database = os.getenv("AI_DB_NAME", "ai_backend")
        user = os.getenv("AI_DB_USER", "postgres")
        password = os.getenv("AI_DB_PASSWORD", "password")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            
            # Create tables if they don't exist
            await self._create_tables()
            
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def _create_tables(self):
        """Create necessary database tables"""
        try:
            async with self.pool.acquire() as conn:
                # Usage tracking table
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS token_usage (
                        id SERIAL PRIMARY KEY,
                        model_id VARCHAR(255) NOT NULL,
                        user_id VARCHAR(255) NOT NULL,
                        request_id VARCHAR(255),
                        input_tokens INTEGER NOT NULL DEFAULT 0,
                        output_tokens INTEGER NOT NULL DEFAULT 0,
                        total_tokens INTEGER NOT NULL DEFAULT 0,
                        estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
                        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                        context JSONB,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                ''')
                
                # Rule sets table
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS rule_sets (
                        rule_set_id VARCHAR(255) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        rules JSONB NOT NULL DEFAULT '[]',
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        applies_to_models JSONB,
                        created_by VARCHAR(255),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        usage_count INTEGER NOT NULL DEFAULT 0,
                        last_used TIMESTAMP WITH TIME ZONE
                    )
                ''')
                
                # Rule usage tracking table
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS rule_usage (
                        id SERIAL PRIMARY KEY,
                        rule_set_id VARCHAR(255) NOT NULL,
                        rules_applied JSONB NOT NULL,
                        phase VARCHAR(50) NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        FOREIGN KEY (rule_set_id) REFERENCES rule_sets(rule_set_id) ON DELETE CASCADE
                    )
                ''')
                
                # Model configurations table
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS model_configs (
                        model_id VARCHAR(255) PRIMARY KEY,
                        model_type VARCHAR(50) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        config JSONB NOT NULL DEFAULT '{}',
                        pricing JSONB NOT NULL DEFAULT '{}',
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        health_status VARCHAR(50) DEFAULT 'unknown',
                        last_health_check TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                ''')
                
                # Create indexes for better performance
                await conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_token_usage_model_id ON token_usage(model_id)
                ''')
                await conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id)
                ''')
                await conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_token_usage_timestamp ON token_usage(timestamp)
                ''')
                await conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_rule_sets_active ON rule_sets(is_active)
                ''')
                await conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_rule_usage_rule_set_id ON rule_usage(rule_set_id)
                ''')
                
                logger.info("Database tables created/verified successfully")
                
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            raise
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def is_connected(self) -> bool:
        """Check if database is connected"""
        if not self.pool:
            return False
        
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("SELECT 1")
                return True
        except Exception:
            return False
    
    # Token usage methods
    async def insert_usage_record(self, usage_data: Dict[str, Any]):
        """Insert a token usage record"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO token_usage (
                        model_id, user_id, request_id, input_tokens, output_tokens, 
                        total_tokens, estimated_cost, currency, context, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ''', 
                    usage_data["model_id"],
                    usage_data["user_id"],
                    usage_data["request_id"],
                    usage_data["input_tokens"],
                    usage_data["output_tokens"],
                    usage_data["total_tokens"],
                    usage_data["estimated_cost"],
                    usage_data["currency"],
                    usage_data["context"],
                    usage_data["timestamp"]
                )
                
        except Exception as e:
            logger.error(f"Error inserting usage record: {e}")
            raise
    
    async def get_user_usage(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get usage records for a user within date range"""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch('''
                    SELECT * FROM token_usage 
                    WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
                    ORDER BY timestamp DESC
                ''', user_id, start_date, end_date)
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error getting user usage: {e}")
            raise
    
    async def get_total_usage(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get total usage records within date range"""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch('''
                    SELECT * FROM token_usage 
                    WHERE timestamp >= $1 AND timestamp <= $2
                    ORDER BY timestamp DESC
                ''', start_date, end_date)
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error getting total usage: {e}")
            raise
    
    async def get_model_usage(
        self, 
        model_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get usage records for a specific model within date range"""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch('''
                    SELECT * FROM token_usage 
                    WHERE model_id = $1 AND timestamp >= $2 AND timestamp <= $3
                    ORDER BY timestamp DESC
                ''', model_id, start_date, end_date)
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error getting model usage: {e}")
            raise
    
    # Rule sets methods
    async def insert_rule_set(self, rule_set_data: Dict[str, Any]):
        """Insert a new rule set"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO rule_sets (
                        rule_set_id, name, description, rules, is_active, 
                        applies_to_models, created_by, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ''',
                    rule_set_data["rule_set_id"],
                    rule_set_data["name"],
                    rule_set_data["description"],
                    json.dumps(rule_set_data["rules"]),
                    rule_set_data["is_active"],
                    json.dumps(rule_set_data["applies_to_models"]) if rule_set_data["applies_to_models"] else None,
                    rule_set_data["created_by"],
                    rule_set_data["created_at"],
                    rule_set_data["updated_at"]
                )
                
        except Exception as e:
            logger.error(f"Error inserting rule set: {e}")
            raise
    
    async def get_rule_set(self, rule_set_id: str) -> Optional[Dict[str, Any]]:
        """Get a rule set by ID"""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow('''
                    SELECT * FROM rule_sets WHERE rule_set_id = $1
                ''', rule_set_id)
                
                if row:
                    result = dict(row)
                    result["rules"] = json.loads(result["rules"]) if result["rules"] else []
                    if result["applies_to_models"]:
                        result["applies_to_models"] = json.loads(result["applies_to_models"])
                    return result
                return None
                
        except Exception as e:
            logger.error(f"Error getting rule set: {e}")
            raise
    
    async def list_rule_sets(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List rule sets, optionally filtered by user"""
        try:
            async with self.pool.acquire() as conn:
                if user_id:
                    rows = await conn.fetch('''
                        SELECT * FROM rule_sets 
                        WHERE created_by = $1 OR created_by IS NULL
                        ORDER BY created_at DESC
                    ''', user_id)
                else:
                    rows = await conn.fetch('''
                        SELECT * FROM rule_sets ORDER BY created_at DESC
                    ''')
                
                results = []
                for row in rows:
                    result = dict(row)
                    result["rules"] = json.loads(result["rules"]) if result["rules"] else []
                    if result["applies_to_models"]:
                        result["applies_to_models"] = json.loads(result["applies_to_models"])
                    results.append(result)
                
                return results
                
        except Exception as e:
            logger.error(f"Error listing rule sets: {e}")
            raise
    
    async def update_rule_set(self, rule_set_id: str, rule_set_data: Dict[str, Any]):
        """Update an existing rule set"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    UPDATE rule_sets SET 
                        name = $2, 
                        description = $3, 
                        rules = $4, 
                        is_active = $5, 
                        applies_to_models = $6, 
                        updated_at = $7
                    WHERE rule_set_id = $1
                ''',
                    rule_set_id,
                    rule_set_data["name"],
                    rule_set_data["description"],
                    json.dumps(rule_set_data["rules"]),
                    rule_set_data["is_active"],
                    json.dumps(rule_set_data["applies_to_models"]) if rule_set_data["applies_to_models"] else None,
                    rule_set_data["updated_at"]
                )
                
        except Exception as e:
            logger.error(f"Error updating rule set: {e}")
            raise
    
    async def delete_rule_set(self, rule_set_id: str):
        """Delete a rule set"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    DELETE FROM rule_sets WHERE rule_set_id = $1
                ''', rule_set_id)
                
        except Exception as e:
            logger.error(f"Error deleting rule set: {e}")
            raise
    
    async def track_rule_usage(self, usage_data: Dict[str, Any]):
        """Track rule usage"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO rule_usage (rule_set_id, rules_applied, phase, timestamp)
                    VALUES ($1, $2, $3, $4)
                ''',
                    usage_data["rule_set_id"],
                    json.dumps(usage_data["rules_applied"]),
                    usage_data["phase"],
                    usage_data["timestamp"]
                )
                
                # Update usage count in rule_sets table
                await conn.execute('''
                    UPDATE rule_sets SET 
                        usage_count = usage_count + 1,
                        last_used = $2
                    WHERE rule_set_id = $1
                ''', usage_data["rule_set_id"], usage_data["timestamp"])
                
        except Exception as e:
            logger.error(f"Error tracking rule usage: {e}")
            raise
    
    async def count_rule_sets(self) -> int:
        """Count total rule sets"""
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetchval('SELECT COUNT(*) FROM rule_sets')
        except Exception as e:
            logger.error(f"Error counting rule sets: {e}")
            return 0
    
    async def count_active_rule_sets(self) -> int:
        """Count active rule sets"""
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetchval('SELECT COUNT(*) FROM rule_sets WHERE is_active = true')
        except Exception as e:
            logger.error(f"Error counting active rule sets: {e}")
            return 0
    
    # Model configuration methods
    async def save_model_config(self, model_data: Dict[str, Any]):
        """Save or update model configuration"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO model_configs (
                        model_id, model_type, name, description, config, pricing,
                        is_active, health_status, last_health_check, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (model_id) DO UPDATE SET
                        model_type = $2,
                        name = $3,
                        description = $4,
                        config = $5,
                        pricing = $6,
                        is_active = $7,
                        health_status = $8,
                        last_health_check = $9,
                        updated_at = $10
                ''',
                    model_data["model_id"],
                    model_data["model_type"],
                    model_data["name"],
                    model_data["description"],
                    json.dumps(model_data["config"]),
                    json.dumps(model_data["pricing"]),
                    model_data["is_active"],
                    model_data["health_status"],
                    model_data.get("last_health_check"),
                    datetime.utcnow()
                )
                
        except Exception as e:
            logger.error(f"Error saving model config: {e}")
            raise
    
    async def get_model_config(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get model configuration"""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow('''
                    SELECT * FROM model_configs WHERE model_id = $1
                ''', model_id)
                
                if row:
                    result = dict(row)
                    result["config"] = json.loads(result["config"]) if result["config"] else {}
                    result["pricing"] = json.loads(result["pricing"]) if result["pricing"] else {}
                    return result
                return None
                
        except Exception as e:
            logger.error(f"Error getting model config: {e}")
            raise
    
    async def get_status(self) -> Dict[str, Any]:
        """Get database status"""
        try:
            if not self.pool:
                return {"status": "not_initialized"}
            
            async with self.pool.acquire() as conn:
                # Get basic stats
                usage_count = await conn.fetchval('SELECT COUNT(*) FROM token_usage')
                rule_sets_count = await conn.fetchval('SELECT COUNT(*) FROM rule_sets')
                models_count = await conn.fetchval('SELECT COUNT(*) FROM model_configs')
                
                # Get recent activity
                recent_usage = await conn.fetchval('''
                    SELECT COUNT(*) FROM token_usage 
                    WHERE timestamp >= NOW() - INTERVAL '24 hours'
                ''')
                
                return {
                    "status": "healthy",
                    "pool_size": self.pool.get_size(),
                    "pool_max_size": self.pool.get_max_size(),
                    "pool_min_size": self.pool.get_min_size(),
                    "total_usage_records": usage_count,
                    "total_rule_sets": rule_sets_count,
                    "total_models": models_count,
                    "recent_24h_usage": recent_usage,
                    "last_check": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }