# Backend API Testing Documentation

This directory contains comprehensive tests for the CRM Backend APIs, with a focus on the Stats API endpoints.

## Stats API Testing

The Stats API testing suite provides comprehensive coverage of the statistics endpoints that power the CRM dashboard and user progress tracking.

### Test Structure

```
tests/
├── routes/
│   ├── stats.test.ts                    # Basic functionality tests
│   ├── stats-integration.test.ts        # Cross-component integration tests
│   └── stats-comprehensive.test.ts      # Advanced scenario and performance tests
├── utils/
│   ├── testApp.ts                      # Test application setup utilities
│   └── statsTestHelpers.ts            # Specialized stats testing utilities
└── setup.ts                           # Global test configuration
```

### Test Categories

#### 1. **Basic Functionality Tests** (`stats.test.ts`)
- Dashboard statistics calculation
- User progress tracking
- Growth percentage calculations
- Error handling and recovery
- Database error scenarios
- API response validation

#### 2. **Integration Tests** (`stats-integration.test.ts`)
- Multi-user data isolation
- Real-time data updates
- Concurrent operation consistency
- Time-based calculations
- Error recovery and resilience
- Business logic validation

#### 3. **Comprehensive Tests** (`stats-comprehensive.test.ts`)
- Business scenario testing (empty, startup, growing, enterprise)
- Performance and scalability testing
- Edge case and error handling
- API contract compliance
- Advanced business logic validation

### API Endpoints Tested

#### Dashboard Statistics
- **Endpoint:** `GET /api/stats/dashboard`
- **Purpose:** Provides key business metrics for the dashboard
- **Tested Scenarios:**
  - Empty business (no data)
  - Startup business (1-10 leads)
  - Growing business (25+ leads)
  - Enterprise business (100+ leads)
  - Time-based growth calculations
  - Conversion rate calculations

**Response Schema:**
```typescript
{
  totalLeads: number;
  activeConversations: number;
  conversionRate: number;
  hotLeads: number;
  growth: {
    leads: number;
    conversations: number;
    hotLeads: number;
    conversionRate: number;
  };
}
```

#### User Progress Statistics
- **Endpoint:** `GET /api/stats/user/progress`
- **Purpose:** Tracks user progression through CRM stages
- **Tested Scenarios:**
  - Stage transitions (new → beginner → intermediate → advanced → expert)
  - Progress percentage calculations
  - Next stage requirements
  - Activity-based progression

**Response Schema:**
```typescript
{
  stage: 'new' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  stats: {
    contactsAdded: number;
    messagesSent: number;
    aiInteractions: number;
    templatesUsed: number;
    pipelineActions: number;
  };
  progressPercentage: number;
  nextStageRequirements: string[];
}
```

### Test Data Generators

The `statsTestHelpers.ts` file provides sophisticated test data generators for various business scenarios:

#### Business Scenarios
- **Empty Business:** No leads or activity
- **Startup Business:** 3 leads, 2 messages, basic activity
- **Growing Business:** 25 leads, 15 messages, intermediate activity  
- **Enterprise Business:** 100+ leads, 80+ messages, high activity
- **Time-based Scenario:** Data spread across time periods for growth testing

#### Edge Cases
- **Extreme Large Dataset:** 1000+ leads for performance testing
- **Zero Division Scenarios:** Edge cases that might cause calculation errors
- **Invalid Data Scenarios:** Malformed or boundary-condition data

### Performance Testing

The test suite includes comprehensive performance validation:

#### Metrics Tracked
- **Response Time:** < 1 second for normal operations, < 3 seconds for large datasets
- **Memory Usage:** < 100MB memory increase during operations
- **Concurrent Load:** 5+ concurrent requests with 0% failure rate
- **Scalability:** Linear performance degradation with dataset size

#### Load Testing
```typescript
const loadTestResults = await StatsPerformanceTestUtils.runLoadTest(
  () => request.get('/api/stats/dashboard'),
  5, // 5 concurrent requests
  3000 // for 3 seconds
);
```

### Business Logic Validation

