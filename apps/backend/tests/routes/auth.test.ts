import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { factories } from '../helpers/factories';
import { cleanDatabase } from '../helpers/db';
import bcrypt from 'bcryptjs';

describe('Auth Routes', () => {
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
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = factories.user();
      
      const response = await api.post('/api/auth/register', {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        company: userData.company,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('user');
      expect(response.json).toHaveProperty('token');
      expect(response.json.user.email).toBe(userData.email);
      expect(response.json.user.name).toBe(userData.name);
      expect(response.json.message).toBe('User registered successfully');
    });

    it('should not register a user with existing email', async () => {
      const userData = factories.user();
      
      // Register first user
      await api.post('/api/auth/register', userData);
      
      // Try to register with same email
      const response = await api.post('/api/auth/register', userData);
      
      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await api.post('/api/auth/register', {
        email: 'invalid-email',
        password: '123', // Too short
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await app.db.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4)',
        ['test@example.com', hashedPassword, 'Test User', 'Test Company']
      );
    });

    it('should login with valid credentials', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('user');
      expect(response.json).toHaveProperty('token');
      expect(response.json.user.email).toBe('test@example.com');
      expect(response.json.message).toBe('Login successful');
    });

    it('should not login with invalid password', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json.error).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile when authenticated', async () => {
      // Create and login user
      const userData = factories.user();
      const registerResponse = await api.post('/api/auth/register', userData);
      const token = registerResponse.json.token;

      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.user.email).toBe(userData.email);
      expect(response.json.user.name).toBe(userData.name);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.get('/api/auth/me');

      expect(response.statusCode).toBe(401);
      expect(response.json.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      // Create and login user
      const userData = factories.user();
      const registerResponse = await api.post('/api/auth/register', userData);
      const token = registerResponse.json.token;

      const response = await api.put('/api/auth/profile', 
        {
          name: 'Updated Name',
          company: 'Updated Company',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.json.user.name).toBe('Updated Name');
      expect(response.json.user.company).toBe('Updated Company');
      expect(response.json.message).toBe('Profile updated successfully');
    });
  });
});