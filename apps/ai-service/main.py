"""
Simplified Agentic CRM AI Service
Handles AI agent orchestration and workflow execution
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
import json
import httpx
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Agentic CRM AI Service",
    description="AI agent orchestration and workflow service for CRM",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Simple AI Agent Classes
class LeadQualifierAgent:
    def __init__(self):
        self.name = "Lead Qualifier"
    
    async def execute(self, lead_data: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute lead qualification logic"""
        # Simple rule-based qualification for demo
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
            "reasoning": f"Lead scored {score}/100 based on available information",
            "next_actions": self._get_next_actions(classification),
            "confidence": 0.85,
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
        """Generate contextual messages"""
        message_type = context.get("message_type", "follow_up") if context else "follow_up"
        lead_name = lead_data.get("name", "there")
        
        # Template-based message generation
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
            "confidence": 0.8,
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
    """Detailed health check"""
    return {
        "status": "healthy",
        "ai_providers": {
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY"))
        },
        "crm_connection": True,
        "agents_available": ["lead_qualifier", "message_generator"]
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