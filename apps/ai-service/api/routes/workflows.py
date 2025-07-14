"""
Workflow execution API routes
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid

from services.workflow_engine import WorkflowEngine
from core.redis_client import RedisManager

router = APIRouter()

class WorkflowExecutionRequest(BaseModel):
    workflow_id: str
    trigger_data: Dict[str, Any]
    lead_id: Optional[str] = None

class ApprovalRequest(BaseModel):
    execution_id: str
    node_id: str
    approved: bool
    modified_data: Optional[Dict[str, Any]] = None

def get_workflow_engine() -> WorkflowEngine:
    """Dependency to get workflow engine"""
    from main import app
    return app.state.workflow_engine

@router.post("/execute")
async def execute_workflow(
    request: WorkflowExecutionRequest,
    background_tasks: BackgroundTasks,
    engine: WorkflowEngine = Depends(get_workflow_engine)
):
    """Execute a workflow"""
    try:
        execution_id = await engine.execute_workflow(
            request.workflow_id,
            request.trigger_data,
            request.lead_id
        )
        
        return {
            "execution_id": execution_id,
            "status": "started",
            "workflow_id": request.workflow_id,
            "lead_id": request.lead_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/executions/active")
async def get_active_executions(engine: WorkflowEngine = Depends(get_workflow_engine)):
    """Get all active workflow executions"""
    try:
        executions = engine.get_active_executions()
        return {
            "active_executions": executions,
            "count": len(executions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve")
async def approve_workflow_step(
    request: ApprovalRequest,
    engine: WorkflowEngine = Depends(get_workflow_engine)
):
    """Approve or reject a workflow step requiring human approval"""
    try:
        await engine.approveWorkflowStep(
            request.execution_id,
            request.node_id,
            request.approved,
            request.modified_data
        )
        
        return {
            "success": True,
            "execution_id": request.execution_id,
            "node_id": request.node_id,
            "approved": request.approved
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/executions/{execution_id}")
async def stop_execution(
    execution_id: str,
    engine: WorkflowEngine = Depends(get_workflow_engine)
):
    """Stop a running workflow execution"""
    try:
        await engine.stop_execution(execution_id)
        return {
            "success": True,
            "execution_id": execution_id,
            "status": "stopped"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/executions/{execution_id}/status")
async def get_execution_status(execution_id: str):
    """Get status of a specific execution"""
    try:
        # Get status from Redis cache
        status_data = await RedisManager.get_json(f"execution:{execution_id}")
        
        if not status_data:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return status_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def get_workflow_templates():
    """Get available workflow templates"""
    templates = [
        {
            "id": "lead_qualification",
            "name": "Lead Qualification Workflow",
            "description": "Automatically qualify new leads and assign scores",
            "category": "lead_management",
            "nodes": [
                {
                    "id": "trigger",
                    "type": "trigger",
                    "name": "New Lead Created",
                    "config": {},
                    "connections": {"next": "qualify"}
                },
                {
                    "id": "qualify",
                    "type": "ai_agent",
                    "name": "Qualify Lead",
                    "config": {
                        "agentType": "lead_qualifier",
                        "prompt": "Analyze this lead and provide qualification score"
                    },
                    "connections": {"next": "condition"}
                },
                {
                    "id": "condition",
                    "type": "condition",
                    "name": "Check Score",
                    "config": {
                        "condition": "{{score}} > 70"
                    },
                    "connections": {"true": "hot_lead", "false": "nurture"}
                },
                {
                    "id": "hot_lead",
                    "type": "send_message",
                    "name": "Send Welcome Message",
                    "config": {
                        "message": "Thank you for your interest! We'll be in touch shortly."
                    },
                    "connections": {}
                },
                {
                    "id": "nurture",
                    "type": "send_message",
                    "name": "Send Nurture Message",
                    "config": {
                        "message": "Thanks for connecting! Here's some information that might interest you."
                    },
                    "connections": {}
                }
            ]
        },
        {
            "id": "follow_up_sequence",
            "name": "Automated Follow-up Sequence",
            "description": "Multi-step follow-up sequence for leads",
            "category": "nurturing",
            "nodes": [
                {
                    "id": "trigger",
                    "type": "trigger",
                    "name": "No Response Trigger",
                    "config": {},
                    "connections": {"next": "generate_message"}
                },
                {
                    "id": "generate_message",
                    "type": "ai_agent",
                    "name": "Generate Follow-up",
                    "config": {
                        "agentType": "message_generator",
                        "prompt": "Create a personalized follow-up message"
                    },
                    "connections": {"next": "approval"}
                },
                {
                    "id": "approval",
                    "type": "human_approval",
                    "name": "Human Approval",
                    "config": {
                        "message": "Review the generated follow-up message"
                    },
                    "connections": {"next": "send"}
                },
                {
                    "id": "send",
                    "type": "send_message",
                    "name": "Send Follow-up",
                    "config": {
                        "message": "{{generated_message}}"
                    },
                    "connections": {"next": "delay"}
                },
                {
                    "id": "delay",
                    "type": "delay",
                    "name": "Wait 3 Days",
                    "config": {
                        "delay": 259200000  # 3 days in milliseconds
                    },
                    "connections": {"next": "check_response"}
                },
                {
                    "id": "check_response",
                    "type": "condition",
                    "name": "Check Response",
                    "config": {
                        "condition": "{{response_received}} == false"
                    },
                    "connections": {"true": "generate_message", "false": "end"}
                }
            ]
        }
    ]
    
    return {"templates": templates}

@router.post("/templates/{template_id}/create")
async def create_workflow_from_template(template_id: str):
    """Create a new workflow from a template"""
    try:
        # In production, this would create the workflow in the CRM service
        # For now, return the template structure
        templates = await get_workflow_templates()
        template = next((t for t in templates["templates"] if t["id"] == template_id), None)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Generate new workflow ID
        workflow_id = str(uuid.uuid4())
        
        # Create workflow structure
        workflow = {
            "id": workflow_id,
            "name": f"{template['name']} - Copy",
            "description": template["description"],
            "isActive": True,
            "nodes": template["nodes"],
            "created_from_template": template_id
        }
        
        return {
            "success": True,
            "workflow": workflow,
            "message": "Workflow created from template"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))