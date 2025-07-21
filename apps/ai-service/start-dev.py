#!/usr/bin/env python3
"""
Development startup script for AI service
Handles model initialization and service startup
"""

import asyncio
import subprocess
import sys
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def run_model_initialization():
    """Run model initialization in background"""
    logger.info("🚀 Starting model initialization...")
    
    try:
        # Run model initialization
        process = await asyncio.create_subprocess_exec(
            sys.executable, "init-models.py",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            logger.info("✅ Model initialization completed successfully")
            return True
        else:
            logger.error(f"❌ Model initialization failed: {stderr.decode()}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Model initialization error: {e}")
        return False

def start_ai_service():
    """Start the AI service with uvicorn"""
    logger.info("🚀 Starting AI service...")
    
    # Start uvicorn server
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "main_local:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload",
        "--reload-dir", "/app",
        "--log-level", "info"
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        logger.info("🛑 AI service stopped by user")
    except Exception as e:
        logger.error(f"❌ AI service error: {e}")
        sys.exit(1)

async def main():
    """Main startup function"""
    logger.info("🤖 Starting AI Service Development Environment")
    
    # Ensure data directory exists
    os.makedirs("/app/data", exist_ok=True)
    os.makedirs("/app/logs", exist_ok=True)
    
    # Check if models are already initialized
    models_ready_file = Path("/app/data/models_ready.txt")
    
    if models_ready_file.exists():
        logger.info("✅ Models already initialized, starting service directly")
    else:
        logger.info("📥 Models not initialized, starting background download")
        
        # Start model initialization in background (don't wait for it)
        asyncio.create_task(run_model_initialization())
        
        # Give it a moment to start
        await asyncio.sleep(2)
    
    # Start the AI service (this will run in foreground)
    logger.info("🚀 Starting AI service (models will download in background)")
    start_ai_service()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Startup interrupted by user")
        sys.exit(0)