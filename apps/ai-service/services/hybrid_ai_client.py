"""
Hybrid AI Client - Integrates local Ollama and cloud AI providers with fallback
"""

import asyncio
import httpx
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import json

from core.config import settings
from services.vector_store import VectorStore

# Cloud AI clients
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

logger = logging.getLogger(__name__)

class HybridAIClient:
    """
    Hybrid AI client that tries local Ollama first, then falls back to cloud providers
    """
    
    def __init__(self):
        self.vector_store = VectorStore()
        self.ollama_client = None
        self.anthropic_client = None
        self.openai_client = None
        
        # Initialize clients
        self._init_clients()
    
    def _init_clients(self):
        """Initialize AI clients based on configuration"""
        
        # Initialize Ollama client (HTTP-based)
        if settings.OLLAMA_ENABLED:
            self.ollama_base_url = f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}"
            logger.info(f"Ollama client configured for {self.ollama_base_url}")
        
        # Initialize Anthropic client
        if ANTHROPIC_AVAILABLE and settings.ANTHROPIC_API_KEY:
            self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            logger.info("Anthropic client initialized")
        
        # Initialize OpenAI client
        if OPENAI_AVAILABLE and settings.OPENAI_API_KEY:
            self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized")
    
    async def generate_completion(
        self, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None,
        use_rag: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Generate completion using hybrid approach with RAG
        """
        
        try:
            # Step 1: RAG - Retrieve relevant context if enabled
            rag_context = ""
            if use_rag and context:
                rag_context = await self._get_rag_context(prompt, context)
            
            # Step 2: Build enhanced prompt
            enhanced_prompt = self._build_enhanced_prompt(prompt, rag_context, context)
            
            # Step 3: Try providers in priority order
            for provider in settings.AI_PROVIDER_PRIORITY:
                try:
                    if provider == "ollama" and settings.OLLAMA_ENABLED:
                        result = await self._generate_with_ollama(enhanced_prompt, temperature, max_tokens)
                        if result:
                            return {
                                "success": True,
                                "provider": "ollama",
                                "content": result,
                                "rag_used": bool(rag_context),
                                "timestamp": datetime.utcnow().isoformat()
                            }
                    
                    elif provider == "anthropic" and self.anthropic_client:
                        result = await self._generate_with_anthropic(enhanced_prompt, temperature, max_tokens)
                        if result:
                            return {
                                "success": True,
                                "provider": "anthropic", 
                                "content": result,
                                "rag_used": bool(rag_context),
                                "timestamp": datetime.utcnow().isoformat()
                            }
                    
                    elif provider == "openai" and self.openai_client:
                        result = await self._generate_with_openai(enhanced_prompt, temperature, max_tokens)
                        if result:
                            return {
                                "success": True,
                                "provider": "openai",
                                "content": result,
                                "rag_used": bool(rag_context),
                                "timestamp": datetime.utcnow().isoformat()
                            }
                    
                except Exception as e:
                    logger.warning(f"Provider {provider} failed: {str(e)}")
                    continue
            
            # All providers failed
            return {
                "success": False,
                "error": "All AI providers failed",
                "fallback_content": self._generate_fallback_response(prompt, context),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Completion generation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fallback_content": self._generate_fallback_response(prompt, context),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _get_rag_context(self, query: str, context: Dict[str, Any]) -> str:
        """Retrieve relevant context using RAG"""
        try:
            # Search vector store for relevant information
            search_results = await self.vector_store.similarity_search(
                query=query,
                top_k=settings.RAG_TOP_K,
                threshold=settings.RAG_SIMILARITY_THRESHOLD
            )
            
            if not search_results:
                return ""
            
            # Format context
            rag_context = "Relevant CRM Information:\n"
            for i, result in enumerate(search_results, 1):
                rag_context += f"{i}. {result.get('content', '')}\n"
            
            return rag_context[:settings.RAG_MAX_CONTEXT_LENGTH]
            
        except Exception as e:
            logger.warning(f"RAG context retrieval failed: {str(e)}")
            return ""
    
    def _build_enhanced_prompt(self, original_prompt: str, rag_context: str, context: Optional[Dict[str, Any]]) -> str:
        """Build enhanced prompt with RAG context and system context"""
        
        system_context = ""
        if context:
            lead_data = context.get("lead_data", {})
            if lead_data:
                system_context = f"""
Lead Information:
- Name: {lead_data.get('name', 'Unknown')}
- Phone: {lead_data.get('phone', 'Unknown')}
- Status: {lead_data.get('status', 'Unknown')}
- Source: {lead_data.get('source', 'Unknown')}
"""
        
        enhanced_prompt = f"""You are an AI assistant for a CRM system designed for Indian SMEs. You help with lead management, WhatsApp communication, and sales automation.

{system_context}

{rag_context}

User Request: {original_prompt}

Please provide a helpful, professional response that considers the Indian business context and WhatsApp communication style. Keep responses concise and actionable."""
        
        return enhanced_prompt
    
    async def _generate_with_ollama(self, prompt: str, temperature: float, max_tokens: int) -> Optional[str]:
        """Generate completion using local Ollama"""
        try:
            async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "").strip()
                
        except Exception as e:
            logger.error(f"Ollama generation failed: {str(e)}")
            
        return None
    
    async def _generate_with_anthropic(self, prompt: str, temperature: float, max_tokens: int) -> Optional[str]:
        """Generate completion using Anthropic Claude"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.anthropic_client.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    messages=[{"role": "user", "content": prompt}]
                )
            )
            
            if response.content:
                return response.content[0].text.strip()
                
        except Exception as e:
            logger.error(f"Anthropic generation failed: {str(e)}")
            
        return None
    
    async def _generate_with_openai(self, prompt: str, temperature: float, max_tokens: int) -> Optional[str]:
        """Generate completion using OpenAI"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature
                )
            )
            
            if response.choices:
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            logger.error(f"OpenAI generation failed: {str(e)}")
            
        return None
    
    def _generate_fallback_response(self, prompt: str, context: Optional[Dict[str, Any]]) -> str:
        """Generate rule-based fallback response when all AI providers fail"""
        
        prompt_lower = prompt.lower()
        
        if "message" in prompt_lower or "reply" in prompt_lower:
            lead_name = context.get("lead_data", {}).get("name", "there") if context else "there"
            return f"Hi {lead_name}! Thank you for reaching out. I'll get back to you shortly with more information."
        
        elif "qualify" in prompt_lower or "score" in prompt_lower:
            return "This lead requires manual review. Please analyze their information and assign appropriate priority."
        
        elif "follow" in prompt_lower:
            return "Schedule a follow-up call or message within 2-3 business days."
        
        else:
            return "I'm experiencing technical difficulties. Please try again later or contact support."
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of all AI providers"""
        
        health = {
            "timestamp": datetime.utcnow().isoformat(),
            "providers": {}
        }
        
        # Check Ollama
        if settings.OLLAMA_ENABLED:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(f"{self.ollama_base_url}/api/tags")
                    health["providers"]["ollama"] = {
                        "available": response.status_code == 200,
                        "model": settings.OLLAMA_MODEL,
                        "endpoint": self.ollama_base_url
                    }
            except:
                health["providers"]["ollama"] = {"available": False}
        
        # Check Anthropic
        health["providers"]["anthropic"] = {
            "available": bool(self.anthropic_client),
            "api_key_configured": bool(settings.ANTHROPIC_API_KEY)
        }
        
        # Check OpenAI
        health["providers"]["openai"] = {
            "available": bool(self.openai_client),
            "api_key_configured": bool(settings.OPENAI_API_KEY)
        }
        
        # Check Vector Store
        vector_health = await self.vector_store.health_check()
        health["vector_store"] = vector_health
        
        return health