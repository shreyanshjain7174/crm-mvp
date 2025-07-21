# Local Agentic AI Service

Cost-free AI employees for your CRM using local Ollama + Chroma.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- 8GB+ RAM (for running local LLMs)
- 10GB+ storage (for models)

### Setup (5 minutes)

1. **Start Local AI Environment**
   ```bash
   cd apps/ai-service
   ./setup-ollama.sh
   ```

2. **Verify Setup**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Create Your First AI Employee**
   ```bash
   curl -X POST http://localhost:8000/api/employees/create \
     -H "Content-Type: application/json" \
     -d '{"name": "Alex", "role": "Sales Development Agent"}'
   ```

## 🤖 AI Employee Types

### Sales Development Agent
- Qualifies leads automatically
- Schedules meetings
- Handles initial sales conversations
- **Cost**: $0 (local AI)

### Customer Success Agent  
- Provides customer support
- Follows up with customers
- Identifies upselling opportunities
- **Cost**: $0 (local AI)

### Marketing Agent
- Creates personalized campaigns
- Writes content automatically
- Manages outreach sequences
- **Cost**: $0 (local AI)

### Data Analyst Agent
- Generates reports automatically
- Provides business insights
- Analyzes performance metrics
- **Cost**: $0 (local AI)

## 📖 API Usage

### Create AI Employee
```bash
POST /api/employees/create
{
  "name": "Maya",
  "role": "Customer Success Agent"
}
```

### Execute Task
```bash
POST /api/employees/execute-task
{
  "employee_name": "Alex",
  "task_description": "Qualify this lead and provide next steps",
  "context": {
    "lead_data": {
      "name": "John Doe",
      "company": "TechCorp",
      "email": "john@techcorp.com"
    }
  }
}
```

### Quick Actions
```bash
# Qualify a lead
POST /api/quick-actions/qualify-lead
{
  "name": "John Doe",
  "company": "TechCorp", 
  "source": "website"
}

# Generate a message
POST /api/quick-actions/generate-message
{
  "name": "John Doe",
  "company": "TechCorp"
}
```

## 🎯 Integration with CRM

The AI service integrates seamlessly with your CRM:

1. **Stage 4**: AI suggestions appear in the CRM interface
2. **Stage 5**: Users can create AI employees via UI
3. **Autonomous**: AI employees work independently with oversight

## 💰 Cost Benefits

| Feature | Cloud AI | Local AI |
|---------|----------|----------|
| Lead Qualification | $0.01/request | **$0** |
| Message Generation | $0.005/message | **$0** |
| Monthly Cost (1000 leads) | ~$50/month | **$0** |
| Data Privacy | Cloud | **Local** |
| Internet Required | Yes | **No** |

## 🔧 Configuration

### Environment Variables
```bash
# Local AI Settings
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=llama3.1:8b

# Vector Database
CHROMA_HOST=localhost
CHROMA_PORT=8001

# Performance
MAX_CONCURRENT_REQUESTS=5
CACHE_TTL=3600
```

### Available Models
- `llama3.1:8b` - Main conversational model (4GB)
- `phi3:mini` - Lightweight backup (2GB)  
- `codellama:7b` - Technical tasks (4GB)

## 📊 Monitoring

### Health Check
```bash
GET /health
```

### Employee Performance
```bash
GET /api/employees
GET /api/employees/{name}
```

## 🚦 Production Deployment

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    
  ai-service:
    build: .
    environment:
      - ENVIRONMENT=production
    restart: unless-stopped
```

### Resource Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+ (12GB recommended)
- **Storage**: 20GB+ for models
- **Network**: Local network only (no internet required)

## 🔒 Security & Privacy

- **100% Local**: All AI processing happens on your servers
- **Zero Cloud Dependency**: No data leaves your infrastructure  
- **Privacy First**: Customer data never transmitted externally
- **Cost Control**: Predictable $0 AI costs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test with local AI setup
4. Submit pull request

## 📞 Support

- Check logs: `docker-compose logs ai-service`
- Health status: `curl localhost:8000/health`
- Model status: `curl localhost:11434/api/tags`

---

**Ready to build your AI workforce? Start with the setup script!**

```bash
./setup-ollama.sh
```