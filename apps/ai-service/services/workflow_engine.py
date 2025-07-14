"""
LangGraph-based workflow engine for agent orchestration
"""

import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from langgraph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from core.config import settings
from core.database import get_db, WorkflowExecution, ExecutionStep, DatabaseHelper
from core.redis_client import RedisManager
from services.agents.lead_qualifier import LeadQualifierAgent
from services.agents.message_generator import MessageGeneratorAgent
from services.agents.follow_up_scheduler import FollowUpSchedulerAgent
from services.crm_integration import CRMIntegration

@dataclass
class WorkflowState:
    """State object for workflow execution"""
    execution_id: str
    workflow_id: str
    lead_id: Optional[str]
    current_node: str
    variables: Dict[str, Any]
    messages: List[Dict[str, Any]]
    status: str
    error: Optional[str] = None

class WorkflowEngine:
    """LangGraph-based workflow execution engine"""
    
    def __init__(self):
        self.active_workflows: Dict[str, StateGraph] = {}
        self.crm_integration = CRMIntegration()
        
        # Initialize AI models
        self.claude_model = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            api_key=settings.ANTHROPIC_API_KEY
        ) if settings.ANTHROPIC_API_KEY else None
        
        self.openai_model = ChatOpenAI(
            model="gpt-4",
            api_key=settings.OPENAI_API_KEY
        ) if settings.OPENAI_API_KEY else None
        
        # Initialize specialized agents
        self.lead_qualifier = LeadQualifierAgent(self.claude_model)
        self.message_generator = MessageGeneratorAgent(self.claude_model)
        self.follow_up_scheduler = FollowUpSchedulerAgent(self.claude_model)
    
    async def create_workflow_graph(self, workflow_config: Dict[str, Any]) -> StateGraph:
        """Create a LangGraph workflow from configuration"""
        
        # Create state graph
        workflow = StateGraph(WorkflowState)
        
        # Parse nodes and add to graph
        nodes = workflow_config.get("nodes", [])
        
        for node in nodes:
            node_type = node.get("type")
            node_id = node.get("id")
            
            if node_type == "trigger":
                workflow.add_node(node_id, self.trigger_node)
            elif node_type == "ai_agent":
                workflow.add_node(node_id, self.ai_agent_node)
            elif node_type == "condition":
                workflow.add_node(node_id, self.condition_node)
            elif node_type == "human_approval":
                workflow.add_node(node_id, self.human_approval_node)
            elif node_type == "send_message":
                workflow.add_node(node_id, self.send_message_node)
            elif node_type == "update_lead":
                workflow.add_node(node_id, self.update_lead_node)
            elif node_type == "delay":
                workflow.add_node(node_id, self.delay_node)
        
        # Add edges based on connections
        for node in nodes:
            node_id = node.get("id")
            connections = node.get("connections", {})
            
            if "next" in connections:
                workflow.add_edge(node_id, connections["next"])
            elif "true" in connections and "false" in connections:
                # Conditional edges for condition nodes
                workflow.add_conditional_edges(
                    node_id,
                    self.condition_router,
                    {
                        True: connections["true"],
                        False: connections["false"]
                    }
                )
        
        # Set entry point (trigger node)
        trigger_nodes = [n for n in nodes if n.get("type") == "trigger"]
        if trigger_nodes:
            workflow.set_entry_point(trigger_nodes[0]["id"])
        
        # Add end conditions
        end_nodes = [n for n in nodes if not n.get("connections")]
        for node in end_nodes:
            workflow.add_edge(node["id"], END)
        
        return workflow.compile()
    
    async def execute_workflow(self, workflow_id: str, trigger_data: Dict[str, Any], lead_id: str = None) -> str:
        """Execute a workflow with given trigger data"""
        
        # Get workflow configuration from CRM service
        workflow_config = await self.crm_integration.get_workflow(workflow_id)
        if not workflow_config:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Create execution record
        execution_id = str(uuid.uuid4())
        
        # Initialize workflow state
        initial_state = WorkflowState(
            execution_id=execution_id,
            workflow_id=workflow_id,
            lead_id=lead_id,
            current_node="",
            variables=trigger_data,
            messages=[],
            status="RUNNING"
        )
        
        # Create and cache workflow graph
        workflow_graph = await self.create_workflow_graph(workflow_config)
        self.active_workflows[execution_id] = workflow_graph
        
        # Save execution to database
        await self.save_execution(initial_state)
        
        # Execute workflow asynchronously
        try:
            final_state = await workflow_graph.ainvoke(initial_state)
            final_state.status = "COMPLETED"
        except Exception as e:
            final_state = initial_state
            final_state.status = "FAILED"
            final_state.error = str(e)
        
        # Update execution record
        await self.save_execution(final_state)
        
        # Cleanup
        self.active_workflows.pop(execution_id, None)
        
        # Publish completion event
        await RedisManager.publish("workflow_completed", {
            "execution_id": execution_id,
            "workflow_id": workflow_id,
            "status": final_state.status,
            "lead_id": lead_id
        })
        
        return execution_id
    
    # Node implementations
    async def trigger_node(self, state: WorkflowState) -> WorkflowState:
        """Handle trigger node execution"""
        await self.log_step(state, "trigger", {"triggered": True})
        return state
    
    async def ai_agent_node(self, state: WorkflowState) -> WorkflowState:
        """Handle AI agent node execution"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        agent_type = node_config.get("agentType", "general")
        prompt = node_config.get("prompt", "")
        
        # Select appropriate agent
        if agent_type == "lead_qualifier":
            result = await self.lead_qualifier.execute(state.lead_id, prompt, state.variables)
        elif agent_type == "message_generator":
            result = await self.message_generator.execute(state.lead_id, prompt, state.variables)
        elif agent_type == "follow_up_scheduler":
            result = await self.follow_up_scheduler.execute(state.lead_id, prompt, state.variables)
        else:
            # General AI agent
            result = await self.general_ai_agent(prompt, state.variables)
        
        # Update state with AI result
        state.variables.update(result)
        state.messages.append({
            "type": "ai_response",
            "content": result.get("response", ""),
            "confidence": result.get("confidence", 0.0)
        })
        
        await self.log_step(state, "ai_agent", result)
        return state
    
    async def condition_node(self, state: WorkflowState) -> WorkflowState:
        """Handle condition node execution"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        condition = node_config.get("condition", "true")
        
        # Evaluate condition (simple implementation)
        try:
            # Replace variables in condition
            for key, value in state.variables.items():
                condition = condition.replace(f"{{{key}}}", str(value))
            
            result = eval(condition)
            state.variables["condition_result"] = result
        except Exception as e:
            state.variables["condition_result"] = False
            state.error = f"Condition evaluation error: {str(e)}"
        
        await self.log_step(state, "condition", {"result": state.variables["condition_result"]})
        return state
    
    async def human_approval_node(self, state: WorkflowState) -> WorkflowState:
        """Handle human approval node"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        message = node_config.get("message", "Approval required")
        
        # Create approval request
        approval_data = {
            "execution_id": state.execution_id,
            "node_id": state.current_node,
            "message": message,
            "context": state.variables,
            "lead_id": state.lead_id
        }
        
        # Store approval request in Redis
        await RedisManager.set_json(f"approval:{state.execution_id}:{state.current_node}", approval_data)
        
        # Publish approval request event
        await RedisManager.publish("approval_required", approval_data)
        
        # Wait for approval (this would be handled differently in production)
        state.variables["approval_pending"] = True
        
        await self.log_step(state, "human_approval", {"approval_requested": True})
        return state
    
    async def send_message_node(self, state: WorkflowState) -> WorkflowState:
        """Handle send message node"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        message_template = node_config.get("message", "")
        
        # Replace variables in message
        message = message_template
        for key, value in state.variables.items():
            message = message.replace(f"{{{key}}}", str(value))
        
        # Send message via CRM integration
        if state.lead_id:
            result = await self.crm_integration.send_message(state.lead_id, message)
            state.variables["message_sent"] = True
            state.variables["message_id"] = result.get("message_id")
        
        await self.log_step(state, "send_message", {"message": message})
        return state
    
    async def update_lead_node(self, state: WorkflowState) -> WorkflowState:
        """Handle update lead node"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        
        updates = {}
        if "status" in node_config:
            updates["status"] = node_config["status"]
        if "priority" in node_config:
            updates["priority"] = node_config["priority"]
        if "aiScore" in node_config:
            updates["aiScore"] = node_config["aiScore"]
        
        # Update lead via CRM integration
        if state.lead_id and updates:
            result = await self.crm_integration.update_lead(state.lead_id, updates)
            state.variables["lead_updated"] = True
            state.variables["updates"] = updates
        
        await self.log_step(state, "update_lead", updates)
        return state
    
    async def delay_node(self, state: WorkflowState) -> WorkflowState:
        """Handle delay node"""
        node_config = await self.get_node_config(state.workflow_id, state.current_node)
        delay_seconds = node_config.get("delay", 1)
        
        # In production, this would schedule the continuation
        # For now, we'll just log it
        state.variables["delay_applied"] = delay_seconds
        
        await self.log_step(state, "delay", {"delay": delay_seconds})
        return state
    
    # Helper methods
    def condition_router(self, state: WorkflowState) -> bool:
        """Route condition node based on result"""
        return state.variables.get("condition_result", False)
    
    async def general_ai_agent(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute general AI agent"""
        model = self.claude_model or self.openai_model
        if not model:
            return {"response": "No AI model available", "confidence": 0.0}
        
        # Format prompt with context
        formatted_prompt = prompt
        for key, value in context.items():
            formatted_prompt = formatted_prompt.replace(f"{{{key}}}", str(value))
        
        # Get AI response
        messages = [HumanMessage(content=formatted_prompt)]
        response = await model.ainvoke(messages)
        
        return {
            "response": response.content,
            "confidence": 0.8,  # Default confidence
            "model_used": model.model_name if hasattr(model, 'model_name') else "unknown"
        }
    
    async def get_node_config(self, workflow_id: str, node_id: str) -> Dict[str, Any]:
        """Get node configuration from workflow"""
        workflow_config = await self.crm_integration.get_workflow(workflow_id)
        nodes = workflow_config.get("nodes", [])
        
        for node in nodes:
            if node.get("id") == node_id:
                return node.get("config", {})
        
        return {}
    
    async def save_execution(self, state: WorkflowState):
        """Save execution state to database"""
        # This would use SQLAlchemy session in production
        pass
    
    async def log_step(self, state: WorkflowState, step_type: str, data: Dict[str, Any]):
        """Log execution step"""
        step_data = {
            "execution_id": state.execution_id,
            "node_id": state.current_node,
            "step_type": step_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log to Redis for real-time monitoring
        await RedisManager.publish("execution_step", step_data)