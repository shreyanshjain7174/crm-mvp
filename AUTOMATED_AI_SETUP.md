# 🤖 Automated AI Setup

The CRM now includes a **fully automated local AI system** that starts with your development environment.

## 🚀 What's Included

When you run `./start-dev.sh`, you automatically get:

- **🧠 Ollama LLM** (localhost:11434) - Local language models
- **🗂️ Chroma Vector DB** (localhost:8001) - Local embeddings
- **🤖 AI Service** (localhost:8000) - AI employee management
- **Automatic Model Download** - Required models download in background

## 💰 Zero Cost AI

- **$0 API costs** - Everything runs locally
- **No internet required** for AI after initial setup
- **Privacy first** - Your data never leaves your server
- **Unlimited usage** - No token limits or quotas

## 🔧 How It Works

1. **Run development environment**:
   ```bash
   ./start-dev.sh
   ```

2. **AI models download automatically** in the background:
   - `llama3.1:8b` - Main conversational model (4GB)
   - `phi3:mini` - Lightweight backup (2GB)
   - `codellama:7b` - Technical tasks (4GB) [optional]

3. **AI service starts immediately** - Works with fallbacks while models download

4. **Frontend automatically connects** to local AI service

## 🎯 Features Available

### Stage 5: AI Employees (Expert Users)
- **Create AI Employees** - Sales, Support, Marketing, Data roles
- **Task Assignment** - Give specific tasks to AI employees
- **Autonomous Operation** - AI works independently
- **Performance Monitoring** - Track AI employee metrics

### Quick Actions (All Stages)
- **Lead Qualification** - AI analyzes and scores leads
- **Message Generation** - AI writes WhatsApp messages
- **Follow-up Planning** - AI suggests next steps

## 📊 Service Status

Check if everything is running:

```bash
# AI Service Health
curl http://localhost:8000/health

# Available Models
curl http://localhost:11434/api/tags

# Vector Database
curl http://localhost:8001/api/v1/heartbeat
```

## 🔍 Monitoring

The development environment shows real-time status:

```
🤖 AI Service will be available on http://localhost:8000
🧠 Ollama LLM: http://localhost:11434  
🗂️ Chroma Vector DB: http://localhost:8001
```

## 🐳 Container Architecture

```
Frontend (3000) ──┐
                  ├── AI Service (8000) ──┐
Backend (3001) ───┘                       ├── Ollama (11434)
                                          └── Chroma (8001)
```

## 📦 Storage

Persistent volumes ensure models stay downloaded:
- `ollama_data` - Downloaded models (~8GB)
- `chroma_data` - Vector embeddings  
- `ai_service_logs` - AI service logs
- `ai_service_data` - AI service data

## 🚨 Troubleshooting

### Models Not Downloading
```bash
# Check Ollama logs
docker logs crm-dev-ollama

# Manually download models
docker exec crm-dev-ollama ollama pull llama3.1:8b
```

### AI Service Not Starting
```bash
# Check AI service logs
docker logs crm-dev-ai-service

# Restart AI service
docker-compose -f docker-compose.dev.yml restart ai-service
```

### Port Conflicts
The startup script automatically checks and kills conflicting processes on:
- 8000 (AI Service)
- 8001 (Chroma)  
- 11434 (Ollama)

## 🎉 Benefits

1. **Zero Setup Friction** - Everything starts automatically
2. **Cost-Free AI** - No API keys or subscriptions needed
3. **Privacy Guaranteed** - All AI processing happens locally
4. **Production Ready** - Same setup works in production
5. **Scalable** - Add more AI employees as needed

---

**Ready to use? Just run `./start-dev.sh` and your AI workforce will be ready! 🚀**