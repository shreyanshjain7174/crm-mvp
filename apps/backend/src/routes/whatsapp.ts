import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';

const whatsappWebhookSchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          timestamp: z.string(),
          text: z.object({
            body: z.string()
          }).optional(),
          type: z.string()
        })).optional(),
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string()
          }),
          wa_id: z.string()
        })).optional()
      })
    }))
  }))
});

export async function whatsappRoutes(fastify: FastifyInstance) {
  // WhatsApp webhook verification
  fastify.get('/webhook', async (request, reply) => {
    const mode = (request.query as any)['hub.mode'];
    const token = (request.query as any)['hub.verify_token'];
    const challenge = (request.query as any)['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
        fastify.log.info('WhatsApp webhook verified');
        return challenge;
      } else {
        return reply.status(403).send('Forbidden');
      }
    }
  });

  // WhatsApp webhook for incoming messages
  fastify.post('/webhook', async (request, reply) => {
    try {
      // Verify webhook signature (optional but recommended)
      const signature = request.headers['x-hub-signature-256'] as string;
      if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
          .update(JSON.stringify(request.body))
          .digest('hex');
        
        if (signature !== `sha256=${expectedSignature}`) {
          return reply.status(403).send('Invalid signature');
        }
      }

      const data = whatsappWebhookSchema.parse(request.body);
      
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          const { messages, contacts } = change.value;
          
          if (messages && messages.length > 0) {
            for (const message of messages) {
              await processIncomingMessage(fastify, message, contacts);
            }
          }
        }
      }
      
      return { status: 'ok' };
    } catch (error) {
      fastify.log.error('Error processing WhatsApp webhook:', error);
      reply.status(500).send({ error: 'Failed to process webhook' });
    }
  });

  // Send WhatsApp message
  fastify.post<{ Body: { phone: string; message: string } }>('/send', async (request, reply) => {
    try {
      const { phone, message } = request.body;
      
      if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_API_URL) {
        return reply.status(500).send({ error: 'WhatsApp API not configured' });
      }

      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/v1/messages`,
        {
          to: phone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      fastify.log.error('Error sending WhatsApp message:', error);
      reply.status(500).send({ error: 'Failed to send message' });
    }
  });
}

async function processIncomingMessage(
  fastify: FastifyInstance, 
  message: any, 
  contacts?: any[]
) {
  try {
    const phone = message.from;
    const content = message.text?.body || '';
    const whatsappId = message.id;
    
    // Find or create lead
    let result = await fastify.db.query(
      'SELECT * FROM leads WHERE phone = $1',
      [phone]
    );
    let lead = result.rows[0];
    
    if (!lead) {
      // Create new lead from contact info
      const contactName = contacts?.find(c => c.wa_id === phone)?.profile?.name || `Lead ${phone}`;
      
      const leadResult = await fastify.db.query(`
        INSERT INTO leads (name, phone, source, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [contactName, phone, 'WhatsApp', 'COLD']);
      lead = leadResult.rows[0];
      
      // Emit new lead event
      fastify.io.emit('lead:created', lead);
    }
    
    // Create message record
    const messageResult = await fastify.db.query(`
      INSERT INTO messages (lead_id, content, direction, whatsapp_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [lead.id, content, 'INBOUND', whatsappId, 'READ']);
    const messageRecord = messageResult.rows[0];
    
    // Create interaction record
    await fastify.db.query(`
      INSERT INTO interactions (lead_id, type, description, completed_at)
      VALUES ($1, $2, $3, NOW())
    `, [lead.id, 'WHATSAPP', `Received message: ${content.substring(0, 50)}...`]);
    
    // Emit real-time events
    fastify.io.emit('message:received', messageRecord);
    fastify.io.emit('lead:updated', lead);
    
    // TODO: Trigger AI suggestion generation
    // This will be implemented in the AI service
    
  } catch (error) {
    fastify.log.error('Error processing incoming message:', error);
  }
}