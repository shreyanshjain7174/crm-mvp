"""
Lead Qualification Agent
Analyzes lead quality and assigns scores
"""

from typing import Dict, Any, Optional
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from services.crm_integration import CRMIntegration

class LeadQualifierAgent:
    """AI agent specialized in lead qualification"""
    
    def __init__(self, llm):
        self.llm = llm
        self.crm = CRMIntegration()
        
        # Lead qualification prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert lead qualification agent for a CRM system. 
            Your job is to analyze lead information and assign qualification scores.
            
            Analyze the lead based on:
            1. Communication responsiveness
            2. Business fit indicators
            3. Urgency signals
            4. Budget indicators
            5. Decision-making authority
            
            Provide a score from 0-100 and classification (COLD, WARM, HOT).
            Also suggest next actions and priority level.
            
            Respond in JSON format:
            {{
                "score": 85,
                "classification": "HOT",
                "priority": "HIGH",
                "reasoning": "Lead shows strong buying signals...",
                "next_actions": ["Schedule demo", "Send pricing"],
                "confidence": 0.9
            }}"""),
            ("human", "{context}\n\nLead Information:\n{lead_data}\n\nRecent Interactions:\n{interactions}\n\nQualify this lead:")
        ])
    
    async def execute(self, lead_id: str, custom_prompt: str = "", context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute lead qualification"""
        
        # Get lead data from CRM
        lead_data = await self.crm.get_lead(lead_id) if lead_id else {}
        interactions = await self.crm.get_lead_interactions(lead_id) if lead_id else []
        
        # Prepare context
        qualification_context = {
            "lead_data": self._format_lead_data(lead_data),
            "interactions": self._format_interactions(interactions),
            "context": custom_prompt or "Standard lead qualification analysis"
        }
        
        # Execute qualification
        try:
            messages = self.prompt_template.format_messages(**qualification_context)
            response = await self.llm.ainvoke(messages)
            
            # Parse JSON response
            import json
            result = json.loads(response.content)
            
            # Add metadata
            result.update({
                "agent_type": "lead_qualifier",
                "lead_id": lead_id,
                "timestamp": self._get_timestamp()
            })
            
            # Update lead score in CRM if significant change
            if lead_id and "score" in result:
                await self.crm.update_lead(lead_id, {
                    "aiScore": result["score"],
                    "status": result.get("classification", "COLD")
                })
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "agent_type": "lead_qualifier",
                "lead_id": lead_id,
                "confidence": 0.0
            }
    
    def _format_lead_data(self, lead_data: Dict[str, Any]) -> str:
        """Format lead data for prompt"""
        if not lead_data:
            return "No lead data available"
        
        formatted = f"""
        Name: {lead_data.get('name', 'Unknown')}
        Phone: {lead_data.get('phone', 'Not provided')}
        Email: {lead_data.get('email', 'Not provided')}
        Source: {lead_data.get('source', 'Unknown')}
        Current Status: {lead_data.get('status', 'Unknown')}
        Current Priority: {lead_data.get('priority', 'Unknown')}
        Business Profile: {lead_data.get('businessProfile', 'Not provided')}
        Created: {lead_data.get('createdAt', 'Unknown')}
        """
        
        return formatted.strip()
    
    def _format_interactions(self, interactions: list) -> str:
        """Format interactions for prompt"""
        if not interactions:
            return "No recent interactions"
        
        formatted_interactions = []
        for interaction in interactions[:5]:  # Last 5 interactions
            formatted_interactions.append(f"""
            Type: {interaction.get('type', 'Unknown')}
            Description: {interaction.get('description', 'No description')}
            Outcome: {interaction.get('outcome', 'Not specified')}
            Date: {interaction.get('createdAt', 'Unknown')}
            """)
        
        return "\n---\n".join(formatted_interactions)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    async def batch_qualify_leads(self, lead_ids: list) -> Dict[str, Any]:
        """Qualify multiple leads in batch"""
        results = {}
        
        for lead_id in lead_ids:
            try:
                result = await self.execute(lead_id)
                results[lead_id] = result
            except Exception as e:
                results[lead_id] = {"error": str(e), "confidence": 0.0}
        
        return {
            "batch_results": results,
            "total_processed": len(lead_ids),
            "successful": len([r for r in results.values() if "error" not in r]),
            "failed": len([r for r in results.values() if "error" in r])
        }