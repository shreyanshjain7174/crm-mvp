import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// Team member schema for validation
const teamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']).default('member'),
  department: z.string().optional(),
  permissions: z.record(z.boolean()).optional()
});

const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']).optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  permissions: z.record(z.boolean()).optional()
});

export async function teamRoutes(fastify: FastifyInstance) {
  // Get all team members for the user's organization
  fastify.get('/', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      
      // Get user's organization
      const userResult = await fastify.db.query(
        'SELECT organization_id FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const organizationId = userResult.rows[0].organization_id;
      
      // Get all team members for the organization
      const result = await fastify.db.query(`
        SELECT 
          tm.id,
          tm.email,
          tm.name,
          tm.phone,
          tm.role,
          tm.department,
          tm.status,
          tm.permissions,
          tm.avatar_url,
          tm.hired_date,
          tm.last_active_at,
          tm.invited_at,
          tm.joined_at,
          tm.created_at,
          tm.updated_at,
          CASE WHEN tm.user_id IS NOT NULL THEN true ELSE false END as is_registered
        FROM team_members tm
        WHERE tm.organization_id = $1
        ORDER BY 
          CASE tm.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'manager' THEN 3 
            WHEN 'member' THEN 4 
            WHEN 'viewer' THEN 5 
          END,
          tm.name
      `, [organizationId]);

      return result.rows;
    } catch (error) {
      fastify.log.error('Error fetching team members:', error);
      return reply.status(500).send({ error: 'Failed to fetch team members' });
    }
  });

  // Get specific team member
  fastify.get('/:id', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };
      
      // Get user's organization
      const userResult = await fastify.db.query(
        'SELECT organization_id FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const organizationId = userResult.rows[0].organization_id;
      
      // Get team member
      const result = await fastify.db.query(`
        SELECT 
          tm.*,
          CASE WHEN tm.user_id IS NOT NULL THEN true ELSE false END as is_registered
        FROM team_members tm
        WHERE tm.id = $1 AND tm.organization_id = $2
      `, [id, organizationId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Team member not found' });
      }

      return result.rows[0];
    } catch (error) {
      fastify.log.error('Error fetching team member:', error);
      return reply.status(500).send({ error: 'Failed to fetch team member' });
    }
  });

  // Invite new team member
  fastify.post('/invite', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const memberData = teamMemberSchema.parse(request.body);
      
      // Get user's organization and verify they have permission to invite
      const userResult = await fastify.db.query(`
        SELECT u.organization_id, tm.role 
        FROM users u
        JOIN team_members tm ON tm.user_id = u.id
        WHERE u.id = $1
      `, [userId]);
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const { organization_id: organizationId, role: userRole } = userResult.rows[0];
      
      // Check if user has permission to invite (owner, admin, manager)
      if (!['owner', 'admin', 'manager'].includes(userRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions to invite team members' });
      }
      
      // Check if email already exists in organization
      const existingMember = await fastify.db.query(
        'SELECT id FROM team_members WHERE organization_id = $1 AND email = $2',
        [organizationId, memberData.email]
      );
      
      if (existingMember.rows.length > 0) {
        return reply.status(409).send({ error: 'Team member with this email already exists' });
      }
      
      // Create team member
      const result = await fastify.db.query(`
        INSERT INTO team_members (
          organization_id, email, name, phone, role, department, 
          permissions, invited_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *
      `, [
        organizationId,
        memberData.email,
        memberData.name,
        memberData.phone || null,
        memberData.role,
        memberData.department || null,
        JSON.stringify(memberData.permissions || {}),
        userId
      ]);

      // TODO: Send invitation email
      
      return {
        success: true,
        member: result.rows[0],
        message: 'Team member invited successfully'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      fastify.log.error('Error inviting team member:', error);
      return reply.status(500).send({ error: 'Failed to invite team member' });
    }
  });

  // Update team member
  fastify.put('/:id', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };
      const updateData = updateTeamMemberSchema.parse(request.body);
      
      // Get user's organization and role
      const userResult = await fastify.db.query(`
        SELECT u.organization_id, tm.role 
        FROM users u
        JOIN team_members tm ON tm.user_id = u.id
        WHERE u.id = $1
      `, [userId]);
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const { organization_id: organizationId, role: userRole } = userResult.rows[0];
      
      // Check if user has permission to update (owner, admin)
      if (!['owner', 'admin'].includes(userRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions to update team members' });
      }
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          if (key === 'permissions') {
            updateFields.push(`${key} = $${paramIndex}::jsonb`);
            updateValues.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
          }
          paramIndex++;
        }
      }
      
      if (updateFields.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id, organizationId);
      
      const result = await fastify.db.query(`
        UPDATE team_members 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
        RETURNING *
      `, updateValues);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Team member not found' });
      }

      return {
        success: true,
        member: result.rows[0],
        message: 'Team member updated successfully'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      fastify.log.error('Error updating team member:', error);
      return reply.status(500).send({ error: 'Failed to update team member' });
    }
  });

  // Remove team member
  fastify.delete('/:id', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };
      
      // Get user's organization and role
      const userResult = await fastify.db.query(`
        SELECT u.organization_id, tm.role 
        FROM users u
        JOIN team_members tm ON tm.user_id = u.id
        WHERE u.id = $1
      `, [userId]);
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const { organization_id: organizationId, role: userRole } = userResult.rows[0];
      
      // Check if user has permission to remove (owner, admin)
      if (!['owner', 'admin'].includes(userRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions to remove team members' });
      }
      
      // Check if member exists and get their role
      const memberResult = await fastify.db.query(
        'SELECT role FROM team_members WHERE id = $1 AND organization_id = $2',
        [id, organizationId]
      );
      
      if (memberResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Team member not found' });
      }
      
      // Prevent removing the last owner
      if (memberResult.rows[0].role === 'owner') {
        const ownerCount = await fastify.db.query(
          'SELECT COUNT(*) as count FROM team_members WHERE organization_id = $1 AND role = $2',
          [organizationId, 'owner']
        );
        
        if (parseInt(ownerCount.rows[0].count) <= 1) {
          return reply.status(400).send({ error: 'Cannot remove the last owner' });
        }
      }
      
      // Remove team member
      await fastify.db.query(
        'DELETE FROM team_members WHERE id = $1 AND organization_id = $2',
        [id, organizationId]
      );

      return {
        success: true,
        message: 'Team member removed successfully'
      };
    } catch (error) {
      fastify.log.error('Error removing team member:', error);
      return reply.status(500).send({ error: 'Failed to remove team member' });
    }
  });

  // Get team statistics
  fastify.get('/stats', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      
      // Get user's organization
      const userResult = await fastify.db.query(
        'SELECT organization_id FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      const organizationId = userResult.rows[0].organization_id;
      
      // Get team statistics
      const statsResult = await fastify.db.query(`
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invites,
          COUNT(CASE WHEN role = 'owner' THEN 1 END) as owners,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
          COUNT(CASE WHEN role = 'member' THEN 1 END) as members,
          COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers,
          COUNT(CASE WHEN last_active_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
        FROM team_members
        WHERE organization_id = $1
      `, [organizationId]);

      return statsResult.rows[0];
    } catch (error) {
      fastify.log.error('Error fetching team stats:', error);
      return reply.status(500).send({ error: 'Failed to fetch team statistics' });
    }
  });
}