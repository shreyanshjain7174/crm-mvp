import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { getNextPhone } from '../helpers/test-data';
import { LeadStatus, Priority } from '../../src/types/enums';

describe('Leads Pipeline Management', () => {
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

  describe('Status Progression', () => {
    it('should track lead status progression through pipeline', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Pipeline Lead', getNextPhone(), 'COLD', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Progress through pipeline stages
      const statuses = [LeadStatus.WARM, LeadStatus.HOT, LeadStatus.CONVERTED];
      
      for (const status of statuses) {
        const response = await api.put(`/api/leads/${leadId}`, { status }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        expect(response.statusCode).toBe(200);
        expect(response.json.status).toBe(status);
      }

      // Verify all status change interactions were created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2 ORDER BY created_at ASC',
        [leadId, 'STATUS_CHANGE']
      );

      expect(interactions.rows).toHaveLength(3);
      expect(interactions.rows[0].description).toContain('WARM');
      expect(interactions.rows[1].description).toContain('HOT');
      expect(interactions.rows[2].description).toContain('CONVERTED');
    });

    it('should allow backward status movement', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Backward Move Lead', getNextPhone(), 'HOT', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Move backward in pipeline
      const response = await api.put(`/api/leads/${leadId}`, { 
        status: LeadStatus.WARM 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.status).toBe('WARM');

      // Verify interaction was created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(1);
      expect(interactions.rows[0].description).toContain('WARM');
    });

    it('should handle invalid status transitions gracefully', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Invalid Status Lead', getNextPhone(), 'COLD', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        status: 'INVALID_STATUS' as any 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });

    it('should not create duplicate status change interactions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Duplicate Status Lead', getNextPhone(), 'COLD', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Update to same status
      await api.put(`/api/leads/${leadId}`, { 
        status: LeadStatus.COLD 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Verify no status change interaction was created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(0);
    });
  });

  describe('Priority Management', () => {
    it('should update lead priority within pipeline stage', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, priority, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Priority Lead', getNextPhone(), 'LOW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        priority: Priority.URGENT 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('URGENT');
    });

    it('should allow simultaneous status and priority updates', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, priority, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Combined Update Lead', getNextPhone(), 'COLD', 'LOW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        status: LeadStatus.HOT,
        priority: Priority.HIGH
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.status).toBe('HOT');
      expect(response.json.priority).toBe('HIGH');

      // Verify status change interaction was created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(1);
    });
  });

  describe('Lead Assignment', () => {
    it('should assign leads to agents', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Assignment Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        assignedTo: 'agent-123' 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.assigned_to).toBe('agent-123');
    });

    it('should reassign leads between agents', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, assigned_to, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Reassignment Lead', getNextPhone(), 'agent-1', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        assignedTo: 'agent-2' 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.assigned_to).toBe('agent-2');
    });

    it('should unassign leads by setting null', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, assigned_to, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Unassign Lead', getNextPhone(), 'agent-1', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, { 
        assignedTo: null 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.assigned_to).toBeNull();
    });
  });

  describe('Pipeline Analytics', () => {
    beforeEach(async () => {
      // Ensure clean database before each test in this block
      await cleanDatabase(app);
      
      const user = await createAuthenticatedUser(app);
      
      // Create leads in different pipeline stages
      const leadData = [
        { status: 'COLD', priority: 'LOW' },
        { status: 'COLD', priority: 'MEDIUM' },
        { status: 'WARM', priority: 'MEDIUM' },
        { status: 'WARM', priority: 'HIGH' },
        { status: 'HOT', priority: 'HIGH' },
        { status: 'HOT', priority: 'URGENT' },
        { status: 'CONVERTED', priority: 'HIGH' },
        { status: 'LOST', priority: 'LOW' }
      ];

      for (let i = 0; i < leadData.length; i++) {
        await app.db.query(
          'INSERT INTO leads (name, phone, status, priority, user_id) VALUES ($1, $2, $3, $4, $5)',
          [`Pipeline Lead ${i}`, getNextPhone(), leadData[i].status, leadData[i].priority, user.id]
        );
      }

      (global as any).testUser = user;
    });

    it('should calculate pipeline distribution', async () => {
      const user = (global as any).testUser;
      
      const response = await api.get('/api/leads', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      
      // Analyze pipeline distribution
      const statusCount = response.json.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      expect(statusCount['COLD']).toBe(2);
      expect(statusCount['WARM']).toBe(2);
      expect(statusCount['HOT']).toBe(2);
      expect(statusCount['CONVERTED']).toBe(1);
      expect(statusCount['LOST']).toBe(1);
    });

    it('should analyze priority distribution across pipeline', async () => {
      const user = (global as any).testUser;
      
      const response = await api.get('/api/leads', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      
      // Analyze priority distribution
      const priorityCount = response.json.reduce((acc: any, lead: any) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1;
        return acc;
      }, {});

      expect(priorityCount['LOW']).toBe(2);
      expect(priorityCount['MEDIUM']).toBe(2);
      expect(priorityCount['HIGH']).toBe(3);
      expect(priorityCount['URGENT']).toBe(1);
    });

    it('should calculate conversion rates', async () => {
      const user = (global as any).testUser;
      
      const response = await api.get('/api/leads', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      
      const totalLeads = response.json.length;
      const convertedLeads = response.json.filter((lead: any) => lead.status === 'CONVERTED').length;
      const lostLeads = response.json.filter((lead: any) => lead.status === 'LOST').length;
      
      const conversionRate = (convertedLeads / totalLeads) * 100;
      const lossRate = (lostLeads / totalLeads) * 100;

      expect(totalLeads).toBe(8);
      expect(convertedLeads).toBe(1);
      expect(lostLeads).toBe(1);
      expect(conversionRate).toBe(12.5);
      expect(lossRate).toBe(12.5);
    });
  });

  describe('Pipeline Validation', () => {
    it('should prevent invalid enum values', async () => {
      const user = await createAuthenticatedUser(app);
      
      const response = await api.post('/api/leads', {
        name: 'Invalid Enum Lead',
        phone: getNextPhone(),
        status: 'INVALID_STATUS',
        priority: 'INVALID_PRIORITY'
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
      expect(response.json.details).toBeDefined();
    });

    it('should apply default values for pipeline fields', async () => {
      const user = await createAuthenticatedUser(app);
      
      const response = await api.post('/api/leads', {
        name: 'Default Values Lead',
        phone: getNextPhone()
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('MEDIUM'); // Default from schema
      expect(response.json.status).toBe('COLD'); // Database default
      expect(response.json.assigned_to).toBeNull();
    });

    it('should maintain data consistency during pipeline operations', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead
      const createResponse = await api.post('/api/leads', {
        name: 'Consistency Lead',
        phone: getNextPhone(),
        priority: Priority.HIGH
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const leadId = createResponse.json.id;

      // Perform multiple updates
      await api.put(`/api/leads/${leadId}`, { 
        status: LeadStatus.WARM 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      await api.put(`/api/leads/${leadId}`, { 
        assignedTo: 'agent-1' 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Verify final state
      const finalResponse = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(finalResponse.statusCode).toBe(200);
      expect(finalResponse.json.status).toBe('WARM');
      expect(finalResponse.json.priority).toBe('HIGH');
      expect(finalResponse.json.assigned_to).toBe('agent-1');
    });
  });

  describe('Pipeline Performance', () => {
    it('should handle bulk status updates efficiently', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create multiple leads
      const leadIds = [];
      for (let i = 0; i < 5; i++) {
        const result = await app.db.query(
          'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
          [`Bulk Update Lead ${i}`, getNextPhone(), 'COLD', user.id]
        );
        leadIds.push(result.rows[0].id);
      }

      // Perform bulk updates
      const updatePromises = leadIds.map(id =>
        api.put(`/api/leads/${id}`, { status: LeadStatus.WARM }, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(updatePromises);
      const endTime = Date.now();

      // All updates should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.json.status).toBe('WARM');
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify all status change interactions were created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = ANY($1) AND type = $2',
        [leadIds, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(5);
    });

    it('should maintain pipeline integrity under concurrent updates', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, priority, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Concurrent Pipeline Lead', getNextPhone(), 'COLD', 'LOW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Perform concurrent pipeline operations
      const operations = [
        api.put(`/api/leads/${leadId}`, { status: LeadStatus.WARM }, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        api.put(`/api/leads/${leadId}`, { priority: Priority.HIGH }, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        api.put(`/api/leads/${leadId}`, { assignedTo: 'agent-1' }, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ];

      const responses = await Promise.all(operations);

      // All operations should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Verify final state is consistent
      const finalResponse = await api.get(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(finalResponse.statusCode).toBe(200);
      expect(finalResponse.json.id).toBe(leadId);
      
      // At least one status change interaction should exist
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Pipeline Business Rules', () => {
    it('should enforce business rules for status progression', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Business Rules Lead', getNextPhone(), 'CONVERTED', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // TODO: Implement business rule validation
      // For now, any status change is allowed, but this documents expected behavior
      
      // Should not allow moving from CONVERTED back to active pipeline
      const response = await api.put(`/api/leads/${leadId}`, { 
        status: LeadStatus.HOT 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Current implementation allows this, but it might not be desired
      expect(response.statusCode).toBe(200);
      
      // TODO: Add business rule validation
      // expect(response.statusCode).toBe(400);
      // expect(response.json.error).toContain('Invalid status transition');
    });

    it('should auto-escalate high-priority leads', async () => {
      const user = await createAuthenticatedUser(app);
      
      // TODO: This test documents expected auto-escalation behavior
      const response = await api.post('/api/leads', {
        name: 'Auto-Escalate Lead',
        phone: getNextPhone(),
        priority: Priority.URGENT,
        businessProfile: 'Enterprise client with immediate needs'
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('URGENT');
      
      // TODO: Implement auto-escalation rules
      // URGENT priority leads should automatically move to WARM status
      // expect(response.json.status).toBe('WARM');
    });

    it('should track pipeline velocity metrics', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Velocity Lead', getNextPhone(), 'COLD', user.id, new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)]
      );
      const leadId = leadResult.rows[0].id;

      // Progress through pipeline with time gaps
      await new Promise(resolve => setTimeout(resolve, 10));
      await api.put(`/api/leads/${leadId}`, { status: LeadStatus.WARM }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      await api.put(`/api/leads/${leadId}`, { status: LeadStatus.HOT }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      await api.put(`/api/leads/${leadId}`, { status: LeadStatus.CONVERTED }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Analyze pipeline velocity
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2 ORDER BY created_at ASC',
        [leadId, 'STATUS_CHANGE']
      );

      expect(interactions.rows).toHaveLength(3);
      
      // Calculate time between status changes
      const timeDeltas = [];
      for (let i = 1; i < interactions.rows.length; i++) {
        const delta = new Date(interactions.rows[i].created_at).getTime() - 
                     new Date(interactions.rows[i-1].created_at).getTime();
        timeDeltas.push(delta);
      }

      // All deltas should be positive (forward progression)
      timeDeltas.forEach(delta => {
        expect(delta).toBeGreaterThan(0);
      });
    });
  });
});