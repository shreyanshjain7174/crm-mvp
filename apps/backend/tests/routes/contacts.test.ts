import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { factories } from '../helpers/factories';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

describe('Contacts Routes', () => {
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

  describe('GET /api/contacts', () => {
    it('should return paginated contacts list', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test contacts
      const contacts = factories.generateBatch(factories.contact, 3, { user_id: user.id });
      for (const contact of contacts) {
        await app.db.query(
          'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
          [user.id, contact.name, contact.email, contact.phone, contact.status]
        );
      }

      const response = await api.get('/api/contacts', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.contacts).toHaveLength(3);
      expect(response.json.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('should filter contacts by search query', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create contacts with different names
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'John Doe', 'john@example.com', '+1234567890', 'ACTIVE']
      );
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'Jane Smith', 'jane@example.com', '+0987654321', 'ACTIVE']
      );

      const response = await api.get('/api/contacts?search=John', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.contacts).toHaveLength(1);
      expect(response.json.contacts[0].name).toBe('John Doe');
    });

    it('should filter contacts by status', async () => {
      const user = await createAuthenticatedUser(app);
      
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'Active Contact', 'active@example.com', '+1111111111', 'ACTIVE']
      );
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'Inactive Contact', 'inactive@example.com', '+2222222222', 'INACTIVE']
      );

      const response = await api.get('/api/contacts?status=ACTIVE', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.contacts).toHaveLength(1);
      expect(response.json.contacts[0].status).toBe('ACTIVE');
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/contacts');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/contacts/stats', () => {
    it('should return contact statistics', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create contacts with different statuses
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, status, created_at) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'Contact 1', 'c1@example.com', 'ACTIVE', new Date()]
      );
      await app.db.query(
        'INSERT INTO contacts (user_id, name, email, status, created_at) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'Contact 2', 'c2@example.com', 'INACTIVE', new Date()]
      );

      const response = await api.get('/api/contacts/stats', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.total).toBe(2);
      expect(response.json.byStatus.active).toBe(1);
      expect(response.json.byStatus.inactive).toBe(1);
      expect(response.json.byStatus.blocked).toBe(0);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const user = await createAuthenticatedUser(app);
      const contactData = factories.contact();

      const response = await api.post('/api/contacts', contactData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json.name).toBe(contactData.name);
      expect(response.json.email).toBe(contactData.email);
      expect(response.json.phone).toBe(contactData.phone);
      expect(response.json.status).toBe(contactData.status);
    });

    it('should validate required fields', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/contacts', {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate email format', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/contacts', {
        name: 'Test Contact',
        email: 'invalid-email',
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should return a specific contact', async () => {
      const user = await createAuthenticatedUser(app);
      
      const result = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Test Contact', 'test@example.com', '+1234567890', 'ACTIVE']
      );
      const contactId = result.rows[0].id;

      const response = await api.get(`/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe('Test Contact');
      expect(response.json.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent contact', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/contacts/non-existent-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not return contacts from other users', async () => {
      const user1 = await createAuthenticatedUser(app);
      const user2 = await createAuthenticatedUser(app);
      
      const result = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user1.id, 'User1 Contact', 'user1@example.com', '+1111111111', 'ACTIVE']
      );
      const contactId = result.rows[0].id;

      const response = await api.get(`/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${user2.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update a contact', async () => {
      const user = await createAuthenticatedUser(app);
      
      const result = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Original Name', 'original@example.com', '+1234567890', 'ACTIVE']
      );
      const contactId = result.rows[0].id;

      const response = await api.put(`/api/contacts/${contactId}`, {
        name: 'Updated Name',
        email: 'updated@example.com',
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe('Updated Name');
      expect(response.json.email).toBe('updated@example.com');
    });

    it('should return 404 for non-existent contact', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.put('/api/contacts/non-existent-id', {
        name: 'Updated Name',
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact', async () => {
      const user = await createAuthenticatedUser(app);
      
      const result = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'To Delete', 'delete@example.com', '+1234567890', 'ACTIVE']
      );
      const contactId = result.rows[0].id;

      const response = await api.delete(`/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);

      // Verify contact is deleted
      const checkResult = await app.db.query(
        'SELECT * FROM contacts WHERE id = $1',
        [contactId]
      );
      expect(checkResult.rows).toHaveLength(0);
    });

    it('should return 404 for non-existent contact', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.delete('/api/contacts/non-existent-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/contacts/bulk', () => {
    it('should delete multiple contacts', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create multiple contacts
      const contact1 = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Contact 1', 'c1@example.com', '+1111111111', 'ACTIVE']
      );
      const contact2 = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Contact 2', 'c2@example.com', '+2222222222', 'ACTIVE']
      );

      const contactIds = [contact1.rows[0].id, contact2.rows[0].id];

      const response = await api.post('/api/contacts/bulk', {
        action: 'delete',
        contactIds,
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.deletedCount).toBe(2);
    });

    it('should update multiple contacts', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create multiple contacts
      const contact1 = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Contact 1', 'c1@example.com', '+1111111111', 'ACTIVE']
      );
      const contact2 = await app.db.query(
        'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.id, 'Contact 2', 'c2@example.com', '+2222222222', 'ACTIVE']
      );

      const contactIds = [contact1.rows[0].id, contact2.rows[0].id];

      const response = await api.post('/api/contacts/bulk', {
        action: 'update',
        contactIds,
        updateData: {
          status: 'INACTIVE',
        },
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.updatedCount).toBe(2);
    });

    it('should validate bulk action parameters', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/contacts/bulk', {
        action: 'invalid',
        contactIds: [],
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});