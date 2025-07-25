import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// Achievement schema validation (kept for future use)
// const achievementSchema = z.object({
//   achievementId: z.string(),
//   name: z.string(),
//   description: z.string().optional(),
//   category: z.string(),
//   rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
//   points: z.number().min(0)
// });

const statUpdateSchema = z.object({
  statName: z.string(),
  increment: z.number().optional().default(1)
});

export async function achievementRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Get user achievements
  fastify.get('/', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        SELECT 
          ua.id,
          ua.achievement_id,
          ua.achievement_name,
          ua.achievement_description,
          ua.achievement_category,
          ua.achievement_rarity,
          ua.points,
          ua.unlocked_at,
          ua.created_at,
          ua.updated_at
        FROM user_achievements ua
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
      `, [userId]);

      reply.send({
        achievements: result.rows.map(row => ({
          id: row.achievement_id,
          name: row.achievement_name,
          description: row.achievement_description,
          category: row.achievement_category,
          rarity: row.achievement_rarity,
          points: row.points,
          unlockedAt: row.unlocked_at
        }))
      });
    } catch (error) {
      fastify.log.error('Failed to fetch achievements:', error);
      reply.status(500).send({ error: 'Failed to fetch achievements' });
    }
  });

  // Get all available achievements (including locked ones)
  fastify.get('/available', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const [definitionsResult, userAchievementsResult] = await Promise.all([
        fastify.db.query(`
          SELECT * FROM achievement_definitions 
          WHERE is_active = TRUE
          ORDER BY 
            CASE rarity 
              WHEN 'common' THEN 1
              WHEN 'rare' THEN 2
              WHEN 'epic' THEN 3
              WHEN 'legendary' THEN 4
            END,
            points ASC
        `),
        fastify.db.query(`
          SELECT achievement_id, unlocked_at 
          FROM user_achievements 
          WHERE user_id = $1
        `, [userId])
      ]);

      const unlockedIds = new Set(userAchievementsResult.rows.map(row => row.achievement_id));

      reply.send({
        achievements: definitionsResult.rows.map(row => ({
          id: row.achievement_id,
          name: row.name,
          description: row.description,
          category: row.category,
          rarity: row.rarity,
          points: row.points,
          requirements: row.requirements,
          icon: row.icon,
          isUnlocked: unlockedIds.has(row.achievement_id),
          unlockedAt: userAchievementsResult.rows.find(ua => ua.achievement_id === row.achievement_id)?.unlocked_at
        }))
      });
    } catch (error) {
      fastify.log.error('Failed to fetch available achievements:', error);
      reply.status(500).send({ error: 'Failed to fetch available achievements' });
    }
  });

  // Get user progress stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const [statsResult, stageResult] = await Promise.all([
        fastify.db.query(`
          SELECT stat_name, stat_value 
          FROM user_progress_stats 
          WHERE user_id = $1
        `, [userId]),
        fastify.db.query(`
          SELECT current_stage, stage_data 
          FROM user_stages 
          WHERE user_id = $1
        `, [userId])
      ]);

      const stats = statsResult.rows.reduce((acc, row) => {
        acc[row.stat_name] = row.stat_value;
        return acc;
      }, {});

      const stage = stageResult.rows[0]?.current_stage || 1;
      const stageData = stageResult.rows[0]?.stage_data || {};

      reply.send({
        stats,
        stage,
        stageData
      });
    } catch (error) {
      fastify.log.error('Failed to fetch user stats:', error);
      reply.status(500).send({ error: 'Failed to fetch user stats' });
    }
  });

  // Update user stat (used to trigger achievement checks)
  fastify.post('/stats/:statName', {
    schema: {
      body: {
        type: 'object',
        properties: {
          increment: { type: 'number', default: 1 }
        }
      },
      params: {
        type: 'object',
        properties: {
          statName: { type: 'string' }
        },
        required: ['statName']
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const { statName } = request.params as { statName: string };
      const { increment } = request.body as z.infer<typeof statUpdateSchema>;

      // Update the stat
      await fastify.db.query(`
        INSERT INTO user_progress_stats (user_id, stat_name, stat_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, stat_name)
        DO UPDATE SET 
          stat_value = user_progress_stats.stat_value + $3,
          updated_at = NOW()
      `, [userId, statName, increment]);

      // Get updated stats for achievement checking
      const statsResult = await fastify.db.query(`
        SELECT stat_name, stat_value 
        FROM user_progress_stats 
        WHERE user_id = $1
      `, [userId]);

      const stats = statsResult.rows.reduce((acc, row) => {
        acc[row.stat_name] = row.stat_value;
        return acc;
      }, {});

      // Check for new achievements
      const newAchievements = await checkAndUnlockAchievements(fastify, userId, stats);

      reply.send({
        success: true,
        stats,
        newAchievements
      });
    } catch (error) {
      fastify.log.error('Failed to update stat:', error);
      reply.status(500).send({ error: 'Failed to update stat' });
    }
  });

  // Get achievement overview/summary
  fastify.get('/overview', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const [achievementsResult, totalPointsResult, definitionsResult] = await Promise.all([
        fastify.db.query(`
          SELECT achievement_rarity, COUNT(*) as count
          FROM user_achievements 
          WHERE user_id = $1
          GROUP BY achievement_rarity
        `, [userId]),
        fastify.db.query(`
          SELECT COALESCE(SUM(points), 0) as total_points
          FROM user_achievements 
          WHERE user_id = $1
        `, [userId]),
        fastify.db.query(`
          SELECT COUNT(*) as total_available,
            SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common_total,
            SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare_total,
            SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic_total,
            SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary_total
          FROM achievement_definitions 
          WHERE is_active = TRUE
        `)
      ]);

      const userCounts = achievementsResult.rows.reduce((acc, row) => {
        acc[row.achievement_rarity] = parseInt(row.count);
        return acc;
      }, { common: 0, rare: 0, epic: 0, legendary: 0 });

      const totalPoints = parseInt(totalPointsResult.rows[0]?.total_points || '0');
      const totals = definitionsResult.rows[0];
      const totalUnlocked = Object.values(userCounts).reduce((sum: number, count) => sum + (count as number), 0);
      const totalAvailable = parseInt(totals?.total_available || '0');

      reply.send({
        totalPoints,
        totalUnlocked,
        totalAvailable,
        completionPercentage: totalAvailable > 0 ? Math.round(((totalUnlocked as number) / totalAvailable) * 100) : 0,
        byRarity: {
          common: {
            unlocked: userCounts.common,
            total: parseInt(totals?.common_total || '0')
          },
          rare: {
            unlocked: userCounts.rare,
            total: parseInt(totals?.rare_total || '0')
          },
          epic: {
            unlocked: userCounts.epic,
            total: parseInt(totals?.epic_total || '0')
          },
          legendary: {
            unlocked: userCounts.legendary,
            total: parseInt(totals?.legendary_total || '0')
          }
        }
      });
    } catch (error) {
      fastify.log.error('Failed to fetch achievement overview:', error);
      reply.status(500).send({ error: 'Failed to fetch achievement overview' });
    }
  });

  // Manually unlock achievement (for testing)
  fastify.post('/unlock/:achievementId', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const { achievementId } = request.params as { achievementId: string };

      // Get achievement definition
      const definitionResult = await fastify.db.query(`
        SELECT * FROM achievement_definitions 
        WHERE achievement_id = $1 AND is_active = TRUE
      `, [achievementId]);

      if (definitionResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Achievement not found' });
      }

      const definition = definitionResult.rows[0];

      // Check if already unlocked
      const existingResult = await fastify.db.query(`
        SELECT id FROM user_achievements 
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievementId]);

      if (existingResult.rows.length > 0) {
        return reply.status(400).send({ error: 'Achievement already unlocked' });
      }

      // Unlock the achievement
      await fastify.db.query(`
        INSERT INTO user_achievements (
          user_id, achievement_id, achievement_name, achievement_description,
          achievement_category, achievement_rarity, points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId,
        definition.achievement_id,
        definition.name,
        definition.description,
        definition.category,
        definition.rarity,
        definition.points
      ]);

      reply.send({
        success: true,
        achievement: {
          id: definition.achievement_id,
          name: definition.name,
          description: definition.description,
          category: definition.category,
          rarity: definition.rarity,
          points: definition.points
        }
      });
    } catch (error) {
      fastify.log.error('Failed to unlock achievement:', error);
      reply.status(500).send({ error: 'Failed to unlock achievement' });
    }
  });
}

// Helper function to check and unlock achievements
async function checkAndUnlockAchievements(fastify: FastifyInstance, userId: string, stats: Record<string, number>) {
  try {
    // Get all available achievements that user hasn't unlocked yet
    const availableResult = await fastify.db.query(`
      SELECT ad.* 
      FROM achievement_definitions ad
      LEFT JOIN user_achievements ua ON ad.achievement_id = ua.achievement_id AND ua.user_id = $1
      WHERE ad.is_active = TRUE AND ua.id IS NULL
    `, [userId]);

    const newAchievements = [];

    for (const definition of availableResult.rows) {
      const requirements = definition.requirements || [];
      let requirementsMet = true;

      // Check all requirements
      for (const requirement of requirements) {
        if (requirement.type === 'stat') {
          const condition = requirement.condition;
          const match = condition.match(/(\w+)\s*(>=|<=|>|<|==)\s*(\d+)/);
          
          if (match) {
            const [, statName, operator, valueStr] = match;
            const targetValue = parseInt(valueStr);
            const currentValue = stats[statName] || 0;

            switch (operator) {
              case '>=':
                if (currentValue < targetValue) requirementsMet = false;
                break;
              case '<=':
                if (currentValue > targetValue) requirementsMet = false;
                break;
              case '>':
                if (currentValue <= targetValue) requirementsMet = false;
                break;
              case '<':
                if (currentValue >= targetValue) requirementsMet = false;
                break;
              case '==':
                if (currentValue !== targetValue) requirementsMet = false;
                break;
            }
          }
        }
        // Add other requirement types (feature, stage, etc.) as needed
      }

      // If requirements are met, unlock the achievement
      if (requirementsMet) {
        await fastify.db.query(`
          INSERT INTO user_achievements (
            user_id, achievement_id, achievement_name, achievement_description,
            achievement_category, achievement_rarity, points
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          userId,
          definition.achievement_id,
          definition.name,
          definition.description,
          definition.category,
          definition.rarity,
          definition.points
        ]);

        newAchievements.push({
          id: definition.achievement_id,
          name: definition.name,
          description: definition.description,
          category: definition.category,
          rarity: definition.rarity,
          points: definition.points
        });
      }
    }

    return newAchievements;
  } catch (error) {
    fastify.log.error('Error checking achievements:', error);
    return [];
  }
}

export default achievementRoutes;