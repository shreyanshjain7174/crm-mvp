"""
Agent Orchestrator
Manages multiple AI agents
"""

class AgentOrchestrator:
    def __init__(self):
        self.agents = {}
    
    def register_agent(self, name, agent):
        self.agents[name] = agent
    
    async def execute_agent(self, agent_name, *args, **kwargs):
        if agent_name in self.agents:
            return await self.agents[agent_name].execute(*args, **kwargs)
        raise ValueError(f"Agent {agent_name} not found")
