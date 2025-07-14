#!/usr/bin/env python3
"""
Setup script for AI Service
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return None

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def setup_virtual_environment():
    """Create and setup virtual environment"""
    # Determine Python executable
    python_exe = sys.executable
    
    if not os.path.exists("venv"):
        run_command(f"{python_exe} -m venv venv", "Creating virtual environment")
    
    # Determine pip command
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/MacOS
        pip_cmd = "venv/bin/pip"
    
    run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip")
    run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python dependencies")

def create_missing_directories():
    """Create required directories"""
    dirs = [
        "api/routes",
        "services/agents",
        "core",
        "data",
        "logs"
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        # Create __init__.py files for Python packages
        if not dir_path.startswith(("data", "logs")):
            init_file = Path(dir_path) / "__init__.py"
            if not init_file.exists():
                init_file.touch()

def create_minimal_files():
    """Create minimal required files if they don't exist"""
    
    # Create __init__.py files
    init_files = [
        "api/__init__.py",
        "api/routes/__init__.py",
        "services/__init__.py",
        "services/agents/__init__.py",
        "core/__init__.py"
    ]
    
    for init_file in init_files:
        Path(init_file).touch(exist_ok=True)
    
    # Create agent orchestrator
    if not Path("services/agent_orchestrator.py").exists():
        with open("services/agent_orchestrator.py", "w") as f:
            f.write('''"""
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
''')
    
    # Create remaining API route files
    route_files = [
        ("api/routes/agents.py", "router = APIRouter()"),
        ("api/routes/rag.py", "router = APIRouter()"),
        ("api/routes/templates.py", "router = APIRouter()"),
        ("api/routes/executions.py", "router = APIRouter()")
    ]
    
    for file_path, content in route_files:
        if not Path(file_path).exists():
            with open(file_path, "w") as f:
                f.write(f'''"""
{Path(file_path).stem.title()} API routes
"""

from fastapi import APIRouter

{content}

@router.get("/")
async def root():
    return {{"message": "{Path(file_path).stem} endpoint"}}
''')

def main():
    """Main setup function"""
    print("🚀 Setting up AI Service...")
    
    # Change to AI service directory
    os.chdir(Path(__file__).parent)
    
    check_python_version()
    create_missing_directories()
    create_minimal_files()
    setup_virtual_environment()
    
    print("\n✅ AI Service setup completed!")
    print("\nTo start the service:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Start the service:")
    print("   python main.py")
    print("\nOr use the start script:")
    print("   python start.py")

if __name__ == "__main__":
    main()