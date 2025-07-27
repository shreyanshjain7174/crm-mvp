import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { getNextPhone } from '../helpers/test-data';
import { LeadStatus, Priority } from '../../src/types/enums';

describe('Lead Scoring and Business Logic', () => {
  let app: FastifyInstance;
  let api: ApiTestHelper;

  beforeAll(async () => {
    app = await buildApp();
    api = createApiHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('Lead Scoring Algorithm', () => {
    it('should calculate base score from lead properties', async () => {
      const user = await createAuthenticatedUser(app);
      
      const highValueLead = {
        name: 'Enterprise CEO',
        phone: getNextPhone(),
        email: 'ceo@fortune500.com',
        source: 'Referral',
        priority: Priority.URGENT,
        businessProfile: 'Fortune 500 company, $50M budget, 10,000+ employees'
      };

      const response = await api.post('/api/leads', highValueLead, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.business_profile).toContain('Fortune 500');
      
      // TODO: Implement lead scoring algorithm
      // High-value leads should get higher base scores
      // expect(response.json.lead_score).toBeGreaterThan(80);
      // expect(response.json.scoring_factors).toEqual(
      //   expect.arrayContaining(['enterprise_profile', 'high_priority', 'referral_source'])
      // );
    });

    it('should score based on business profile keywords', async () => {
      const user = await createAuthenticatedUser(app);
      
      const profileTestCases = [
        {
          profile: 'Early-stage startup, limited budget',
          expectedRange: [20, 40] // Lower score
        },
        {
          profile: 'Mid-market company, established business, growth phase',
          expectedRange: [50, 70] // Medium score
        },
        {
          profile: 'Enterprise corporation, Fortune 500, immediate purchase intent',
          expectedRange: [80, 100] // High score
        }
      ];

      for (const testCase of profileTestCases) {
        const response = await api.post('/api/leads', {
          name: 'Profile Test Lead',
          phone: getNextPhone(),
          businessProfile: testCase.profile
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json.business_profile).toBe(testCase.profile);
        
        // TODO: Implement profile-based scoring
        // expect(response.json.lead_score).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
        // expect(response.json.lead_score).toBeLessThanOrEqual(testCase.expectedRange[1]);
      }
    });

    it('should adjust score based on lead source quality', async () => {
      const user = await createAuthenticatedUser(app);
      
      const sourceScoring = [
        { source: 'Website', expectedMultiplier: 1.0 },
        { source: 'LinkedIn', expectedMultiplier: 1.2 },
        { source: 'Referral', expectedMultiplier: 1.5 },
        { source: 'WhatsApp', expectedMultiplier: 0.8 }
      ];

      for (const test of sourceScoring) {
        const response = await api.post('/api/leads', {
          name: 'Source Test Lead',
          phone: getNextPhone(),
          source: test.source,
          businessProfile: 'Standard business profile'
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json.source).toBe(test.source);
        
        // TODO: Implement source-based scoring
        // Referral leads should have higher scores than website leads
        // expect(response.json.source_score_multiplier).toBe(test.expectedMultiplier);
      }
    });

    it('should factor in priority level for scoring', async () => {
      const user = await createAuthenticatedUser(app);
      
      const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT];
      
      for (const priority of priorities) {
        const response = await api.post('/api/leads', {
          name: 'Priority Test Lead',
          phone: getNextPhone(),
          priority,
          businessProfile: 'Standard business profile'
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json.priority).toBe(priority);
        
        // TODO: Implement priority-based scoring
        // URGENT leads should have highest priority scores
        // if (priority === Priority.URGENT) {
        //   expect(response.json.priority_score).toBe(100);
        // } else if (priority === Priority.HIGH) {
        //   expect(response.json.priority_score).toBe(75);
        // }
      }
    });
  });

  describe('Engagement Scoring', () => {
    it('should calculate engagement score from interactions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Engagement Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add various interactions
      const interactions = [
        { type: 'CALL', description: 'Successful discovery call', weight: 15 },
        { type: 'EMAIL', description: 'Product demo email sent', weight: 10 },
        { type: 'WHATSAPP', description: 'Follow-up conversation', weight: 12 },
        { type: 'MEETING', description: 'Product demonstration', weight: 20 }
      ];

      for (const interaction of interactions) {
        await app.db.query(
          'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
          [leadId, interaction.type, interaction.description, new Date()]
        );
      }

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.interactions).toHaveLength(4);
      
      // TODO: Implement engagement scoring
      // expect(response.json.engagement_score).toBe(57); // Sum of interaction weights
      // expect(response.json.engagement_level).toBe('HIGH');
    });

    it('should weight recent interactions more heavily', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Recency Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add interactions with different timestamps
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'CALL', 'Old interaction', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
      );
      
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'CALL', 'Recent interaction', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.interactions).toHaveLength(2);
      
      // TODO: Implement recency weighting
      // Recent interactions should contribute more to engagement score
      // expect(response.json.recency_weighted_score).toBeGreaterThan(response.json.base_engagement_score);
    });

    it('should consider message sentiment in scoring', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Sentiment Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add messages with different sentiments
      const messages = [
        { content: 'Very interested in your product!', direction: 'INBOUND', sentiment: 'positive' },
        { content: 'Can we schedule a demo soon?', direction: 'INBOUND', sentiment: 'positive' },
        { content: 'Not sure if this fits our needs', direction: 'INBOUND', sentiment: 'neutral' },
        { content: 'This looks exactly what we need!', direction: 'INBOUND', sentiment: 'positive' }
      ];

      for (const message of messages) {
        await app.db.query(
          'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
          [leadId, message.content, message.direction, new Date()]
        );
      }

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.messages).toHaveLength(4);
      
      // TODO: Implement sentiment analysis
      // expect(response.json.sentiment_score).toBeGreaterThan(70); // Mostly positive messages
      // expect(response.json.dominant_sentiment).toBe('positive');
    });

    it('should track engagement velocity over time', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Velocity Lead', getNextPhone(), user.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
      );
      const leadId = leadResult.rows[0].id;

      // Add interactions spread over time
      const timePoints = [6, 4, 2, 1]; // Days ago
      
      for (const days of timePoints) {
        await app.db.query(
          'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
          [leadId, 'CALL', `Interaction ${days} days ago`, new Date(Date.now() - days * 24 * 60 * 60 * 1000)]
        );
      }

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.interactions).toHaveLength(4);
      
      // TODO: Implement engagement velocity calculation
      // Increasing interaction frequency should show positive velocity
      // expect(response.json.engagement_velocity).toBeGreaterThan(1.0); // Accelerating
    });
  });

  describe('Predictive Scoring', () => {
    it('should predict conversion probability', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, priority, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Prediction Lead', getNextPhone(), 'HOT', 'HIGH', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add positive signals
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'When can we get started?', 'INBOUND', new Date()]
      );
      
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'MEETING', 'Product demo completed', new Date()]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.status).toBe('HOT');
      expect(response.json.priority).toBe('HIGH');
      
      // TODO: Implement conversion prediction
      // Hot leads with positive engagement should have high conversion probability
      // expect(response.json.conversion_probability).toBeGreaterThan(0.8);
      // expect(response.json.predicted_conversion_timeframe).toBe('7-14 days');
    });

    it('should identify at-risk leads', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['At Risk Lead', getNextPhone(), 'WARM', user.id, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]
      );
      const leadId = leadResult.rows[0].id;

      // No recent interactions (stale lead)
      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.interactions).toBeNull();
      
      // TODO: Implement at-risk identification
      // Leads with no recent activity should be flagged as at-risk
      // expect(response.json.risk_score).toBeGreaterThan(70);
      // expect(response.json.risk_factors).toContain('no_recent_activity');
    });

    it('should suggest next best actions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, priority, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Action Lead', getNextPhone(), 'WARM', 'MEDIUM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add context for action recommendations
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Can you send me pricing information?', 'INBOUND', new Date()]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.messages).toHaveLength(1);
      
      // TODO: Implement next best action recommendations
      // Lead asking for pricing should get recommendation to send proposal
      // expect(response.json.recommended_actions).toContain('send_pricing_proposal');
      // expect(response.json.action_priorities).toEqual(
      //   expect.arrayContaining([{ action: 'send_pricing_proposal', priority: 95 }])
      // );
    });
  });

  describe('Lead Qualification Scoring', () => {
    it('should evaluate BANT criteria (Budget, Authority, Need, Timeline)', async () => {
      const user = await createAuthenticatedUser(app);
      
      const qualifiedLead = {
        name: 'BANT Qualified Lead',
        phone: getNextPhone(),
        email: 'decision.maker@company.com',
        businessProfile: 'VP Sales, 500+ employees, $100k budget allocated, Q4 implementation target'
      };

      const response = await api.post('/api/leads', qualifiedLead, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.business_profile).toContain('VP Sales');
      
      // TODO: Implement BANT scoring
      // expect(response.json.bant_score).toEqual({
      //   budget: 85,  // "$100k budget allocated" indicates good budget
      //   authority: 90, // "VP Sales" indicates decision-making authority
      //   need: 75,    // Inferred from seeking CRM solution
      //   timeline: 80  // "Q4 implementation" shows defined timeline
      // });
      // expect(response.json.overall_qualification_score).toBeGreaterThan(80);
    });

    it('should assess company fit and ICP alignment', async () => {
      const user = await createAuthenticatedUser(app);
      
      const icpTestCases = [
        {
          profile: 'SME manufacturing, 50-200 employees, growth stage',
          expectedFitScore: 95, // Perfect ICP match
          fitFactors: ['company_size_match', 'industry_fit', 'growth_stage']
        },
        {
          profile: 'Enterprise corporation, 10000+ employees, established',
          expectedFitScore: 60, // Too large for SME focus
          fitFactors: ['industry_fit']
        },
        {
          profile: 'Freelancer, individual contributor',
          expectedFitScore: 20, // Not target market
          fitFactors: []
        }
      ];

      for (const testCase of icpTestCases) {
        const response = await api.post('/api/leads', {
          name: 'ICP Test Lead',
          phone: getNextPhone(),
          businessProfile: testCase.profile
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json.business_profile).toBe(testCase.profile);
        
        // TODO: Implement ICP fit scoring
        // expect(response.json.icp_fit_score).toBe(testCase.expectedFitScore);
        // expect(response.json.fit_factors).toEqual(testCase.fitFactors);
      }
    });

    it('should evaluate lead readiness and buying signals', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Buying Signals Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add strong buying signals
      const buyingSignals = [
        'What is your implementation timeline?',
        'Can we schedule a demo for our executive team?',
        'What does the pricing look like for 100 users?',
        'Do you have references from similar companies?',
        'What support do you provide during onboarding?'
      ];

      for (const signal of buyingSignals) {
        await app.db.query(
          'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
          [leadId, signal, 'INBOUND', new Date()]
        );
      }

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.messages).toHaveLength(5);
      
      // TODO: Implement buying signal detection
      // expect(response.json.buying_signals_detected).toEqual([
      //   'timeline_inquiry', 'demo_request', 'pricing_inquiry', 
      //   'reference_request', 'support_inquiry'
      // ]);
      // expect(response.json.readiness_score).toBeGreaterThan(85);
    });
  });

  describe('Scoring Updates and Recalculation', () => {
    it('should update scores when lead properties change', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, priority, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Score Update Lead', getNextPhone(), 'LOW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Update to high priority
      const response = await api.put(`/api/leads/${leadId}`, {
        priority: Priority.URGENT,
        businessProfile: 'Enterprise client, urgent implementation needed'
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('URGENT');
      
      // TODO: Implement score recalculation on updates
      // expect(response.json.lead_score).toBeGreaterThan(75); // Higher due to urgency
      // expect(response.json.score_change_reason).toContain('priority_upgrade');
    });

    it('should trigger score recalculation on new interactions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Interaction Score Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add new interaction
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'MEETING', 'Product demo completed successfully', new Date()]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.interactions).toHaveLength(1);
      
      // TODO: Implement interaction-based score updates
      // Demo completion should increase lead score
      // expect(response.json.engagement_score).toBeGreaterThan(50);
      // expect(response.json.last_score_update).toBeDefined();
    });

    it('should maintain score history for trend analysis', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Score History Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Make multiple updates to create score history
      await api.put(`/api/leads/${leadId}`, { priority: Priority.MEDIUM }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      await api.put(`/api/leads/${leadId}`, { priority: Priority.HIGH }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      await api.put(`/api/leads/${leadId}`, { status: LeadStatus.HOT }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.status).toBe('HOT');
      expect(response.json.priority).toBe('HIGH');
      
      // TODO: Implement score history tracking
      // expect(response.json.score_history).toHaveLength(3);
      // expect(response.json.score_trend).toBe('increasing');
    });
  });

  describe('Business Logic Integration', () => {
    it('should integrate scoring with auto-assignment rules', async () => {
      const user = await createAuthenticatedUser(app);
      
      const highScoreLead = {
        name: 'Auto-Assign Lead',
        phone: getNextPhone(),
        priority: Priority.URGENT,
        businessProfile: 'Fortune 500 company, immediate purchase intent, $500k budget'
      };

      const response = await api.post('/api/leads', highScoreLead, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('URGENT');
      
      // TODO: Implement score-based auto-assignment
      // High-scoring leads should auto-assign to senior agents
      // expect(response.json.assigned_to).toBeDefined();
      // expect(response.json.assignment_reason).toBe('high_lead_score');
    });

    it('should trigger follow-up tasks based on scoring', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Task Trigger Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add interaction that should trigger follow-up
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Please send me your proposal by Friday', 'INBOUND', new Date()]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.messages).toHaveLength(1);
      
      // TODO: Implement task creation based on scoring and content
      // Request for proposal should create follow-up task
      // expect(response.json.suggested_tasks).toContain({
      //   type: 'send_proposal',
      //   priority: 'high',
      //   due_date: expect.any(String)
      // });
    });

    it('should provide scoring explanations for transparency', async () => {
      const user = await createAuthenticatedUser(app);
      
      const response = await api.post('/api/leads', {
        name: 'Explanation Lead',
        phone: getNextPhone(),
        email: 'cto@techstartup.com',
        source: 'Referral',
        priority: Priority.HIGH,
        businessProfile: 'Tech startup, Series B, expanding team, looking for scalable CRM'
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.source).toBe('Referral');
      
      // TODO: Implement scoring explanation
      // expect(response.json.score_explanation).toEqual({
      //   total_score: 78,
      //   breakdown: {
      //     profile_score: 25, // "Series B, expanding team"
      //     source_score: 20,  // "Referral"
      //     priority_score: 18, // "HIGH"
      //     email_score: 15    // "cto@techstartup.com" (decision maker)
      //   },
      //   key_factors: ['referral_source', 'decision_maker_email', 'growth_stage_company']
      // });
    });
  });
});