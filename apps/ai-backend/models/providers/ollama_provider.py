"""
Ollama Provider - Handles local open-source models via Ollama
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator
import aiohttp
import json
import time
import os
from datetime import datetime

from schemas.ai_schemas import (
    AIRequest, AIResponse, ModelConfig, ModelType, 
    TokenUsage, StreamChunk, ModelPricing, PricingModel
)
from utils.logger import setup_logger

logger = setup_logger(__name__)

class OllamaProvider:
    """Provider for Ollama local models"""
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.available_models = {}
        self.session = None
        
    async def initialize(self):
        """Initialize Ollama provider"""
        self.session = aiohttp.ClientSession()
        
        # Test connection to Ollama
        try:
            async with self.session.get(f"{self.base_url}/api/tags") as response:
                if response.status == 200:
                    models_data = await response.json()
                    logger.info(f"Ollama provider initialized with {len(models_data.get('models', []))} models")
                else:
                    raise Exception(f"Ollama API returned status {response.status}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama provider: {e}")
            raise
    
    async def get_available_models(self) -> List[ModelConfig]:
        """Get list of available Ollama models"""
        if not self.session:
            raise RuntimeError("Provider not initialized")
        
        try:
            async with self.session.get(f"{self.base_url}/api/tags") as response:
                if response.status != 200:
                    raise Exception(f"Ollama API returned status {response.status}")
                
                data = await response.json()
                models = []
                
                # Define configurations for common open-source models
                model_configs = {
                    "llama2": {
                        "name": "Llama 2",
                        "description": "Meta's Llama 2 model - excellent for general tasks",
                        "max_tokens": 4096,
                        "supports_streaming": True
                    },
                    "llama2:13b": {
                        "name": "Llama 2 13B",
                        "description": "Larger Llama 2 model with better performance",
                        "max_tokens": 4096,
                        "supports_streaming": True
                    },
                    "llama2:70b": {
                        "name": "Llama 2 70B",
                        "description": "Largest Llama 2 model for complex tasks",
                        "max_tokens": 4096,
                        "supports_streaming": True
                    },
                    "mistral": {
                        "name": "Mistral 7B",
                        "description": "Mistral 7B model - fast and efficient",
                        "max_tokens": 8192,
                        "supports_streaming": True
                    },
                    "mixtral": {
                        "name": "Mixtral 8x7B",
                        "description": "Mixtral mixture of experts model",
                        "max_tokens": 32768,
                        "supports_streaming": True
                    },
                    "codellama": {
                        "name": "Code Llama",
                        "description": "Specialized model for code generation",
                        "max_tokens": 4096,
                        "supports_streaming": True
                    },
                    "phi": {
                        "name": "Phi-2",
                        "description": "Microsoft Phi-2 small but capable model",
                        "max_tokens": 2048,
                        "supports_streaming": True
                    },
                    "gemma": {
                        "name": "Gemma",
                        "description": "Google's Gemma lightweight model",
                        "max_tokens": 8192,
                        "supports_streaming": True
                    },
                    "neural-chat": {
                        "name": "Neural Chat",
                        "description": "Intel's Neural Chat model optimized for conversations",
                        "max_tokens": 4096,
                        "supports_streaming": True
                    }
                }
                
                for model_data in data.get("models", []):
                    model_name = model_data.get("name", "")
                    base_name = model_name.split(":")[0]  # Remove tag
                    
                    # Use base name to find config, fallback to model name
                    config = model_configs.get(base_name) or model_configs.get(model_name)
                    
                    if not config:
                        # Create default config for unknown models
                        config = {
                            "name": model_name.title(),
                            "description": f"Open source model: {model_name}",
                            "max_tokens": 4096,
                            "supports_streaming": True
                        }
                    
                    # All Ollama models are free (local execution)
                    pricing = ModelPricing(
                        model_id=model_name,
                        pricing_model=PricingModel.FREE,
                        input_token_cost=0.0,
                        output_token_cost=0.0,
                        currency="USD"
                    )
                    
                    model_config = ModelConfig(
                        model_id=model_name,
                        model_type=ModelType.OLLAMA,
                        name=config["name"],
                        description=config["description"],
                        max_tokens=config["max_tokens"],
                        supports_streaming=config["supports_streaming"],
                        supports_functions=False,  # Most open source models don't support function calling
                        supports_vision=False,    # Add vision support detection later
                        pricing=pricing,
                        is_active=True,
                        health_status="healthy"
                    )
                    
                    models.append(model_config)
                    self.available_models[model_name] = model_config
                
                logger.info(f"Loaded {len(models)} Ollama model configurations")
                return models
                
        except Exception as e:
            logger.error(f"Error fetching Ollama models: {e}")
            raise
    
    async def generate(self, model_id: str, request: AIRequest) -> AIResponse:
        """Generate response using Ollama model"""
        if not self.session:
            raise RuntimeError("Provider not initialized")
        
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not available")
        
        try:
            # Build prompt with context
            prompt = self._build_prompt(request)
            
            # Prepare request payload
            payload = {
                "model": model_id,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": request.temperature or 0.7,
                    "top_p": request.top_p or 1.0,
                    "num_predict": request.max_tokens or 1000,
                }
            }
            
            if request.top_k:
                payload["options"]["top_k"] = request.top_k
            
            # Make API call
            start_time = time.time()
            
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)  # 2 minutes timeout
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Ollama API error {response.status}: {error_text}")
                
                result = await response.json()
                processing_time = (time.time() - start_time) * 1000
                
                # Extract response content
                content = result.get("response", "")
                
                # Estimate token usage (Ollama doesn't provide exact counts)
                input_tokens = self._estimate_tokens(prompt)
                output_tokens = self._estimate_tokens(content)
                
                token_usage = TokenUsage(
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=input_tokens + output_tokens
                )
                
                # Create response
                ai_response = AIResponse(
                    content=content,
                    model_used=model_id,
                    request_id="",  # Will be set by model manager
                    processing_time_ms=processing_time,
                    token_usage=token_usage,
                    estimated_cost=0.0  # Free for local models
                )
                
                return ai_response
                
        except Exception as e:
            logger.error(f"Error generating with Ollama model {model_id}: {e}")
            raise
    
    async def generate_stream(self, model_id: str, request: AIRequest) -> AsyncGenerator[StreamChunk, None]:
        """Generate streaming response using Ollama model"""
        if not self.session:
            raise RuntimeError("Provider not initialized")
        
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not available")
        
        try:
            # Build prompt with context
            prompt = self._build_prompt(request)
            
            # Prepare request payload
            payload = {
                "model": model_id,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": request.temperature or 0.7,
                    "top_p": request.top_p or 1.0,
                    "num_predict": request.max_tokens or 1000,
                }
            }
            
            if request.top_k:
                payload["options"]["top_k"] = request.top_k
            
            # Stream response
            chunk_id = 0
            total_content = ""
            
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes for streaming
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Ollama API error {response.status}: {error_text}")
                
                async for line in response.content:
                    if line:
                        try:
                            chunk_data = json.loads(line.decode('utf-8'))
                            
                            if "response" in chunk_data:
                                content = chunk_data["response"]
                                total_content += content
                                
                                stream_chunk = StreamChunk(
                                    chunk_id=chunk_id,
                                    content=content,
                                    is_final=chunk_data.get("done", False)
                                )
                                yield stream_chunk
                                chunk_id += 1
                                
                                if chunk_data.get("done", False):
                                    break
                                    
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse chunk: {e}")
                            continue
            
            # Send final chunk with metadata
            final_chunk = StreamChunk(
                chunk_id=chunk_id,
                content="",
                is_final=True,
                total_tokens=self._estimate_tokens(total_content),
                model_used=model_id
            )
            yield final_chunk
            
        except Exception as e:
            logger.error(f"Error streaming with Ollama model {model_id}: {e}")
            raise
    
    async def check_health(self, model_id: str) -> bool:
        """Check if model is healthy and available"""
        if not self.session:
            return False
        
        try:
            # Test with a simple generation
            payload = {
                "model": model_id,
                "prompt": "Hello",
                "stream": False,
                "options": {"num_predict": 5}
            }
            
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                return response.status == 200
                
        except Exception as e:
            logger.warning(f"Health check failed for Ollama model {model_id}: {e}")
            return False
    
    async def configure_model(self, model_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Configure model-specific settings"""
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not found")
        
        result = {"model_id": model_id, "updated_settings": {}}
        
        # Update local configuration
        model_config = self.available_models[model_id]
        
        if "is_active" in config:
            model_config.is_active = config["is_active"]
            result["updated_settings"]["is_active"] = config["is_active"]
        
        # Ollama models can be pulled/removed
        if "pull_model" in config and config["pull_model"]:
            try:
                async with self.session.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_id}
                ) as response:
                    if response.status == 200:
                        result["updated_settings"]["pulled"] = True
                    else:
                        result["updated_settings"]["pull_error"] = f"Status {response.status}"
            except Exception as e:
                result["updated_settings"]["pull_error"] = str(e)
        
        return result
    
    async def get_status(self) -> Dict[str, Any]:
        """Get provider status"""
        if not self.session:
            return {"status": "not_initialized"}
        
        try:
            # Test Ollama connectivity
            async with self.session.get(f"{self.base_url}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "status": "healthy",
                        "models_available": len(self.available_models),
                        "ollama_accessible": True,
                        "base_url": self.base_url,
                        "loaded_models": len(data.get("models", [])),
                        "last_check": datetime.utcnow().isoformat()
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "error": f"Ollama API returned status {response.status}",
                        "models_available": len(self.available_models),
                        "ollama_accessible": False,
                        "base_url": self.base_url,
                        "last_check": datetime.utcnow().isoformat()
                    }
                    
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "models_available": len(self.available_models),
                "ollama_accessible": False,
                "base_url": self.base_url,
                "last_check": datetime.utcnow().isoformat()
            }
    
    def _build_prompt(self, request: AIRequest) -> str:
        """Build prompt with context for Ollama models"""
        parts = []
        
        # Add context as system instructions
        if request.context:
            context_parts = []
            
            if request.context.get("lead_id"):
                context_parts.append("You are an AI assistant helping with CRM lead management.")
            
            if request.context.get("language"):
                context_parts.append(f"Respond in {request.context['language']} language.")
            
            if request.context.get("message_type"):
                message_type = request.context["message_type"]
                if message_type == "whatsapp":
                    context_parts.append("Keep responses concise and suitable for WhatsApp messaging.")
                elif message_type == "email":
                    context_parts.append("Format response as professional email content.")
            
            if request.context.get("tone"):
                context_parts.append(f"Use a {request.context['tone']} tone in your response.")
            
            if context_parts:
                parts.append("System: " + " ".join(context_parts))
        
        # Add the main prompt
        parts.append(f"Human: {request.prompt}")
        parts.append("Assistant:")
        
        return "\n\n".join(parts)
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        if not text:
            return 0
        
        # Very rough estimation: ~4 characters per token for English
        # This is not accurate but gives a reasonable approximation
        return max(1, len(text) // 4)
    
    async def close(self):
        """Close the provider and cleanup resources"""
        if self.session:
            await self.session.close()
            self.session = None