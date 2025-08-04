"""
Pydantic schemas for AI backend service
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum

class ModelType(str, Enum):
    """Supported AI model types"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"
    CUSTOM = "custom"

class RuleType(str, Enum):
    """Types of rules that can be applied"""
    INPUT_FILTER = "input_filter"
    OUTPUT_FILTER = "output_filter"
    CONTENT_MODERATION = "content_moderation"
    PROMPT_ENHANCEMENT = "prompt_enhancement"
    RESPONSE_FORMATTING = "response_formatting"
    COST_OPTIMIZATION = "cost_optimization"

class PricingModel(str, Enum):
    """Pricing models for token usage"""
    PER_TOKEN = "per_token"
    PER_REQUEST = "per_request"
    SUBSCRIPTION = "subscription"
    FREE = "free"

# Token usage schemas
class TokenUsage(BaseModel):
    """Token usage information"""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    currency: str = "USD"

class ModelPricing(BaseModel):
    """Pricing configuration for a model"""
    model_id: str
    pricing_model: PricingModel
    input_token_cost: float = 0.0  # Cost per input token
    output_token_cost: float = 0.0  # Cost per output token
    request_cost: float = 0.0  # Cost per request
    currency: str = "USD"
    tier: str = "standard"  # standard, premium, enterprise

# AI request and response schemas
class AIRequest(BaseModel):
    """Request schema for AI generation"""
    prompt: str = Field(..., description="The input prompt for AI generation")
    user_id: Optional[str] = Field(None, description="User ID for tracking and billing")
    session_id: Optional[str] = Field(None, description="Session ID for context")
    
    # Model preferences
    preferred_model: Optional[str] = Field(None, description="Preferred model to use")
    fallback_models: Optional[List[str]] = Field(default_factory=list, description="Fallback models if preferred fails")
    
    # Generation parameters
    max_tokens: Optional[int] = Field(1000, description="Maximum tokens to generate")
    temperature: Optional[float] = Field(0.7, description="Sampling temperature")
    top_p: Optional[float] = Field(1.0, description="Nucleus sampling parameter")
    top_k: Optional[int] = Field(None, description="Top-k sampling parameter")
    
    # Context and rules
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context for generation")
    rule_set_id: Optional[str] = Field(None, description="Rule set to apply")
    
    # CRM-specific fields
    lead_id: Optional[str] = Field(None, description="Lead ID for CRM context")
    message_type: Optional[str] = Field(None, description="Type of message (email, whatsapp, etc.)")
    language: Optional[str] = Field("en", description="Response language")
    
    # Advanced options
    stream: bool = Field(False, description="Stream response")
    include_usage: bool = Field(True, description="Include token usage in response")
    cache_response: bool = Field(True, description="Cache response for similar requests")

