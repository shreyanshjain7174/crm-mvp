import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  company: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register user
  fastify.post<{ Body: z.infer<typeof registerSchema> }>('/register', async (request, reply) => {
    try {
      const { email, password, name, company } = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingResult = await fastify.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      const existingUser = existingResult.rows[0];
      
      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const result = await fastify.db.query(`
        INSERT INTO users (email, password, name, company)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, company, created_at
      `, [email, hashedPassword, name, company || 'Default Company']);
      const user = result.rows[0];
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email 
      });
      
      return {
        user,
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Registration error:', error);
      reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // Login user
  fastify.post<{ Body: z.infer<typeof loginSchema> }>('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      
      // Find user
      const result = await fastify.db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email 
      });
      
      // Update last login
      await fastify.db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          createdAt: user.createdAt
        },
        token,
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Login error:', error);
      reply.status(500).send({ error: 'Login failed' });
    }
  });

  // Get current user profile
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const result = await fastify.db.query(
        'SELECT id, email, name, company, created_at, last_login_at FROM users WHERE id = $1',
        [(request as any).user.userId]
      );
      const user = result.rows[0];
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return { user };
    } catch (error) {
      fastify.log.error('Get profile error:', error);
      reply.status(500).send({ error: 'Failed to get profile' });
    }
  });

  // Update user profile
  fastify.put('/profile', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const updateSchema = z.object({
        name: z.string().min(2).optional(),
        company: z.string().optional()
      });
      
      const updates = updateSchema.parse(request.body);
      
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.company !== undefined) {
        updateFields.push(`company = $${paramIndex++}`);
        values.push(updates.company);
      }
      
      values.push((request as any).user.userId);
      
      const result = await fastify.db.query(`
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, name, company, created_at
      `, values);
      const user = result.rows[0];
      
      return { user, message: 'Profile updated successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update profile error:', error);
      reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  // Change password
  fastify.put('/change-password', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const changePasswordSchema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6)
      });
      
      const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
      
      // Get current user
      const result = await fastify.db.query(
        'SELECT * FROM users WHERE id = $1',
        [(request as any).user.userId]
      );
      const user = result.rows[0];
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await fastify.db.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedNewPassword, user.id]
      );
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Change password error:', error);
      reply.status(500).send({ error: 'Failed to change password' });
    }
  });

  // Logout (client-side token removal, but we can track it)
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just return success and let the client remove the token
    return { message: 'Logout successful' };
  });
}