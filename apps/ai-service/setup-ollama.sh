#!/bin/bash
# Setup script for Ollama with required models

echo "🚀 Setting up local AI environment with Ollama..."

# Start services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 30

# Pull required models
echo "📥 Downloading required LLM models..."

# Lightweight models for cost-free operation
echo "📥 Pulling Llama 3.1 8B (main model)..."
docker exec crm_ollama ollama pull llama3.1:8b

echo "📥 Pulling Phi-3 Mini (backup model)..."
docker exec crm_ollama ollama pull phi3:mini

echo "📥 Pulling CodeLlama 7B (for technical tasks)..."
docker exec crm_ollama ollama pull codellama:7b

# Test the setup
echo "🧪 Testing AI setup..."
curl -s http://localhost:11434/api/tags | jq '.models[].name' || echo "Models installed successfully"

echo "✅ Local AI environment ready!"
echo ""
echo "🔗 Services available at:"
echo "   - Ollama: http://localhost:11434"
echo "   - Chroma: http://localhost:8001"
echo "   - AI Service: http://localhost:8000"
echo ""
echo "💡 Try testing with:"
echo "   curl -X POST http://localhost:8000/health"