class AIResponse(BaseModel):
    """Response schema for AI generation"""
    content: str = Field(..., description="Generated content")
    model_used: str = Field(..., description="Model that generated the response")
    
    # Metadata
    request_id: str = Field(..., description="Unique request identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    # Usage and costs
    token_usage: TokenUsage
    estimated_cost: float = 0.0
    currency: str = "USD"
    
    # Quality metrics
    confidence_score: Optional[float] = Field(None, description="Confidence score if available")
    safety_scores: Optional[Dict[str, float]] = Field(default_factory=dict, description="Content safety scores")
    
    # Context
    context_used: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Context used in generation")
    rules_applied: Optional[List[str]] = Field(default_factory=list, description="Rules that were applied")

# Model configuration schemas
class ModelConfig(BaseModel):
    """Configuration for an AI model"""
    model_id: str = Field(..., description="Unique model identifier")
    model_type: ModelType
    name: str = Field(..., description="Human-readable model name")
    description: Optional[str] = Field(None, description="Model description")
    
    # Capabilities
    max_tokens: int = Field(4096, description="Maximum tokens supported")
    supports_streaming: bool = Field(False, description="Supports streaming responses")
    supports_functions: bool = Field(False, description="Supports function calling")
    supports_vision: bool = Field(False, description="Supports image input")
    
    # Configuration
    endpoint: Optional[str] = Field(None, description="API endpoint")
    api_key_required: bool = Field(True, description="Requires API key")
    
    # Pricing
    pricing: ModelPricing
    
    # Status
    is_active: bool = Field(True, description="Model is active and available")
    health_status: str = Field("unknown", description="Health status")
    last_health_check: Optional[datetime] = Field(None, description="Last health check timestamp")
    
    # Performance metrics
    average_response_time_ms: Optional[float] = Field(None, description="Average response time")
    success_rate: Optional[float] = Field(None, description="Success rate percentage")
    daily_quota: Optional[int] = Field(None, description="Daily request quota")
    quota_used: Optional[int] = Field(0, description="Quota used today")

# Custom rules schemas
class CustomRule(BaseModel):
    """Individual custom rule definition"""
    rule_id: str = Field(..., description="Unique rule identifier")
    name: str = Field(..., description="Rule name")
    description: Optional[str] = Field(None, description="Rule description")
    rule_type: RuleType
    
    # Rule logic
    condition: Dict[str, Any] = Field(..., description="Rule condition logic")
    action: Dict[str, Any] = Field(..., description="Rule action to perform")
    
    # Configuration
    priority: int = Field(100, description="Rule priority (lower = higher priority)")
    is_active: bool = Field(True, description="Rule is active")
    
    # Metadata
    created_by: Optional[str] = Field(None, description="User who created the rule")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RuleSet(BaseModel):
    """Collection of rules that work together"""
    rule_set_id: str = Field(..., description="Unique rule set identifier")
    name: str = Field(..., description="Rule set name")
    description: Optional[str] = Field(None, description="Rule set description")
    
    # Rules
    rules: List[CustomRule] = Field(default_factory=list, description="Rules in this set")
    
    # Configuration
    is_active: bool = Field(True, description="Rule set is active")
    applies_to_models: Optional[List[str]] = Field(None, description="Models this rule set applies to")
    
    # Metadata
    created_by: Optional[str] = Field(None, description="User who created the rule set")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Usage stats
    usage_count: int = Field(0, description="Number of times used")
    last_used: Optional[datetime] = Field(None, description="Last usage timestamp")

# Statistics schemas
class ModelStats(BaseModel):
    """Usage statistics for a model"""
    model_id: str
    name: str
    
    # Usage metrics
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    success_rate: float = 0.0
    
    # Token metrics
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    
    # Cost metrics
    total_cost: float = 0.0
    average_cost_per_request: float = 0.0
    currency: str = "USD"
    
    # Performance metrics
    average_response_time_ms: float = 0.0
    p95_response_time_ms: float = 0.0
    p99_response_time_ms: float = 0.0
    
    # Time range
    period_start: datetime
    period_end: datetime
    
    # Popular use cases
    top_users: List[Dict[str, Any]] = Field(default_factory=list)
    common_prompts: List[Dict[str, int]] = Field(default_factory=list)

class UsageReport(BaseModel):
    """Comprehensive usage report"""
    user_id: Optional[str] = None
    period_start: datetime
    period_end: datetime
    
    # Overall metrics
    total_requests: int = 0
    total_cost: float = 0.0
    currency: str = "USD"
    
    # By model breakdown
    model_usage: List[ModelStats] = Field(default_factory=list)
    
    # Daily breakdown
    daily_usage: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Top consuming features
    top_rule_sets: List[Dict[str, Any]] = Field(default_factory=list)
    top_prompt_types: List[Dict[str, Any]] = Field(default_factory=list)

# Streaming response schema
class StreamChunk(BaseModel):
    """Chunk of streaming response"""
    chunk_id: int
    content: str
    is_final: bool = False
    token_count: Optional[int] = None
    
    # Metadata for final chunk
    total_tokens: Optional[int] = None
    model_used: Optional[str] = None
    processing_time_ms: Optional[float] = None

# Error schemas
class AIError(BaseModel):
    """Error response schema"""
    error_code: str
    error_message: str
    error_type: str = "ai_error"
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None