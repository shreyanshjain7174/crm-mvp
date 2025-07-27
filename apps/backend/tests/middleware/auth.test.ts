import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { buildApp } from '../../src/index';
import { authenticate } from '../../src/middleware/auth';
import { generateTestToken } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

describe('Authentication Middleware', () => {
  let app: FastifyInstance;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let sendSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase();
    
    sendSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ send: sendSpy });
    
    mockRequest = {
      headers: {},
      server: app
    };
    
    mockReply = {
      status: statusSpy,
      send: sendSpy
    };
  });

  describe('Token Validation', () => {
    it('should authenticate with valid JWT token', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({
        userId: testUser.id,
        email: testUser.email,
        iat: expect.any(Number)
      });
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' });
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should reject request with empty authorization header', async () => {
      mockRequest.headers = {
        authorization: ''
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should reject request with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject request with invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.jwt.token'
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject expired JWT token', async () => {
      // Create a token that expires very quickly
      const expiredToken = app.jwt.sign(
        { userId: 'test-user', email: 'test@example.com' },
        { expiresIn: '1ms' } // Expires in 1 millisecond
      );
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));
      
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle token with missing Bearer prefix', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: token // Without "Bearer " prefix
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' });
    });
  });

  describe('Token Format Handling', () => {
    it('should handle authorization header with extra spaces', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `  Bearer   ${token}  ` // Extra spaces
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should fail because our current implementation doesn't trim spaces
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle case-sensitive Bearer keyword', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `bearer ${token}` // Lowercase 'bearer'
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should fail because our implementation expects 'Bearer' with capital B
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });

  describe('User Data Extraction', () => {
    it('should extract userId and email from token payload', async () => {
      const testUser = {
        id: 'user-456',
        email: 'user456@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect((mockRequest as any).user).toEqual(
        expect.objectContaining({
          userId: testUser.id,
          email: testUser.email
        })
      );
    });

    it('should handle token with additional claims', async () => {
      // Create token with extra claims
      const tokenWithExtraClaims = app.jwt.sign({
        userId: 'user-789',
        email: 'user789@example.com',
        role: 'admin',
        permissions: ['read', 'write']
      });
      
      mockRequest.headers = {
        authorization: `Bearer ${tokenWithExtraClaims}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect((mockRequest as any).user).toEqual(
        expect.objectContaining({
          userId: 'user-789',
          email: 'user789@example.com',
          role: 'admin',
          permissions: ['read', 'write']
        })
      );
    });

    it('should handle token with missing userId', async () => {
      // Create token without userId
      const tokenWithoutUserId = app.jwt.sign({
        email: 'test@example.com',
        name: 'Test User'
      });
      
      mockRequest.headers = {
        authorization: `Bearer ${tokenWithoutUserId}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect((mockRequest as any).user).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User'
        })
      );
      expect((mockRequest as any).user.userId).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle JWT verification throwing unexpected error', async () => {
      // Mock JWT verify to throw an unexpected error
      const originalVerify = app.jwt.verify;
      app.jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      const token = generateTestToken({ id: 'test', email: 'test@example.com' });
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });

      // Restore original method
      app.jwt.verify = originalVerify;
    });

    it('should handle null token after Bearer replacement', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ' // Just "Bearer " with no token
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should not modify request object on authentication failure', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token'
      };

      const originalRequest = { ...mockRequest };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect((mockRequest as any).user).toBeUndefined();
      // Request should not be modified except for the user property attempt
      expect(mockRequest.headers).toEqual(originalRequest.headers);
    });
  });

  describe('Integration with Fastify JWT', () => {
    it('should use Fastify JWT plugin for token verification', async () => {
      const jwtSpy = jest.spyOn(app.jwt, 'verify');
      
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(jwtSpy).toHaveBeenCalledWith(token);
      
      jwtSpy.mockRestore();
    });

    it('should handle different JWT algorithms', async () => {
      // Test with a token signed with default algorithm
      const testUser = {
        userId: 'test-user-alg', // Note: using userId instead of id to match expected format
        email: 'alg@example.com'
      };
      
      // Create token with default algorithm
      const token = app.jwt.sign(testUser);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual(
        expect.objectContaining({
          userId: testUser.userId,
          email: testUser.email
        })
      );
    });
  });

  describe('Performance and Security', () => {
    it('should complete authentication quickly for valid tokens', async () => {
      const testUser = {
        id: 'perf-test-user',
        email: 'perf@example.com'
      };
      
      const token = generateTestToken(testUser);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const startTime = Date.now();
      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect((mockRequest as any).user).toBeDefined();
    });

    it('should not leak sensitive information in error messages', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed.jwt.token.with.secrets'
      };

      await authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
      
      // Error message should be generic, not revealing token details
      const errorCall = sendSpy.mock.calls[0][0];
      expect(errorCall.error).not.toContain('malformed');
      expect(errorCall.error).not.toContain('secrets');
    });

    it('should handle concurrent authentication requests', async () => {
      const tokens: string[] = [];
      const requests: any[] = [];
      const replies: any[] = [];

      // Create multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        const token = generateTestToken({ id: `user-${i}`, email: `user${i}@example.com` });
        tokens.push(token);
        
        const req = {
          ...mockRequest,
          headers: { authorization: `Bearer ${token}` },
          server: app
        };
        const rep = {
          status: jest.fn().mockReturnValue({ send: jest.fn() }),
          send: jest.fn()
        };
        
        requests.push(req);
        replies.push(rep);
      }

      // Execute all authentications concurrently
      const promises = requests.map((req, index) => 
        authenticate(req as FastifyRequest, replies[index] as FastifyReply)
      );

      await Promise.all(promises);

      // All should succeed
      requests.forEach((req, index) => {
        expect((req as any).user).toEqual(
          expect.objectContaining({
            userId: `user-${index}`,
            email: `user${index}@example.com`
          })
        );
        expect(replies[index].status).not.toHaveBeenCalled();
      });
    });
  });
});