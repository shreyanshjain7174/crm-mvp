"""
Hybrid Agentic CRM AI Service
Handles AI agent orchestration with local Ollama + cloud fallback and RAG
"""

import os
import uvicorn
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
import json
import httpx
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import hybrid AI services
from services.hybrid_ai_client import HybridAIClient
from services.vector_store import VectorStore
from core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Hybrid Agentic CRM AI Service",
    description="AI agent orchestration with local Ollama + cloud fallback and RAG",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
ai_client = HybridAIClient()
vector_store = VectorStore()

# Pydantic models
class WorkflowExecutionRequest(BaseModel):
    workflow_id: str
    trigger_data: Dict[str, Any]
    lead_id: Optional[str] = None

class AgentExecutionRequest(BaseModel):
    agent_type: str
    lead_id: Optional[str] = None
    prompt: str
    context: Optional[Dict[str, Any]] = None

class LeadQualificationResult(BaseModel):
    score: int
    classification: str
    priority: str
    reasoning: str
    next_actions: List[str]
    confidence: float

class MessageGenerationResult(BaseModel):
    message: str
    subject: Optional[str] = None
    message_type: str
    tone: str
    call_to_action: str
    confidence: float

# AI Agent Classes with Hybrid AI Integration
class LeadQualifierAgent:
    def __init__(self):
        self.name = "Lead Qualifier"
    
    async def execute(self, lead_data: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute AI-powered lead qualification"""
        try:
            # Build qualification prompt
            prompt = self._build_qualification_prompt(lead_data)
            
            # Use hybrid AI to generate qualification
            ai_context = {
                "lead_data": lead_data,
                "task": "lead_qualification"
            }
            
            ai_response = await ai_client.generate_completion(
                prompt=prompt,
                context=ai_context,
                use_rag=True,
                temperature=0.3,  # Lower temperature for consistent scoring
                max_tokens=500
            )
            
            if ai_response["success"]:
                # Parse AI response and extract structured data
                qualification = self._parse_ai_qualification(ai_response["content"], lead_data)
                qualification["ai_provider"] = ai_response["provider"]
                qualification["confidence"] = 0.9 if ai_response["provider"] != "fallback" else 0.6
                return qualification
            else:
                # Fallback to rule-based qualification
                return await self._fallback_qualification(lead_data)
                
        except Exception as e:
            logger.error(f"Lead qualification failed: {str(e)}")
            return await self._fallback_qualification(lead_data)
    
    def _build_qualification_prompt(self, lead_data: Dict[str, Any]) -> str:
        """Build AI prompt for lead qualification"""
        return f"""
Analyze this lead and provide a qualification assessment:

Lead Information:
- Name: {lead_data.get('name', 'Unknown')}
- Company: {lead_data.get('company', 'Unknown')}
- Phone: {lead_data.get('phone', 'Unknown')}
- Email: {lead_data.get('email', 'Unknown')}
- Source: {lead_data.get('source', 'Unknown')}
- Industry: {lead_data.get('industry', 'Unknown')}
- Notes: {lead_data.get('notes', 'None')}

Recent Messages: {len(lead_data.get('messages', []))} messages
Last Contact: {lead_data.get('last_contact_date', 'Never')}

Please provide:
1. Score (0-100)
2. Classification (HOT/WARM/COLD)
3. Priority (HIGH/MEDIUM/LOW)
4. Reasoning for the score
5. 3 specific next actions

Format as JSON with keys: score, classification, priority, reasoning, next_actions
"""
    
    def _parse_ai_qualification(self, ai_content: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI response into structured qualification data"""
        try:
            # Try to extract JSON from AI response
            import re
            json_match = re.search(r'\{.*\}', ai_content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "score": min(max(int(parsed.get("score", 50)), 0), 100),
                    "classification": parsed.get("classification", "WARM").upper(),
                    "priority": parsed.get("priority", "MEDIUM").upper(),
                    "reasoning": parsed.get("reasoning", ai_content),
                    "next_actions": parsed.get("next_actions", ["Review lead manually"]),
                    "agent_type": "lead_qualifier"
                }
        except Exception:
            pass
        
        # Fallback parsing from text
        score = 50
        if "score" in ai_content.lower():
            score_match = re.search(r'score:?\s*(\d+)', ai_content, re.IGNORECASE)
            if score_match:
                score = min(max(int(score_match.group(1)), 0), 100)
        
        classification = "WARM"
        if "hot" in ai_content.lower():
            classification = "HOT"
        elif "cold" in ai_content.lower():
            classification = "COLD"
        
        priority = "HIGH" if classification == "HOT" else "MEDIUM" if classification == "WARM" else "LOW"
        
        return {
            "score": score,
            "classification": classification,
            "priority": priority,
            "reasoning": ai_content[:200] + "..." if len(ai_content) > 200 else ai_content,
            "next_actions": self._get_next_actions(classification),
            "agent_type": "lead_qualifier"
        }
    
    async def _fallback_qualification(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback qualification"""
        score = 50  # Base score
        
        # Scoring logic
        if lead_data.get("email"):
            score += 20
        if lead_data.get("source") in ["website", "referral"]:
            score += 15
        if "urgent" in str(lead_data.get("notes", "")).lower():
            score += 25
        
        # Classification
        if score >= 80:
            classification = "HOT"
            priority = "HIGH"
        elif score >= 60:
            classification = "WARM"
            priority = "MEDIUM"
        else:
            classification = "COLD"
            priority = "LOW"
        
        return {
            "score": min(score, 100),
            "classification": classification,
            "priority": priority,
            "reasoning": f"Rule-based scoring: {score}/100 based on available information",
            "next_actions": self._get_next_actions(classification),
            "confidence": 0.6,
            "agent_type": "lead_qualifier"
        }
    
    def _get_next_actions(self, classification: str) -> List[str]:
        actions = {
            "HOT": ["Call immediately", "Send demo invitation", "Schedule meeting"],
            "WARM": ["Send follow-up email", "Share case studies", "Add to nurture sequence"],
            "COLD": ["Add to newsletter", "Send educational content", "Schedule check-in"]
        }
        return actions.get(classification, ["Review manually"])

class MessageGeneratorAgent:
    def __init__(self):
        self.name = "Message Generator"
    
    async def execute(self, lead_data: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate AI-powered contextual messages"""
        try:
            message_type = context.get("message_type", "follow_up") if context else "follow_up"
            
            # Build message generation prompt
            prompt = self._build_message_prompt(lead_data, message_type, context)
            
            # Use hybrid AI to generate message
            ai_context = {
                "lead_data": lead_data,
                "task": "message_generation",
                "message_type": message_type
            }
            
            ai_response = await ai_client.generate_completion(
                prompt=prompt,
                context=ai_context,
                use_rag=True,
                temperature=0.7,  # Higher temperature for creative messages
                max_tokens=300
            )
            
            if ai_response["success"]:
                # Parse AI response
                message_data = self._parse_ai_message(ai_response["content"], lead_data, message_type)
                message_data["ai_provider"] = ai_response["provider"]
                message_data["confidence"] = 0.9 if ai_response["provider"] != "fallback" else 0.6
                return message_data
            else:
                # Fallback to template-based generation
                return await self._fallback_message_generation(lead_data, message_type)
                
        except Exception as e:
            logger.error(f"Message generation failed: {str(e)}")
            return await self._fallback_message_generation(lead_data, message_type)
    
    def _build_message_prompt(self, lead_data: Dict[str, Any], message_type: str, context: Dict[str, Any]) -> str:
        """Build AI prompt for message generation"""
        lead_name = lead_data.get('name', 'there')
        
        # Get recent message history
        messages = lead_data.get('messages', [])
        message_history = ""
        if messages:
            recent_messages = messages[-3:]  # Last 3 messages
            history_parts = []
            for msg in recent_messages:
                direction = "Customer" if msg.get("direction") == "INBOUND" else "You"
                history_parts.append(f"{direction}: {msg.get('content', '')}")
            message_history = f"\n\nRecent Conversation:\n" + "\n".join(history_parts)
        
        return f"""
Generate a personalized WhatsApp message for this lead:

Lead: {lead_name}
Company: {lead_data.get('company', 'Unknown')}
Status: {lead_data.get('status', 'Unknown')}
Message Type: {message_type}
{message_history}

Requirements:
- Professional but friendly tone
- Indian business context
- WhatsApp appropriate (concise)
- Personalized to the lead
- Include clear call-to-action
- Maximum 160 characters if possible

Generate only the message content, no additional formatting.
"""
    
    def _parse_ai_message(self, ai_content: str, lead_data: Dict[str, Any], message_type: str) -> Dict[str, Any]:
        """Parse AI response into structured message data"""
        # Clean up the message
        message = ai_content.strip().replace('"', '').replace("'", "")
        
        # Remove any system text
        if message.startswith("Message:"):
            message = message[8:].strip()
        
        lead_name = lead_data.get('name', 'there')
        
        return {
            "message": message,
            "subject": f"Following up with {lead_name}",
            "message_type": message_type,
            "tone": "professional",
            "call_to_action": self._extract_call_to_action(message),
            "agent_type": "message_generator"
        }
    
    def _extract_call_to_action(self, message: str) -> str:
        """Extract or suggest call-to-action from message"""
        message_lower = message.lower()
        
        if "call" in message_lower:
            return "Schedule a call"
        elif "meeting" in message_lower:
            return "Schedule a meeting"
        elif "demo" in message_lower:
            return "Book a demo"
        elif "question" in message_lower:
            return "Ask questions"
        else:
            return "Respond to message"
    
    async def _fallback_message_generation(self, lead_data: Dict[str, Any], message_type: str) -> Dict[str, Any]:
        """Template-based fallback message generation"""
        lead_name = lead_data.get("name", "there")
        
        templates = {
            "welcome": f"Hi {lead_name}! Thank you for your interest in our services. We're excited to help you achieve your goals. When would be a good time for a quick chat?",
            "follow_up": f"Hi {lead_name}, I wanted to follow up on your inquiry. Have you had a chance to consider our proposal? I'm here to answer any questions you might have.",
            "nurture": f"Hi {lead_name}, I thought you might find this resource helpful for your business. It covers some of the challenges we discussed earlier.",
            "re_engagement": f"Hi {lead_name}, it's been a while since we last connected. I wanted to check in and see how things are going with your project."
        }
        
        message = templates.get(message_type, templates["follow_up"])
        
        return {
            "message": message,
            "subject": f"Following up with {lead_name}",
            "message_type": message_type,
            "tone": "professional",
            "call_to_action": "Schedule a call",
            "confidence": 0.6,
            "agent_type": "message_generator"
        }

# Initialize agents
lead_qualifier = LeadQualifierAgent()
message_generator = MessageGeneratorAgent()

# CRM Integration
class CRMIntegration:
    def __init__(self):
        self.base_url = os.getenv("CRM_SERVICE_URL", "http://localhost:3001")
    
    async def get_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get lead data from CRM service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/leads/{lead_id}")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error fetching lead {lead_id}: {e}")
        return None

crm = CRMIntegration()

# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Agentic CRM AI Service",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check for hybrid AI system"""
    try:
        # Get AI client health
        ai_health = await ai_client.health_check()
        
        # Get vector store health
        vector_health = await vector_store.health_check()
        
        # Overall status
        ollama_available = ai_health["providers"].get("ollama", {}).get("available", False)
        cloud_available = (ai_health["providers"].get("anthropic", {}).get("available", False) or 
                          ai_health["providers"].get("openai", {}).get("available", False))
        
        status = "healthy" if (ollama_available or cloud_available) else "degraded"
        
        return {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "ai_providers": ai_health["providers"],
            "vector_store": vector_health,
            "crm_connection": True,
            "agents_available": ["lead_qualifier", "message_generator"],
            "features": {
                "local_ai": ollama_available,
                "cloud_ai_fallback": cloud_available,
                "rag_enabled": vector_health.get("embedding_model", False),
                "hybrid_mode": True
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.post("/api/agents/execute")
async def execute_agent(request: AgentExecutionRequest):
    """Execute a specific AI agent"""
    try:
        # Get lead data if lead_id provided
        lead_data = {}
        if request.lead_id:
            lead_data = await crm.get_lead(request.lead_id) or {}
        
        # Execute appropriate agent
        if request.agent_type == "lead_qualifier":
            result = await lead_qualifier.execute(lead_data, request.context)
        elif request.agent_type == "message_generator":
            result = await message_generator.execute(lead_data, request.context)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")
        
        return {
            "success": True,
            "agent_type": request.agent_type,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows/execute")
async def execute_workflow(request: WorkflowExecutionRequest):
    """Execute a workflow"""
    try:
        # Simple workflow execution for demo
        execution_id = f"exec_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Get lead data
        lead_data = {}
        if request.lead_id:
            lead_data = await crm.get_lead(request.lead_id) or {}
        
        # Execute workflow steps based on workflow_id
        if request.workflow_id == "lead_qualification":
            # Step 1: Qualify lead
            qualification = await lead_qualifier.execute(lead_data, request.trigger_data)
            
            # Step 2: Generate appropriate message
            message_context = {"message_type": "welcome" if qualification["classification"] == "HOT" else "nurture"}
            message = await message_generator.execute(lead_data, message_context)
            
            result = {
                "qualification": qualification,
                "suggested_message": message,
                "recommended_action": "immediate_follow_up" if qualification["classification"] == "HOT" else "scheduled_nurture"
            }
        else:
            result = {"message": f"Workflow {request.workflow_id} executed successfully"}
        
        return {
            "execution_id": execution_id,
            "status": "completed",
            "workflow_id": request.workflow_id,
            "lead_id": request.lead_id,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows/templates")
async def get_workflow_templates():
    """Get available workflow templates"""
    templates = [
        {
            "id": "lead_qualification",
            "name": "Lead Qualification Workflow",
            "description": "Automatically qualify new leads and suggest next actions",
            "category": "lead_management",
            "estimated_time": "2-3 minutes",
            "steps": [
                "Analyze lead information",
                "Calculate qualification score",
                "Determine priority level",
                "Generate welcome message",
                "Suggest next actions"
            ]
        },
        {
            "id": "follow_up_sequence",
            "name": "Automated Follow-up Sequence",
            "description": "Multi-step follow-up sequence for leads",
            "category": "nurturing",
            "estimated_time": "5-7 days",
            "steps": [
                "Check lead engagement",
                "Generate personalized message",
                "Schedule follow-up timing",
                "Send message",
                "Track response"
            ]
        },
        {
            "id": "re_engagement",
            "name": "Lead Re-engagement Campaign",
            "description": "Re-engage cold leads with targeted messaging",
            "category": "retention",
            "estimated_time": "3-5 days",
            "steps": [
                "Identify dormant leads",
                "Analyze past interactions",
                "Generate re-engagement message",
                "Offer special incentive",
                "Schedule follow-up"
            ]
        }
    ]
    
    return {"templates": templates}

@app.get("/api/agents/types")
async def get_agent_types():
    """Get available agent types"""
    agents = [
        {
            "type": "lead_qualifier",
            "name": "Lead Qualification Agent",
            "description": "Analyzes lead quality and assigns scores",
            "capabilities": ["Lead scoring", "Priority assignment", "Next action suggestions"],
            "input_required": ["Lead data", "Contact information"],
            "output_format": "Qualification score with recommendations"
        },
        {
            "type": "message_generator",
            "name": "Message Generation Agent",
            "description": "Creates contextual messages for leads",
            "capabilities": ["Personalized messaging", "Tone adaptation", "Call-to-action suggestions"],
            "input_required": ["Lead data", "Message type", "Context"],
            "output_format": "Ready-to-send message with metadata"
        }
    ]
    
    return {"agents": agents}

@app.get("/api/executions/active")
async def get_active_executions():
    """Get active workflow executions"""
    # Mock active executions for demo
    return {
        "active_executions": [],
        "count": 0,
        "message": "No active executions (demo mode)"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )