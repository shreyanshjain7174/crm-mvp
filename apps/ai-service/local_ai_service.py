"""
Local-Only Agentic AI Service
Cost-free AI employees using Ollama + Chroma
"""

import asyncio
import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LocalAIClient:
    """
    Local-only AI client using Ollama for cost-free operation
    """
    
    def __init__(self, ollama_host="localhost", ollama_port=11434):
        self.ollama_base_url = f"http://{ollama_host}:{ollama_port}"
        self.default_model = "llama3.1:8b"
        
    async def generate_completion(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate completion using local Ollama"""
        
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": model or self.default_model,
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
                    return {
                        "success": True,
                        "content": result.get("response", "").strip(),
                        "model": model or self.default_model,
                        "provider": "ollama_local",
                        "cost": 0.0,  # Local = $0
                        "timestamp": datetime.utcnow().isoformat()
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Ollama request failed: {response.status_code}",
                        "fallback_content": self._generate_fallback(prompt)
                    }
                    
        except Exception as e:
            logger.error(f"Local AI generation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fallback_content": self._generate_fallback(prompt)
            }
    
    def _generate_fallback(self, prompt: str) -> str:
        """Simple rule-based fallback when local AI fails"""
        prompt_lower = prompt.lower()
        
        if "lead" in prompt_lower and "qualify" in prompt_lower:
            return "This lead needs manual review. Please analyze their information."
        elif "message" in prompt_lower or "reply" in prompt_lower:
            return "Thank you for reaching out! I'll get back to you shortly."
        elif "follow" in prompt_lower:
            return "Schedule a follow-up call within 2-3 business days."
        else:
            return "I'll review this request and get back to you soon."
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if local AI is available"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.ollama_base_url}/api/tags")
                
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return {
                        "status": "healthy",
                        "available_models": [m.get("name") for m in models],
                        "default_model": self.default_model,
                        "cost": 0.0,
                        "provider": "ollama_local"
                    }
                else:
                    return {"status": "unhealthy", "error": "Ollama not responding"}
                    
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

class SimpleAIEmployee:
    """
    Simple AI Employee that uses local LLM
    """
    
    def __init__(self, name: str, role: str, ai_client: LocalAIClient):
        self.name = name
        self.role = role
        self.ai_client = ai_client
        self.created_at = datetime.utcnow()
        self.tasks_completed = 0
    
    async def execute_task(self, task_description: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a task autonomously"""
        
        # Build context-aware prompt
        prompt = self._build_task_prompt(task_description, context)
        
        # Generate response using local AI
        result = await self.ai_client.generate_completion(
            prompt=prompt,
            temperature=0.3,  # Lower for more consistent results
            max_tokens=500
        )
        
        if result["success"]:
            self.tasks_completed += 1
            
        return {
            "employee": self.name,
            "role": self.role,
            "task": task_description,
            "result": result.get("content", result.get("fallback_content", "")),
            "success": result["success"],
            "cost": 0.0,  # Always free with local AI
            "completed_at": datetime.utcnow().isoformat(),
            "total_tasks": self.tasks_completed
        }
    
    def _build_task_prompt(self, task: str, context: Dict[str, Any] = None) -> str:
        """Build a role-specific prompt"""
        
        base_prompt = f"""You are {self.name}, a {self.role} AI employee for a CRM system.

Your role: {self.role}
Task: {task}

"""
        
        if context:
            if context.get("lead_data"):
                lead = context["lead_data"]
                base_prompt += f"""
Lead Information:
- Name: {lead.get('name', 'Unknown')}
- Company: {lead.get('company', 'Unknown')}
- Status: {lead.get('status', 'Unknown')}
- Source: {lead.get('source', 'Unknown')}
"""
        
        # Role-specific instructions
        role_instructions = {
            "Sales Development Agent": "Focus on qualifying leads, identifying pain points, and scheduling meetings. Be professional and persuasive.",
            "Customer Success Agent": "Prioritize customer satisfaction, resolve issues quickly, and identify upselling opportunities.",
            "Marketing Agent": "Create engaging, personalized content that drives action. Focus on Indian SME market context.",
            "Data Analyst Agent": "Provide clear, actionable insights based on data. Use simple language that business owners can understand."
        }
        
        base_prompt += f"\nInstructions: {role_instructions.get(self.role, 'Complete the task efficiently and professionally.')}"
        base_prompt += "\n\nProvide a direct, actionable response:"
        
        return base_prompt

# Simple AI Employee Factory
class AIEmployeeFactory:
    """Factory to create AI employees with local LLM"""
    
    def __init__(self):
        self.ai_client = LocalAIClient()
        self.employees: Dict[str, SimpleAIEmployee] = {}
    
    async def create_employee(self, name: str, role: str) -> SimpleAIEmployee:
        """Create a new AI employee"""
        
        if name in self.employees:
            raise ValueError(f"Employee {name} already exists")
        
        # Validate role
        valid_roles = [
            "Sales Development Agent",
            "Customer Success Agent", 
            "Marketing Agent",
            "Data Analyst Agent"
        ]
        
        if role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
        
        employee = SimpleAIEmployee(name, role, self.ai_client)
        self.employees[name] = employee
        
        logger.info(f"Created AI employee: {name} ({role})")
        return employee
    
    def get_employee(self, name: str) -> Optional[SimpleAIEmployee]:
        """Get an existing employee"""
        return self.employees.get(name)
    
    def list_employees(self) -> List[Dict[str, Any]]:
        """List all employees"""
        return [
            {
                "name": emp.name,
                "role": emp.role,
                "created_at": emp.created_at.isoformat(),
                "tasks_completed": emp.tasks_completed
            }
            for emp in self.employees.values()
        ]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check system health"""
        ai_health = await self.ai_client.health_check()
        
        return {
            "ai_system": ai_health,
            "total_employees": len(self.employees),
            "employees": self.list_employees(),
            "cost_savings": "100% (local AI)",
            "timestamp": datetime.utcnow().isoformat()
        }