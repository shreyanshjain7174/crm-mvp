"""
CRM Service Integration
Handles communication with the Node.js CRM service
"""

import httpx
import json
from typing import Dict, Any, List, Optional
from core.config import settings

class CRMIntegration:
    """Integration with Node.js CRM service"""
    
    def __init__(self):
        self.base_url = settings.CRM_SERVICE_URL
        self.api_key = settings.CRM_API_KEY
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    async def get_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get lead data from CRM service"""
        try:
            response = await self.client.get(f"/api/leads/{lead_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching lead {lead_id}: {e}")
            return None
    
    async def get_leads(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get multiple leads with optional filters"""
        try:
            params = filters or {}
            response = await self.client.get("/api/leads", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching leads: {e}")
            return []
    
    async def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update lead in CRM service"""
        try:
            response = await self.client.put(f"/api/leads/{lead_id}", json=updates)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error updating lead {lead_id}: {e}")
            return None
    
    async def create_lead(self, lead_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create new lead in CRM service"""
        try:
            response = await self.client.post("/api/leads", json=lead_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating lead: {e}")
            return None
    
    async def get_lead_messages(self, lead_id: str) -> List[Dict[str, Any]]:
        """Get messages for a specific lead"""
        try:
            response = await self.client.get(f"/api/messages/lead/{lead_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching messages for lead {lead_id}: {e}")
            return []
    
    async def send_message(self, lead_id: str, content: str, message_type: str = "TEXT") -> Optional[Dict[str, Any]]:
        """Send message through CRM service"""
        try:
            message_data = {
                "leadId": lead_id,
                "content": content,
                "messageType": message_type
            }
            response = await self.client.post("/api/messages/send", json=message_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error sending message to lead {lead_id}: {e}")
            return None
    
    async def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get specific message details"""
        try:
            response = await self.client.get(f"/api/messages/{message_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching message {message_id}: {e}")
            return None
    
    async def get_lead_interactions(self, lead_id: str) -> List[Dict[str, Any]]:
        """Get interactions for a specific lead"""
        try:
            response = await self.client.get(f"/api/leads/{lead_id}/interactions")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching interactions for lead {lead_id}: {e}")
            return []
    
    async def create_interaction(self, lead_id: str, interaction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create new interaction record"""
        try:
            interaction_data["leadId"] = lead_id
            response = await self.client.post(f"/api/leads/{lead_id}/interactions", json=interaction_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating interaction for lead {lead_id}: {e}")
            return None
    
    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow configuration"""
        try:
            response = await self.client.get(f"/api/workflows/{workflow_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching workflow {workflow_id}: {e}")
            return None
    
    async def get_workflows(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all workflows"""
        try:
            params = {"active": active_only} if active_only else {}
            response = await self.client.get("/api/workflows", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching workflows: {e}")
            return []
    
    async def create_workflow_execution(self, execution_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create workflow execution record"""
        try:
            response = await self.client.post("/api/workflow-executions", json=execution_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating workflow execution: {e}")
            return None
    
    async def update_workflow_execution(self, execution_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update workflow execution"""
        try:
            response = await self.client.put(f"/api/workflow-executions/{execution_id}", json=updates)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error updating workflow execution {execution_id}: {e}")
            return None
    
    async def get_business_profile(self) -> Optional[Dict[str, Any]]:
        """Get business profile configuration"""
        try:
            response = await self.client.get("/api/business-profile")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching business profile: {e}")
            return None
    
    async def create_ai_suggestion(self, suggestion_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create AI suggestion record"""
        try:
            response = await self.client.post("/api/ai/suggestions", json=suggestion_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating AI suggestion: {e}")
            return None
    
    async def get_ai_suggestions(self, lead_id: str = None, pending_only: bool = False) -> List[Dict[str, Any]]:
        """Get AI suggestions"""
        try:
            params = {}
            if lead_id:
                params["leadId"] = lead_id
            if pending_only:
                params["pending"] = "true"
            
            response = await self.client.get("/api/ai/suggestions", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching AI suggestions: {e}")
            return []
    
    async def update_ai_suggestion(self, suggestion_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update AI suggestion (e.g., approve/reject)"""
        try:
            response = await self.client.put(f"/api/ai/suggestions/{suggestion_id}", json=updates)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error updating AI suggestion {suggestion_id}: {e}")
            return None
    
    async def send_whatsapp_message(self, phone: str, message: str) -> Optional[Dict[str, Any]]:
        """Send WhatsApp message"""
        try:
            message_data = {
                "phone": phone,
                "message": message
            }
            response = await self.client.post("/api/whatsapp/send", json=message_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error sending WhatsApp message to {phone}: {e}")
            return None
    
    async def get_analytics_data(self, date_range: Dict[str, str] = None) -> Optional[Dict[str, Any]]:
        """Get analytics data from CRM"""
        try:
            params = date_range or {}
            response = await self.client.get("/api/analytics", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching analytics: {e}")
            return None
    
    async def health_check(self) -> bool:
        """Check if CRM service is healthy"""
        try:
            response = await self.client.get("/health")
            return response.status_code == 200
        except Exception:
            return False
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()