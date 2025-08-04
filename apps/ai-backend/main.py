"""
AI Backend Service - FastAPI application for multi-model AI orchestration
Supports OpenAI, Anthropic, and open-source models with token pricing and custom rules
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Dict, List, Optional, Any
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

from models.model_manager import ModelManager
from models.token_tracker import TokenTracker
from rules.rule_engine import RuleEngine
from schemas.ai_schemas import (
    AIRequest, AIResponse, ModelConfig, TokenUsage,
    CustomRule, RuleSet, ModelStats
)
from database.db_manager import DatabaseManager
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Setup logging
logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting AI Backend Service...")
    
    # Initialize core services
    app.state.db_manager = DatabaseManager()
    await app.state.db_manager.initialize()
    
    app.state.model_manager = ModelManager()
    await app.state.model_manager.initialize()
    
    app.state.token_tracker = TokenTracker(app.state.db_manager)
    app.state.rule_engine = RuleEngine(app.state.db_manager)
    
    logger.info("AI Backend Service started successfully")
    yield
    
    # Cleanup
    logger.info("Shutting down AI Backend Service...")
    await app.state.db_manager.close()

# Create FastAPI app
app = FastAPI(
    title="AI Backend Service",
    description="Multi-model AI orchestration service with custom rules and token tracking",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ai-backend",
        "version": "1.0.0"
    }

# Model management endpoints
@app.get("/models", response_model=List[ModelConfig])
async def list_models():
    """List all available AI models"""
    try:
        models = await app.state.model_manager.list_models()
        return models
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/{model_id}/stats", response_model=ModelStats)
async def get_model_stats(model_id: str):
    """Get usage statistics for a specific model"""
    try:
        stats = await app.state.token_tracker.get_model_stats(model_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting model stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI generation endpoints
@app.post("/generate", response_model=AIResponse)
async def generate_response(
    request: AIRequest,
    background_tasks: BackgroundTasks
):
    """Generate AI response using the best available model"""
    try:
        # Apply custom rules if specified
        if request.rule_set_id:
            rules = await app.state.rule_engine.get_rule_set(request.rule_set_id)
            request = await app.state.rule_engine.apply_input_rules(request, rules)
        
        # Generate response using model manager
        response = await app.state.model_manager.generate(request)
        
        # Apply output rules if specified
        if request.rule_set_id:
            rules = await app.state.rule_engine.get_rule_set(request.rule_set_id)
            response = await app.state.rule_engine.apply_output_rules(response, rules)
        
        # Track token usage in background
        background_tasks.add_task(
            app.state.token_tracker.track_usage,
            response.model_used,
            response.token_usage,
            request.user_id or "anonymous"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/stream")
async def generate_stream(request: AIRequest):
    """Generate streaming AI response"""
    try:
        async def event_generator():
            async for chunk in app.state.model_manager.generate_stream(request):
                yield f"data: {chunk.json()}\n\n"
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            event_generator(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache"}
        )
        
    except Exception as e:
        logger.error(f"Error generating stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Custom rules endpoints
@app.post("/rules/sets", response_model=RuleSet)
async def create_rule_set(rule_set: RuleSet):
    """Create a new rule set"""
    try:
        created_rule_set = await app.state.rule_engine.create_rule_set(rule_set)
        return created_rule_set
    except Exception as e:
        logger.error(f"Error creating rule set: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules/sets", response_model=List[RuleSet])
async def list_rule_sets(user_id: Optional[str] = None):
    """List all rule sets for a user"""
    try:
        rule_sets = await app.state.rule_engine.list_rule_sets(user_id)
        return rule_sets
    except Exception as e:
        logger.error(f"Error listing rule sets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules/sets/{rule_set_id}", response_model=RuleSet)
async def get_rule_set(rule_set_id: str):
    """Get a specific rule set"""
    try:
        rule_set = await app.state.rule_engine.get_rule_set(rule_set_id)
        if not rule_set:
            raise HTTPException(status_code=404, detail="Rule set not found")
        return rule_set
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting rule set: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/rules/sets/{rule_set_id}", response_model=RuleSet)
async def update_rule_set(rule_set_id: str, rule_set: RuleSet):
    """Update a rule set"""
    try:
        updated_rule_set = await app.state.rule_engine.update_rule_set(rule_set_id, rule_set)
        return updated_rule_set
    except Exception as e:
        logger.error(f"Error updating rule set: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rules/sets/{rule_set_id}")
async def delete_rule_set(rule_set_id: str):
    """Delete a rule set"""
    try:
        await app.state.rule_engine.delete_rule_set(rule_set_id)
        return {"message": "Rule set deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting rule set: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Token usage and pricing endpoints
@app.get("/usage/user/{user_id}")
async def get_user_usage(user_id: str, days: int = 30):
    """Get token usage statistics for a user"""
    try:
        usage = await app.state.token_tracker.get_user_usage(user_id, days)
        return usage
    except Exception as e:
        logger.error(f"Error getting user usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usage/total")
async def get_total_usage(days: int = 30):
    """Get total system usage statistics"""
    try:
        usage = await app.state.token_tracker.get_total_usage(days)
        return usage
    except Exception as e:
        logger.error(f"Error getting total usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pricing/calculate")
async def calculate_pricing(request: dict):
    """Calculate pricing for token usage"""
    try:
        pricing = await app.state.token_tracker.calculate_pricing(
            request.get("model_id"),
            request.get("input_tokens", 0),
            request.get("output_tokens", 0)
        )
        return pricing
    except Exception as e:
        logger.error(f"Error calculating pricing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model configuration endpoints
@app.post("/models/{model_id}/configure")
async def configure_model(model_id: str, config: dict):
    """Configure model-specific settings"""
    try:
        result = await app.state.model_manager.configure_model(model_id, config)
        return result
    except Exception as e:
        logger.error(f"Error configuring model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/models/{model_id}/test")
async def test_model(model_id: str, test_request: AIRequest):
    """Test a specific model with a sample request"""
    try:
        # Force use of specific model
        test_request.preferred_model = model_id
        response = await app.state.model_manager.generate(test_request)
        return response
    except Exception as e:
        logger.error(f"Error testing model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# System management endpoints
@app.post("/system/reload-models")
async def reload_models():
    """Reload all AI models"""
    try:
        await app.state.model_manager.reload_models()
        return {"message": "Models reloaded successfully"}
    except Exception as e:
        logger.error(f"Error reloading models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/status")
async def system_status():
    """Get detailed system status"""
    try:
        status = {
            "timestamp": datetime.utcnow().isoformat(),
            "models": await app.state.model_manager.get_status(),
            "database": await app.state.db_manager.get_status(),
            "token_tracker": await app.state.token_tracker.get_status(),
            "rule_engine": await app.state.rule_engine.get_status()
        }
        return status
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AI_BACKEND_PORT", 8002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )