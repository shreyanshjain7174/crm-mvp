#!/usr/bin/env python3
"""
Start script for AI Service
"""

import os
import subprocess
import sys
from pathlib import Path

def start_service():
    """Start the AI service"""
    
    # Change to AI service directory
    os.chdir(Path(__file__).parent)
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        print("❌ Virtual environment not found. Please run setup.py first.")
        sys.exit(1)
    
    # Determine Python executable
    if os.name == 'nt':  # Windows
        python_exe = "venv\\Scripts\\python.exe"
    else:  # Unix/MacOS
        python_exe = "venv/bin/python"
    
    print("🚀 Starting AI Service...")
    print("Service will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the service")
    
    try:
        # Start uvicorn server
        subprocess.run([
            python_exe, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 AI Service stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_service()