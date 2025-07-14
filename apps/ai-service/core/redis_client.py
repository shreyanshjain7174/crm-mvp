"""
Redis client for task queue and caching
"""

import redis.asyncio as redis
import json
from core.config import settings

# Global Redis client
redis_client = None

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # Test connection
    await redis_client.ping()

async def get_redis():
    """Get Redis client"""
    return redis_client

class RedisManager:
    """Redis operations manager"""
    
    @staticmethod
    async def set_json(key: str, data: dict, expire: int = None):
        """Store JSON data in Redis"""
        json_data = json.dumps(data)
        await redis_client.set(key, json_data, ex=expire)
    
    @staticmethod
    async def get_json(key: str):
        """Get JSON data from Redis"""
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    
    @staticmethod
    async def delete(key: str):
        """Delete key from Redis"""
        await redis_client.delete(key)
    
    @staticmethod
    async def publish(channel: str, message: dict):
        """Publish message to Redis channel"""
        await redis_client.publish(channel, json.dumps(message))
    
    @staticmethod
    async def subscribe(channel: str):
        """Subscribe to Redis channel"""
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub