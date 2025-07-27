# CRM MVP Project Restructure Plan

## Current Issues
1. **Redundant proxy setup**: Both nginx.conf and proxy-server.js serve the same purpose
2. **Scattered files**: Log files, scripts, and configs mixed in root directory
3. **Complex deployment**: Multiple Docker setups causing confusion
4. **Documentation sprawl**: Too many markdown files in different locations

## Proposed New Structure

```
crm-mvp/
├── apps/
│   ├── backend/           # Backend application
│   └── frontend/          # Frontend application
├── packages/              # Shared packages/libraries
│   ├── agent-sdk/         # Move from libs/agent-sdk
│   └── agent-protocol/    # Move from libs/agent-protocol
├── docs/                  # All documentation
│   ├── README.md          # Main project README
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── DEVELOPMENT.md     # Development setup
│   ├── API.md             # API documentation
│   ├── ARCHITECTURE.md    # System architecture
│   └── integrations/      # Integration specific docs
├── scripts/               # All automation scripts
│   ├── dev/              # Development scripts
│   ├── deploy/           # Deployment scripts
│   └── ci/               # CI/CD scripts
├── infra/                 # Infrastructure as code
│   ├── docker/           # Docker configurations
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── Dockerfile.proxy
│   ├── nginx/            # Nginx configs
│   └── k8s/              # Kubernetes manifests (future)
├── examples/              # Example integrations
│   └── cozmox-voice-agent/
├── .github/              # GitHub workflows
│   └── workflows/
├── logs/                 # All log files
└── temp/                 # Temporary files
```

## Migration Steps

### Step 1: Create New Directory Structure
- Create `docs/`, `infra/`, `examples/`, `logs/` directories
- Move `libs/` content to `packages/`
- Consolidate all documentation

### Step 2: Simplify Proxy Setup
- **Remove redundancy**: Choose between nginx or Node.js proxy (recommend nginx)
- **Standardize**: Single docker-compose setup
- **Clean config**: Simplified nginx.conf for development and production

### Step 3: Organize Scripts
- Move all scripts to `scripts/` with subdirectories
- Remove duplicate functionality
- Create single entry points for common tasks

### Step 4: Update Documentation
- Split README.md into focused documents
- Create deployment guide with free hosting options
- Document development workflow

## Deployment Strategy Recommendations

### For Development (Local)
- Use **Railway** or **Render** for free hosting with GitHub integration
- Both support Docker and automatic deployments

### For Production
- **Primary recommendation**: Railway (generous free tier, easy setup)
- **Alternative**: Render (excellent for full-stack apps)
- **Advanced**: DigitalOcean with GitHub Actions (more control)

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway/Render
        # Automatic deployment via platform integration
```

## Benefits of This Structure

1. **Clear separation of concerns**
2. **Easier navigation and maintenance**
3. **Better CI/CD integration**
4. **Simplified deployment**
5. **Professional project layout**
6. **Documentation organization**

## Implementation Priority

1. **High**: Simplify proxy setup (remove duplication)
2. **High**: Move logs to dedicated directory
3. **High**: Reorganize documentation
4. **Medium**: Move libs to packages
5. **Medium**: Organize scripts
6. **Low**: Create infra directory structure