"""
Local-Only Agentic CRM AI Service
Cost-free AI employees using Ollama + Chroma
"""

import os
import uvicorn
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import local AI services
from local_ai_service import AIEmployeeFactory, LocalAIClient

# Initialize FastAPI app
app = FastAPI(
    title="Local Agentic CRM AI Service",
    description="Cost-free AI employees using local Ollama + Chroma",
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

# Initialize AI factory
ai_factory = AIEmployeeFactory()

# Pydantic models
class CreateEmployeeRequest(BaseModel):
    name: str
    role: str

class TaskRequest(BaseModel):
    employee_name: str
    task_description: str
    context: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    lead_data: Optional[Dict[str, Any]] = None

# API Routes

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Local Agentic CRM AI Service",
        "status": "healthy",
        "cost": "$0 (local AI)",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        health = await ai_factory.health_check()
        return health
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# AI Employee Management

@app.post("/api/employees/create")
async def create_ai_employee(request: CreateEmployeeRequest):
    """Create a new AI employee"""
    try:
        employee = await ai_factory.create_employee(request.name, request.role)
        
        return {
            "success": True,
            "message": f"AI employee '{request.name}' created successfully",
            "employee": {
                "name": employee.name,
                "role": employee.role,
                "created_at": employee.created_at.isoformat(),
                "cost": "$0 (local AI)"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/employees")
async def list_employees():
    """List all AI employees"""
    try:
        employees = ai_factory.list_employees()
        return {
            "employees": employees,
            "total": len(employees),
            "cost_savings": "100% (local AI)",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/employees/{name}")
async def get_employee(name: str):
    """Get specific AI employee details"""
    employee = ai_factory.get_employee(name)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee '{name}' not found")
    
    return {
        "name": employee.name,
        "role": employee.role,
        "created_at": employee.created_at.isoformat(),
        "tasks_completed": employee.tasks_completed,
        "cost": "$0 (local AI)"
    }

# Task Execution

@app.post("/api/employees/execute-task")
async def execute_task(request: TaskRequest):
    """Have an AI employee execute a task"""
    try:
        employee = ai_factory.get_employee(request.employee_name)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee '{request.employee_name}' not found")
        
        result = await employee.execute_task(request.task_description, request.context)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Direct AI Chat (for testing)

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    """Direct chat with local AI"""
    try:
        ai_client = LocalAIClient()
        
        # Build context-aware prompt
        prompt = request.message
        if request.lead_data:
            lead = request.lead_data
            prompt = f"""
Lead Context:
- Name: {lead.get('name', 'Unknown')}
- Company: {lead.get('company', 'Unknown')}
- Status: {lead.get('status', 'Unknown')}

User Message: {request.message}

Provide a helpful, professional response:"""
        
        result = await ai_client.generate_completion(prompt)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pre-built Employee Templates

@app.get("/api/templates/employee-roles")
async def get_employee_roles():
    """Get available AI employee roles"""
    return {
        "roles": [
            {
                "name": "Sales Development Agent",
                "description": "Qualifies leads, schedules meetings, handles initial sales conversations",
                "capabilities": ["Lead qualification", "Meeting scheduling", "Sales outreach"],
                "cost": "$0 (local AI)"
            },
            {
                "name": "Customer Success Agent", 
                "description": "Handles customer support, follows up, identifies upselling opportunities",
                "capabilities": ["Customer support", "Issue resolution", "Upselling"],
                "cost": "$0 (local AI)"
            },
            {
                "name": "Marketing Agent",
                "description": "Creates personalized campaigns, writes content, manages outreach",
                "capabilities": ["Content creation", "Campaign management", "Personalization"],
                "cost": "$0 (local AI)"
            },
            {
                "name": "Data Analyst Agent",
                "description": "Generates reports, provides insights, analyzes performance",
                "capabilities": ["Report generation", "Data analysis", "Performance insights"],
                "cost": "$0 (local AI)"
            }
        ]
    }

@app.post("/api/templates/create-starter-team")
async def create_starter_team():
    """Create a starter team of AI employees"""
    try:
        employees = [
            ("Alex", "Sales Development Agent"),
            ("Maya", "Customer Success Agent"),
            ("Raj", "Marketing Agent")
        ]
        
        created = []
        for name, role in employees:
            try:
                employee = await ai_factory.create_employee(name, role)
                created.append({
                    "name": employee.name,
                    "role": employee.role,
                    "created_at": employee.created_at.isoformat()
                })
            except ValueError:
                # Employee already exists
                pass
        
        return {
            "success": True,
            "message": "Starter AI team created",
            "team": created,
            "total_cost": "$0 (local AI)",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Quick Actions for CRM Integration

@app.post("/api/quick-actions/qualify-lead")
async def qualify_lead(lead_data: Dict[str, Any]):
    """Quick lead qualification using AI employee"""
    try:
        # Get or create sales agent
        sales_agent = ai_factory.get_employee("Alex")
        if not sales_agent:
            sales_agent = await ai_factory.create_employee("Alex", "Sales Development Agent")
        
        # Execute qualification task
        result = await sales_agent.execute_task(
            "Qualify this lead and provide a score (1-10) with reasoning",
            {"lead_data": lead_data}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quick-actions/generate-message")
async def generate_message(
    lead_data: Dict[str, Any],
    message_type: str = "follow_up"
):
    """Generate a message using AI employee"""
    try:
        # Get or create sales agent
        sales_agent = ai_factory.get_employee("Alex") 
        if not sales_agent:
            sales_agent = await ai_factory.create_employee("Alex", "Sales Development Agent")
        
        # Execute message generation task
        task = f"Generate a {message_type} WhatsApp message for this lead. Keep it professional but friendly, under 160 characters."
        result = await sales_agent.execute_task(task, {"lead_data": lead_data})
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main_local:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )