"""
OpenAI Provider - Handles OpenAI API models
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator
import openai
import time
import os
from datetime import datetime

from schemas.ai_schemas import (
    AIRequest, AIResponse, ModelConfig, ModelType, 
    TokenUsage, StreamChunk, ModelPricing, PricingModel
)
from utils.logger import setup_logger

logger = setup_logger(__name__)

class OpenAIProvider:
    """Provider for OpenAI models"""
    
    def __init__(self):
        self.client = None
        self.available_models = {}
        
    async def initialize(self):
        """Initialize OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = openai.AsyncOpenAI(api_key=api_key)
        
        # Test connection
        try:
            models = await self.client.models.list()
            logger.info(f"OpenAI provider initialized with {len(models.data)} models")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI provider: {e}")
            raise
    
    async def get_available_models(self) -> List[ModelConfig]:
        """Get list of available OpenAI models"""
        if not self.client:
            raise RuntimeError("Provider not initialized")
        
        try:
            models_response = await self.client.models.list()
            models = []
            
            # Define model configurations for popular OpenAI models
            model_configs = {
                "gpt-4": {
                    "name": "GPT-4",
                    "description": "Most capable GPT-4 model for complex tasks",
                    "max_tokens": 8192,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "input_cost": 0.03,  # per 1K tokens
                    "output_cost": 0.06
                },
                "gpt-4-turbo": {
                    "name": "GPT-4 Turbo",
                    "description": "Latest GPT-4 model with improved efficiency",
                    "max_tokens": 4096,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "supports_vision": True,
                    "input_cost": 0.01,
                    "output_cost": 0.03
                },
                "gpt-3.5-turbo": {
                    "name": "GPT-3.5 Turbo",
                    "description": "Fast and efficient model for most tasks",
                    "max_tokens": 4096,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "input_cost": 0.0015,
                    "output_cost": 0.002
                },
                "gpt-3.5-turbo-16k": {
                    "name": "GPT-3.5 Turbo 16K",
                    "description": "Extended context version of GPT-3.5 Turbo",
                    "max_tokens": 16385,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "input_cost": 0.003,
                    "output_cost": 0.004
                }
            }
            
            for model in models_response.data:
                model_id = model.id
                
                # Only include models we have configurations for
                if model_id in model_configs:
                    config = model_configs[model_id]
                    
                    pricing = ModelPricing(
                        model_id=model_id,
                        pricing_model=PricingModel.PER_TOKEN,
                        input_token_cost=config["input_cost"] / 1000,  # Convert to per token
                        output_token_cost=config["output_cost"] / 1000,
                        currency="USD"
                    )
                    
                    model_config = ModelConfig(
                        model_id=model_id,
                        model_type=ModelType.OPENAI,
                        name=config["name"],
                        description=config["description"],
                        max_tokens=config["max_tokens"],
                        supports_streaming=config["supports_streaming"],
                        supports_functions=config["supports_functions"],
                        supports_vision=config.get("supports_vision", False),
                        pricing=pricing,
                        is_active=True,
                        health_status="healthy"
                    )
                    
                    models.append(model_config)
                    self.available_models[model_id] = model_config
            
            logger.info(f"Loaded {len(models)} OpenAI model configurations")
            return models
            
        except Exception as e:
            logger.error(f"Error fetching OpenAI models: {e}")
            raise
    
    async def generate(self, model_id: str, request: AIRequest) -> AIResponse:
        """Generate response using OpenAI model"""
        if not self.client:
            raise RuntimeError("Provider not initialized")
        
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not available")
        
        try:
            # Prepare messages
            messages = [{"role": "user", "content": request.prompt}]
            
            # Add context if provided
            if request.context:
                system_message = self._build_system_message(request.context)
                if system_message:
                    messages.insert(0, {"role": "system", "content": system_message})
            
            # Prepare parameters
            params = {
                "model": model_id,
                "messages": messages,
                "max_tokens": request.max_tokens or 1000,
                "temperature": request.temperature or 0.7,
                "top_p": request.top_p or 1.0,
            }
            
            # Make API call
            start_time = time.time()
            response = await self.client.chat.completions.create(**params)
            processing_time = (time.time() - start_time) * 1000
            
            # Extract response content
            content = ""
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content or ""
            
            # Calculate token usage
            usage = response.usage
            token_usage = TokenUsage(
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0
            )
            
            # Create response
            ai_response = AIResponse(
                content=content,
                model_used=model_id,
                request_id="",  # Will be set by model manager
                processing_time_ms=processing_time,
                token_usage=token_usage
            )
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error generating with OpenAI model {model_id}: {e}")
            raise
    
    async def generate_stream(self, model_id: str, request: AIRequest) -> AsyncGenerator[StreamChunk, None]:
        """Generate streaming response using OpenAI model"""
        if not self.client:
            raise RuntimeError("Provider not initialized")
        
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not available")
        
        try:
            # Prepare messages
            messages = [{"role": "user", "content": request.prompt}]
            
            # Add context if provided
            if request.context:
                system_message = self._build_system_message(request.context)
                if system_message:
                    messages.insert(0, {"role": "system", "content": system_message})
            
            # Prepare parameters
            params = {
                "model": model_id,
                "messages": messages,
                "max_tokens": request.max_tokens or 1000,
                "temperature": request.temperature or 0.7,
                "top_p": request.top_p or 1.0,
                "stream": True
            }
            
            # Stream response
            chunk_id = 0
            total_content = ""
            
            async for chunk in await self.client.chat.completions.create(**params):
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        total_content += content
                        
                        stream_chunk = StreamChunk(
                            chunk_id=chunk_id,
                            content=content,
                            is_final=False
                        )
                        yield stream_chunk
                        chunk_id += 1
            
            # Send final chunk with metadata
            final_chunk = StreamChunk(
                chunk_id=chunk_id,
                content="",
                is_final=True,
                total_tokens=len(total_content.split()),  # Approximate
                model_used=model_id
            )
            yield final_chunk
            
        except Exception as e:
            logger.error(f"Error streaming with OpenAI model {model_id}: {e}")
            raise
    
    async def check_health(self, model_id: str) -> bool:
        """Check if model is healthy and available"""
        if not self.client:
            return False
        
        try:
            # Try a simple completion to test the model
            test_params = {
                "model": model_id,
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 5
            }
            
            await self.client.chat.completions.create(**test_params)
            return True
            
        except Exception as e:
            logger.warning(f"Health check failed for OpenAI model {model_id}: {e}")
            return False
    
    async def configure_model(self, model_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Configure model-specific settings"""
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not found")
        
        # OpenAI models don't have much runtime configuration
        # This is more for updating our local model config
        
        result = {"model_id": model_id, "updated_settings": {}}
        
        # Update local configuration
        model_config = self.available_models[model_id]
        
        if "is_active" in config:
            model_config.is_active = config["is_active"]
            result["updated_settings"]["is_active"] = config["is_active"]
        
        return result
    
    async def get_status(self) -> Dict[str, Any]:
        """Get provider status"""
        if not self.client:
            return {"status": "not_initialized"}
        
        try:
            # Test API connectivity
            models = await self.client.models.list()
            
            return {
                "status": "healthy",
                "models_available": len(self.available_models),
                "api_accessible": True,
                "last_check": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "models_available": len(self.available_models),
                "api_accessible": False,
                "last_check": datetime.utcnow().isoformat()
            }
    
    def _build_system_message(self, context: Dict[str, Any]) -> Optional[str]:
        """Build system message from context"""
        system_parts = []
        
        if context.get("lead_id"):
            system_parts.append("You are an AI assistant helping with CRM lead management.")
        
        if context.get("language"):
            system_parts.append(f"Respond in {context['language']} language.")
        
        if context.get("message_type"):
            message_type = context["message_type"]
            if message_type == "whatsapp":
                system_parts.append("Keep responses concise and suitable for WhatsApp messaging.")
            elif message_type == "email":
                system_parts.append("Format response as professional email content.")
        
        if context.get("tone"):
            system_parts.append(f"Use a {context['tone']} tone in your response.")
        
        return " ".join(system_parts) if system_parts else None