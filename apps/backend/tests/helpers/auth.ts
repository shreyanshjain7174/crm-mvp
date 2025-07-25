import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  company: string;
  token?: string;
}

export function generateTestToken(user: Partial<TestUser>): string {
  const payload = {
    userId: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only');
}

export async function createAuthenticatedUser(app: FastifyInstance): Promise<TestUser> {
  const user: TestUser = {
    id: 'test-user-' + Date.now(),
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    company: 'Test Company',
  };
  
  // Create user in database
  await app.db.query(
    'INSERT INTO users (id, email, name, company, password) VALUES ($1, $2, $3, $4, $5)',
    [user.id, user.email, user.name, user.company, '$2a$10$mock_hashed_password']
  );
  
  // Generate token
  user.token = generateTestToken(user);
  
  return user;
}

export function getAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}