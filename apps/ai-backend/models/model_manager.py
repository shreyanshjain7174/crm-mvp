"""
Model Manager - Orchestrates multiple AI models and handles fallbacks
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator
import time
import json
from datetime import datetime, timedelta
import aiohttp
import os

from schemas.ai_schemas import (
    AIRequest, AIResponse, ModelConfig, ModelType, 
    TokenUsage, StreamChunk, ModelPricing, PricingModel
)
from models.providers.openai_provider import OpenAIProvider
from models.providers.anthropic_provider import AnthropicProvider
from models.providers.huggingface_provider import HuggingFaceProvider
from models.providers.ollama_provider import OllamaProvider
from utils.logger import setup_logger

logger = setup_logger(__name__)

class ModelManager:
    """Manages multiple AI model providers and handles orchestration"""
    
    def __init__(self):
        self.providers: Dict[str, Any] = {}
        self.models: Dict[str, ModelConfig] = {}
        self.health_status: Dict[str, bool] = {}
        self.last_health_check: Dict[str, datetime] = {}
        self.request_counts: Dict[str, int] = {}
        self.response_times: Dict[str, List[float]] = {}
        
    async def initialize(self):
        """Initialize all model providers"""
        logger.info("Initializing AI model providers...")
        
        try:
            # Initialize OpenAI provider
            if os.getenv("OPENAI_API_KEY"):
                self.providers["openai"] = OpenAIProvider()
                await self.providers["openai"].initialize()
                logger.info("OpenAI provider initialized")
            
            # Initialize Anthropic provider
            if os.getenv("ANTHROPIC_API_KEY"):
                self.providers["anthropic"] = AnthropicProvider()
                await self.providers["anthropic"].initialize()
                logger.info("Anthropic provider initialized")
            
            # Initialize HuggingFace provider
            if os.getenv("HUGGINGFACE_API_KEY"):
                self.providers["huggingface"] = HuggingFaceProvider()
                await self.providers["huggingface"].initialize()
                logger.info("HuggingFace provider initialized")
            
            # Initialize Ollama provider (local models)
            try:
                self.providers["ollama"] = OllamaProvider()
                await self.providers["ollama"].initialize()
                logger.info("Ollama provider initialized")
            except Exception as e:
                logger.warning(f"Ollama provider failed to initialize: {e}")
            
            # Load model configurations
            await self._load_model_configs()
            
            # Start health check background task
            asyncio.create_task(self._health_check_loop())
            
            logger.info(f"Model manager initialized with {len(self.models)} models")
            
        except Exception as e:
            logger.error(f"Error initializing model manager: {e}")
            raise
    
    async def _load_model_configs(self):
        """Load model configurations from all providers"""
        self.models = {}
        
        for provider_name, provider in self.providers.items():
            try:
                provider_models = await provider.get_available_models()
                for model in provider_models:
                    self.models[model.model_id] = model
                    self.health_status[model.model_id] = True
                    self.request_counts[model.model_id] = 0
                    self.response_times[model.model_id] = []
                    
            except Exception as e:
                logger.error(f"Error loading models from {provider_name}: {e}")
    
    async def _health_check_loop(self):
        """Background task to check model health"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                await self._check_all_models_health()
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
    
    async def _check_all_models_health(self):
        """Check health of all models"""
        for model_id, model_config in self.models.items():
            try:
                provider = self.providers.get(model_config.model_type.value)
                if provider:
                    is_healthy = await provider.check_health(model_id)
                    self.health_status[model_id] = is_healthy
                    self.last_health_check[model_id] = datetime.utcnow()
                    
                    # Update model config
                    model_config.health_status = "healthy" if is_healthy else "unhealthy"
                    model_config.last_health_check = self.last_health_check[model_id]
                    
            except Exception as e:
                logger.error(f"Health check failed for model {model_id}: {e}")
                self.health_status[model_id] = False
    
    async def list_models(self) -> List[ModelConfig]:
        """List all available models"""
        return list(self.models.values())
    
    async def get_model(self, model_id: str) -> Optional[ModelConfig]:
        """Get specific model configuration"""
        return self.models.get(model_id)
    
    async def generate(self, request: AIRequest) -> AIResponse:
        """Generate AI response using the best available model"""
        start_time = time.time()
        request_id = f"req_{int(time.time() * 1000)}"
        
        # Determine which model to use
        model_to_use = await self._select_best_model(request)
        if not model_to_use:
            raise Exception("No available models for this request")
        
        try:
            # Get the provider for this model
            model_config = self.models[model_to_use]
            provider = self.providers.get(model_config.model_type.value)
            
            if not provider:
                raise Exception(f"Provider not available for model {model_to_use}")
            
            # Generate response
            response = await provider.generate(model_to_use, request)
            
            # Update response metadata
            response.request_id = request_id
            response.model_used = model_to_use
            response.processing_time_ms = (time.time() - start_time) * 1000
            
            # Calculate estimated cost
            response.estimated_cost = await self._calculate_cost(
                model_to_use, response.token_usage
            )
            
            # Update statistics
            self.request_counts[model_to_use] += 1
            self.response_times[model_to_use].append(response.processing_time_ms)
            
            # Keep only last 100 response times for averaging
            if len(self.response_times[model_to_use]) > 100:
                self.response_times[model_to_use] = self.response_times[model_to_use][-100:]
            
            logger.info(f"Generated response using {model_to_use} in {response.processing_time_ms:.2f}ms")
            return response
            
        except Exception as e:
            logger.error(f"Error generating with model {model_to_use}: {e}")
            
            # Try fallback models
            fallback_models = request.fallback_models or []
            for fallback_model in fallback_models:
                if (fallback_model in self.models and 
                    fallback_model != model_to_use and
                    self.health_status.get(fallback_model, False)):
                    
                    try:
                        logger.info(f"Trying fallback model: {fallback_model}")
                        model_config = self.models[fallback_model]
                        provider = self.providers.get(model_config.model_type.value)
                        
                        if provider:
                            response = await provider.generate(fallback_model, request)
                            response.request_id = request_id
                            response.model_used = fallback_model
                            response.processing_time_ms = (time.time() - start_time) * 1000
                            response.estimated_cost = await self._calculate_cost(
                                fallback_model, response.token_usage
                            )
                            
                            # Update statistics
                            self.request_counts[fallback_model] += 1
                            self.response_times[fallback_model].append(response.processing_time_ms)
                            
                            logger.info(f"Successfully used fallback model {fallback_model}")
                            return response
                            
                    except Exception as fallback_error:
                        logger.error(f"Fallback model {fallback_model} also failed: {fallback_error}")
                        continue
            
            # If all models failed
            raise Exception(f"All models failed. Last error: {str(e)}")
    
    async def generate_stream(self, request: AIRequest) -> AsyncGenerator[StreamChunk, None]:
        """Generate streaming AI response"""
        # Determine which model to use
        model_to_use = await self._select_best_model(request)
        if not model_to_use:
            raise Exception("No available models for this request")
        
        model_config = self.models[model_to_use]
        provider = self.providers.get(model_config.model_type.value)
        
        if not provider:
            raise Exception(f"Provider not available for model {model_to_use}")
        
        if not model_config.supports_streaming:
            raise Exception(f"Model {model_to_use} does not support streaming")
        
        # Stream response
        chunk_id = 0
        async for chunk in provider.generate_stream(model_to_use, request):
            chunk.chunk_id = chunk_id
            yield chunk
            chunk_id += 1
    
    async def _select_best_model(self, request: AIRequest) -> Optional[str]:
        """Select the best model for a request based on various factors"""
        
        # If a specific model is requested and available, use it
        if request.preferred_model:
            if (request.preferred_model in self.models and 
                self.health_status.get(request.preferred_model, False)):
                return request.preferred_model
        
        # Otherwise, select based on criteria
        available_models = [
            model_id for model_id, model_config in self.models.items()
            if self.health_status.get(model_id, False) and model_config.is_active
        ]
        
        if not available_models:
            return None
        
        # Score models based on various factors
        model_scores = {}
        for model_id in available_models:
            model_config = self.models[model_id]
            score = 0
            
            # Health score (0-100)
            if self.health_status.get(model_id, False):
                score += 50
            
            # Response time score (lower is better)
            avg_response_time = self._get_average_response_time(model_id)
            if avg_response_time > 0:
                # Invert and normalize (faster models get higher scores)
                score += max(0, 50 - (avg_response_time / 100))
            else:
                score += 25  # Default score for new models
            
            # Cost efficiency score (lower cost is better for similar quality)
            cost_score = self._get_cost_efficiency_score(model_id)
            score += cost_score
            
            # Capability matching
            if request.max_tokens and request.max_tokens <= model_config.max_tokens:
                score += 20
            
            # Model type preferences (can be customized)
            if model_config.model_type == ModelType.ANTHROPIC:
                score += 10  # Slight preference for Anthropic
            elif model_config.model_type == ModelType.OPENAI:
                score += 8
            elif model_config.model_type == ModelType.OLLAMA:
                score += 15  # Prefer local models for cost
            
            model_scores[model_id] = score
        
        # Return the highest scoring model
        best_model = max(model_scores.items(), key=lambda x: x[1])[0]
        logger.info(f"Selected model {best_model} with score {model_scores[best_model]}")
        
        return best_model
    
    def _get_average_response_time(self, model_id: str) -> float:
        """Get average response time for a model"""
        response_times = self.response_times.get(model_id, [])
        if not response_times:
            return 0
        return sum(response_times) / len(response_times)
    
    def _get_cost_efficiency_score(self, model_id: str) -> float:
        """Get cost efficiency score for a model (0-30 points)"""
        model_config = self.models.get(model_id)
        if not model_config:
            return 0
        
        # Simple cost scoring - lower cost gets higher score
        pricing = model_config.pricing
        if pricing.pricing_model == PricingModel.FREE:
            return 30
        elif pricing.pricing_model == PricingModel.PER_TOKEN:
            # Normalize token costs (assuming typical range 0.0001 to 0.01 per token)
            avg_cost = (pricing.input_token_cost + pricing.output_token_cost) / 2
            return max(0, 30 - (avg_cost * 3000))  # Scale factor
        else:
            return 15  # Default score for other pricing models
    
    async def _calculate_cost(self, model_id: str, token_usage: TokenUsage) -> float:
        """Calculate cost for token usage"""
        model_config = self.models.get(model_id)
        if not model_config:
            return 0.0
        
        pricing = model_config.pricing
        
        if pricing.pricing_model == PricingModel.FREE:
            return 0.0
        elif pricing.pricing_model == PricingModel.PER_TOKEN:
            input_cost = token_usage.input_tokens * pricing.input_token_cost
            output_cost = token_usage.output_tokens * pricing.output_token_cost
            return input_cost + output_cost
        elif pricing.pricing_model == PricingModel.PER_REQUEST:
            return pricing.request_cost
        else:
            return 0.0
    
    async def configure_model(self, model_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Configure model-specific settings"""
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        model_config = self.models[model_id]
        provider = self.providers.get(model_config.model_type.value)
        
        if not provider:
            raise ValueError(f"Provider not available for model {model_id}")
        
        # Update configuration
        result = await provider.configure_model(model_id, config)
        
        # Update model config if needed
        if "is_active" in config:
            model_config.is_active = config["is_active"]
        
        return result
    
    async def reload_models(self):
        """Reload all model configurations"""
        logger.info("Reloading all model configurations...")
        await self._load_model_configs()
        logger.info("Model configurations reloaded")
    
    async def get_status(self) -> Dict[str, Any]:
        """Get detailed status of model manager"""
        total_models = len(self.models)
        healthy_models = sum(1 for status in self.health_status.values() if status)
        
        provider_status = {}
        for provider_name, provider in self.providers.items():
            try:
                provider_status[provider_name] = await provider.get_status()
            except Exception as e:
                provider_status[provider_name] = {"status": "error", "error": str(e)}
        
        return {
            "status": "healthy" if healthy_models > 0 else "unhealthy",
            "total_models": total_models,
            "healthy_models": healthy_models,
            "providers": provider_status,
            "total_requests": sum(self.request_counts.values()),
            "average_response_times": {
                model_id: self._get_average_response_time(model_id)
                for model_id in self.models.keys()
            }
        }