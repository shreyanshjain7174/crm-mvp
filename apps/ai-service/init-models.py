#!/usr/bin/env python3
"""
Initialize AI models for local development
Downloads required Ollama models automatically
"""

import asyncio
import httpx
import time
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")
OLLAMA_BASE_URL = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}"

# Models to download
REQUIRED_MODELS = [
    "llama3.1:8b",     # Main conversational model
    "phi3:mini",       # Lightweight backup model
]

OPTIONAL_MODELS = [
    "codellama:7b",    # For technical tasks (download if space available)
]

async def wait_for_ollama():
    """Wait for Ollama service to be ready"""
    logger.info(f"Waiting for Ollama at {OLLAMA_BASE_URL}...")
    
    max_retries = 30  # 5 minutes
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                if response.status_code == 200:
                    logger.info("✅ Ollama is ready!")
                    return True
        except Exception as e:
            logger.debug(f"Ollama not ready yet: {e}")
        
        retry_count += 1
        logger.info(f"Waiting for Ollama... ({retry_count}/{max_retries})")
        await asyncio.sleep(10)
    
    logger.error("❌ Ollama failed to start after 5 minutes")
    return False

async def check_model_exists(model_name: str) -> bool:
    """Check if a model is already downloaded"""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [model.get("name", "") for model in data.get("models", [])]
                return model_name in models
    except Exception as e:
        logger.error(f"Failed to check model {model_name}: {e}")
    
    return False

async def download_model(model_name: str) -> bool:
    """Download a model using Ollama API"""
    logger.info(f"📥 Downloading model: {model_name}")
    
    try:
        async with httpx.AsyncClient(timeout=600) as client:  # 10 minute timeout
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/pull",
                json={"name": model_name},
                timeout=600
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Successfully downloaded: {model_name}")
                return True
            else:
                logger.error(f"❌ Failed to download {model_name}: {response.status_code}")
                return False
                
    except Exception as e:
        logger.error(f"❌ Error downloading {model_name}: {e}")
        return False

async def test_model(model_name: str) -> bool:
    """Test if a model works correctly"""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model_name,
                    "prompt": "Hello! Say 'Model working' if you can respond.",
                    "stream": False,
                    "options": {
                        "num_predict": 10
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                if "response" in result:
                    logger.info(f"✅ Model {model_name} is working correctly")
                    return True
            
        logger.warning(f"⚠️  Model {model_name} test failed")
        return False
        
    except Exception as e:
        logger.error(f"❌ Model test failed for {model_name}: {e}")
        return False

async def initialize_models():
    """Initialize all required models"""
    logger.info("🚀 Starting AI model initialization...")
    
    # Wait for Ollama to be ready
    if not await wait_for_ollama():
        logger.error("❌ Cannot initialize models - Ollama not available")
        return False
    
    # Download required models
    success_count = 0
    for model in REQUIRED_MODELS:
        logger.info(f"🔍 Checking model: {model}")
        
        if await check_model_exists(model):
            logger.info(f"✅ Model {model} already exists")
            if await test_model(model):
                success_count += 1
            else:
                logger.warning(f"⚠️  Model {model} exists but not working properly")
        else:
            logger.info(f"📥 Model {model} not found, downloading...")
            if await download_model(model):
                if await test_model(model):
                    success_count += 1
            else:
                logger.error(f"❌ Failed to download or test {model}")
    
    # Try to download optional models (don't fail if they don't work)
    for model in OPTIONAL_MODELS:
        logger.info(f"🔍 Checking optional model: {model}")
        
        if not await check_model_exists(model):
            logger.info(f"📥 Downloading optional model: {model}")
            await download_model(model)  # Don't worry if this fails
    
    # Summary
    total_required = len(REQUIRED_MODELS)
    if success_count == total_required:
        logger.info(f"🎉 All {total_required} required models are ready!")
        return True
    else:
        logger.error(f"❌ Only {success_count}/{total_required} required models are working")
        return False

async def main():
    """Main initialization function"""
    try:
        success = await initialize_models()
        if success:
            logger.info("✅ AI model initialization completed successfully!")
            # Create a marker file to indicate models are ready
            with open("/app/data/models_ready.txt", "w") as f:
                f.write("Models initialized successfully\n")
            return 0
        else:
            logger.error("❌ AI model initialization failed!")
            return 1
    except Exception as e:
        logger.error(f"❌ Initialization error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())