The tests verify critical business rules:

#### Conversion Rate Calculation
- **Formula:** `(WARM + HOT + CONVERTED leads) / Total leads * 100`
- **Edge Cases:** Zero leads, all converted, all cold
- **Accuracy:** ±0.1% tolerance for floating point calculations

#### Stage Progression Logic
- **New:** 0 contacts
- **Beginner:** 1+ contacts
- **Intermediate:** 10+ contacts AND 5+ messages
- **Advanced:** 5+ messages AND 10+ pipeline actions
- **Expert:** 25+ AI interactions AND 10+ templates used

#### Growth Calculations
- **Period:** Last 30 days vs Previous 30 days
- **Formula:** `(Current - Previous) / Previous * 100`
- **Special Cases:** Zero division, first-time data

### Running Tests

#### Quick Commands
```bash
# Run all stats tests
npm run test:stats

# Run individual test suites
npm run test:stats:basic
npm run test:stats:integration
npm run test:stats:comprehensive

# Run with coverage
npm run test:coverage
```

#### Advanced Testing
```bash
# Run specific test file
npx jest tests/routes/stats.test.ts --verbose

# Run tests matching pattern
npx jest --testNamePattern="dashboard" --verbose

# Run tests with debugging
npx jest --detectOpenHandles --verbose --runInBand
```

### Test Coverage Goals

The Stats API testing aims for:

- **Line Coverage:** 95%+
- **Branch Coverage:** 90%+
- **Function Coverage:** 100%
- **Statement Coverage:** 95%+

#### Current Coverage Areas
- **API Endpoints:** 100% of stats endpoints tested  
- **Business Logic:** All calculation functions validated  
- **Error Scenarios:** Database errors, timeouts, invalid data  
- **Performance:** Load testing, memory profiling, scalability  
- **Integration:** Multi-user isolation, real-time updates  
- **Edge Cases:** Zero division, large datasets, malformed data  

### Test Quality Assurance

#### Code Quality
- **ESLint Integration:** All test files follow coding standards
- **TypeScript:** Full type safety in test code
- **Documentation:** Comprehensive inline documentation
- **Maintainability:** Modular, reusable test utilities

#### Test Reliability
- **Deterministic:** Tests produce consistent results
- **Isolated:** Each test is independent and can run alone
- **Fast:** Test suite completes in < 30 seconds
- **Comprehensive:** Covers all critical paths and edge cases

### Continuous Integration

The test suite integrates with CI/CD pipelines:

```yaml
# Example CI configuration
test-stats:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run Stats API tests
      run: npm run test:stats
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

### Debugging Tests

#### Common Issues
1. **Database Connection:** Ensure test database is properly mocked
2. **Async Operations:** Use proper async/await patterns
3. **Test Isolation:** Clean up data between tests
4. **Memory Leaks:** Close all connections and clear references

#### Debug Commands
```bash
# Run single test with debug info
npx jest tests/routes/stats.test.ts --verbose --no-cache

# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest tests/routes/stats.test.ts

# Check for memory leaks
npx jest --detectLeaks --runInBand
```

### Contributing to Tests

When adding new stats functionality:

1. **Add Unit Tests:** Test individual functions in isolation
2. **Add Integration Tests:** Test cross-component interactions  
3. **Add Performance Tests:** Validate scalability requirements
4. **Update Documentation:** Keep this README current
5. **Verify Coverage:** Ensure new code is fully tested

#### Test Writing Guidelines
- Use descriptive test names that explain the scenario
- Follow the Arrange-Act-Assert pattern
- Include both happy path and error scenarios
- Test edge cases and boundary conditions
- Use realistic test data that matches production scenarios

### Monitoring and Alerts

The test suite can integrate with monitoring systems:

- **Test Results:** Sent to dashboard for tracking
- **Performance Metrics:** Monitored for regression detection  
- **Coverage Reports:** Tracked over time for quality assurance
- **Failure Alerts:** Immediate notification of test failures

This comprehensive testing approach ensures the Stats API is reliable, performant, and ready for production use at scale.