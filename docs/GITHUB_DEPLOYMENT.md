# 🚀 GitHub + Fly.io Automatic Deployment

Complete guide for setting up automatic deployments from GitHub to Fly.io with CI/CD pipeline.

## 🎯 Why GitHub Integration?

- **Automatic Deployments**: Push to main → automatic deploy
- **PR Previews**: Each PR gets its own staging environment
- **Quality Gates**: Tests must pass before deployment
- **Zero Manual Work**: Set once, deploy forever
- **Rollback Support**: Easy to revert to previous versions

## 📋 Setup Steps

### 1. Get Fly.io API Token

```bash
# Generate API token
flyctl auth token

# Copy the token - you'll need it for GitHub secrets
```

### 2. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- **`FLY_API_TOKEN`**: The token from step 1

### 3. GitHub Actions Workflow

The workflow is already created at `.github/workflows/fly-deploy.yml` and includes:

**✅ Quality Gates:**
- Linting with ESLint
- Type checking with TypeScript
- Full test suite with database
- Only deploy if all tests pass

**✅ Smart Deployment:**
- **Main branch** → Production deployment
- **Pull Requests** → Staging environment
- **Concurrent safety** → Only one deployment at a time

**✅ Test Environment:**
- PostgreSQL 15 database
- Redis 7 cache
- Full integration testing

### 4. First Deployment

```bash
# Commit the workflow
git add .github/workflows/fly-deploy.yml
git commit -s -m "feat: add GitHub Actions CI/CD workflow for Fly.io"
git push origin main

# This will trigger the first automatic deployment!
```

## 🔄 How It Works

### On Every Push to Main:
1. **Test Phase** runs with real databases
2. **Quality checks** (lint, typecheck, tests)
3. **Deploy Phase** only if tests pass
4. **Automatic deployment** to production

### On Every Pull Request:
1. **Test Phase** runs the same quality checks
2. **Staging Deployment** creates a preview environment
3. **Review** the staging app before merging

## 🎛️ Advanced Configuration

### Multiple Environments

You can customize the workflow for different environments:

```yaml
# Production
- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: flyctl deploy --app crm-mvp

# Staging  
- name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  run: flyctl deploy --app crm-mvp-staging
```

### Environment-Specific Secrets

Set different secrets for different environments:

```bash
# Production secrets
flyctl secrets set ANTHROPIC_API_KEY="prod-key" --app crm-mvp

# Staging secrets  
flyctl secrets set ANTHROPIC_API_KEY="staging-key" --app crm-mvp-staging
```

### Custom Build Steps

Add custom steps to the workflow:

```yaml
- name: Build and optimize
  run: |
    npm run build
    npm run optimize
    
- name: Run security checks
  run: npm audit --audit-level moderate
```

## 🌐 Database Setup (Automatic)

The CI/CD workflow automatically handles:

**Production Database:**
```bash
# These run automatically on first deployment
flyctl postgres create --name crm-mvp-db --region bom
flyctl postgres attach crm-mvp-db --app crm-mvp
```

**Staging Database:**
```bash
# Separate database for staging
flyctl postgres create --name crm-mvp-staging-db --region bom  
flyctl postgres attach crm-mvp-staging-db --app crm-mvp-staging
```

## 📱 Monitoring Deployments

### GitHub Actions Dashboard
- View deployment status in GitHub Actions tab
- See test results and deployment logs
- Get notifications on failures

### Fly.io Dashboard  
```bash
# Check deployment status
flyctl status --app crm-mvp

# View recent deployments
flyctl releases --app crm-mvp

# Monitor logs
flyctl logs --app crm-mvp
```

### Automatic Notifications

Add Slack/Discord notifications to the workflow:

```yaml
- name: Notify deployment success
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚀 CRM MVP deployed successfully!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔐 Security Best Practices

### Secrets Management
- ✅ Use GitHub Secrets for sensitive data
- ✅ Never commit API keys to git
- ✅ Rotate tokens regularly
- ✅ Use different tokens for staging/production

### Access Control
```bash
# Limit API token permissions
flyctl tokens create deploy --app crm-mvp

# Use organization tokens for team access
flyctl orgs create your-team
```

### Environment Isolation
- ✅ Separate apps for staging/production
- ✅ Different databases for each environment
- ✅ Isolated secrets and configurations

## 🚨 Troubleshooting

### Common Issues

**1. Deployment Fails**
```bash
# Check GitHub Actions logs
# Fix issues and push again

# Manual deployment to test
flyctl deploy --app crm-mvp
```

**2. Tests Fail**
```bash
# Run tests locally first
npm test

# Check database connections
# Verify environment variables
```

**3. API Token Issues**
```bash
# Regenerate token
flyctl auth token

# Update GitHub secret
# Retry deployment
```

**4. Build Timeouts**
```yaml
# Extend timeout in workflow
- name: Deploy to Fly.io
  timeout-minutes: 20  # Default is 6 minutes
```

### Debug Mode

Enable debug logging:

```yaml
- name: Deploy with debug
  run: flyctl deploy --remote-only --verbose
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
    DEBUG: 1
```

## 📊 Deployment Metrics

Track deployment success:

```yaml
- name: Report deployment metrics
  run: |
    echo "Deployment completed at $(date)"
    echo "App URL: https://crm-mvp.fly.dev"
    flyctl status --app crm-mvp
```

## 🎯 Benefits Summary

**✅ Developer Experience:**
- Push code → automatic deployment
- No manual deployment steps
- Instant feedback on issues
- Easy rollbacks

**✅ Quality Assurance:**
- Tests run on every change
- No broken deployments
- Staging environment for testing
- Automated quality checks

**✅ Production Ready:**
- Zero-downtime deployments
- Health checks and monitoring
- Automatic scaling
- Global edge deployment

---

**🎉 Result**: Push to GitHub main branch = automatic production deployment!

Your CRM MVP now has enterprise-grade CI/CD with automatic testing and deployment.