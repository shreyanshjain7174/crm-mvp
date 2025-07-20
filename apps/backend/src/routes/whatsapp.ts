import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';

// Facebook WhatsApp Cloud API webhook payload schema
const facebookWhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string()
          }),
          wa_id: z.string()
        })).optional(),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          type: z.string(),
          text: z.object({
            body: z.string()
          }).optional(),
          image: z.object({
            caption: z.string().optional(),
            mime_type: z.string(),
            sha256: z.string(),
            id: z.string()
          }).optional(),
          document: z.object({
            caption: z.string().optional(),
            filename: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            id: z.string()
          }).optional(),
          audio: z.object({
            mime_type: z.string(),
            sha256: z.string(),
            id: z.string(),
            voice: z.boolean().optional()
          }).optional(),
          video: z.object({
            caption: z.string().optional(),
            mime_type: z.string(),
            sha256: z.string(),
            id: z.string()
          }).optional(),
          sticker: z.object({
            mime_type: z.string(),
            sha256: z.string(),
            id: z.string(),
            animated: z.boolean().optional()
          }).optional(),
          location: z.object({
            longitude: z.number(),
            latitude: z.number(),
            name: z.string().optional(),
            address: z.string().optional()
          }).optional(),
          button: z.object({
            text: z.string(),
            payload: z.string()
          }).optional(),
          interactive: z.object({
            type: z.string(),
            button_reply: z.object({
              id: z.string(),
              title: z.string()
            }).optional(),
            list_reply: z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().optional()
            }).optional()
          }).optional()
        })).optional(),
        statuses: z.array(z.object({
          id: z.string(),
          status: z.string(),
          timestamp: z.string(),
          recipient_id: z.string(),
          conversation: z.object({
            id: z.string(),
            expiration_timestamp: z.string().optional(),
            origin: z.object({
              type: z.string()
            })
          }).optional(),
          pricing: z.object({
            billable: z.boolean(),
            pricing_model: z.string(),
            category: z.string()
          }).optional()
        })).optional(),
        errors: z.array(z.object({
          code: z.number(),
          title: z.string(),
          message: z.string(),
          error_data: z.object({
            details: z.string()
          })
        })).optional()
      }),
      field: z.string()
    }))
  }))
}).passthrough();

export async function whatsappRoutes(fastify: FastifyInstance) {
  // Get WhatsApp connection status and settings
  fastify.get('/status', async (request, reply) => {
    try {
      const isConfigured = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
      
      if (!isConfigured) {
        return {
          connected: false,
          configured: false,
          message: 'WhatsApp API credentials not configured'
        };
      }

      // Test connection by making a simple API call to get business profile
      try {
        const graphApiUrl = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
        const response = await axios.get(graphApiUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          },
          params: {
            fields: 'display_phone_number,verified_name,quality_rating'
          }
        });

        return {
          connected: true,
          configured: true,
          businessProfile: response.data,
          message: 'WhatsApp Business API connected successfully'
        };
      } catch (error: any) {
        fastify.log.error('WhatsApp API connection test failed:', error);
        return {
          connected: false,
          configured: true,
          error: error.response?.data?.error?.message || 'Connection test failed',
          message: 'WhatsApp API credentials configured but connection failed'
        };
      }
    } catch (error) {
      fastify.log.error('Error checking WhatsApp status:', error);
      return reply.status(500).send({ 
        error: 'Failed to check WhatsApp status',
        connected: false,
        configured: false
      });
    }
  });

  // Facebook WhatsApp webhook verification
  fastify.get('/webhook', async (request, reply) => {
    // Facebook webhook verification process
    const mode = (request.query as any)['hub.mode'];
    const token = (request.query as any)['hub.verify_token'];
    const challenge = (request.query as any)['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        // Respond with 200 OK and challenge token from the request
        fastify.log.info('Facebook WhatsApp webhook verified successfully');
        return challenge;
      } else {
        // Return 403 Forbidden if verify tokens do not match
        fastify.log.warn('Webhook verification failed - invalid token');
        return reply.status(403).send('Forbidden');
      }
    } else {
      // Return 400 Bad Request if required parameters are missing
      fastify.log.warn('Webhook verification failed - missing parameters');
      return reply.status(400).send('Bad Request');
    }
  });

  // Facebook WhatsApp webhook for incoming messages
  fastify.post('/webhook', async (request, reply) => {
    try {
      // Log the incoming webhook for debugging
      fastify.log.info('Facebook WhatsApp webhook received:', JSON.stringify(request.body));

      // Verify webhook signature (optional but recommended for production)
      const signature = request.headers['x-hub-signature-256'] as string;
      if (signature && process.env.WHATSAPP_APP_SECRET) {
        const expectedSignature = 'sha256=' + crypto
          .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
          .update(JSON.stringify(request.body))
          .digest('hex');
        
        if (signature !== expectedSignature) {
          fastify.log.warn('Invalid Facebook webhook signature');
          return reply.status(403).send('Invalid signature');
        }
      }

      // Parse the Facebook WhatsApp webhook payload
      const data = facebookWhatsAppWebhookSchema.parse(request.body);
      
      // Check if this is a WhatsApp Business Account notification
      if (data.object === 'whatsapp_business_account') {
        for (const entry of data.entry) {
          for (const change of entry.changes) {
            const { value } = change;
            
            // Process incoming messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                await processIncomingMessage(fastify, message, value.contacts, value.metadata);
              }
            }
            
            // Process message status updates
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await updateMessageStatus(fastify, status);
              }
            }
            
            // Process errors
            if (value.errors && value.errors.length > 0) {
              for (const error of value.errors) {
                await handleWebhookError(fastify, error);
              }
            }
          }
        }
      }
      
      // Facebook requires a 200 OK response
      return reply.status(200).send('OK');
    } catch (error) {
      fastify.log.error('Error processing Facebook WhatsApp webhook:', error);
      // Facebook expects 200 OK response even on errors to prevent retries
      return reply.status(200).send('OK');
    }
  });

  // Test endpoint to simulate receiving WhatsApp message (for development)
  fastify.post<{ Body: { phone: string; message: string; senderName?: string } }>('/test-receive', async (request, reply) => {
    try {
      const { phone, message, senderName } = request.body;
      
      const simulatedMessage = {
        id: `test_${Date.now()}`,
        from: phone,
        timestamp: new Date().toISOString(),
        text: { body: message },
        type: 'text'
      };
      
      const simulatedContacts = senderName ? [{
        profile: { name: senderName },
        wa_id: phone
      }] : undefined;
      
      await processIncomingMessage(fastify, simulatedMessage, simulatedContacts);
      
      return { success: true, message: 'Test message processed' };
    } catch (error) {
      fastify.log.error('Error processing test message:', error);
      reply.status(500).send({ error: 'Failed to process test message' });
    }
  });

  // Send WhatsApp message via Facebook Graph API
  fastify.post<{ 
    Body: { 
      phone: string; 
      message: string; 
      messageType?: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'interactive';
      templateName?: string;
      templateParams?: any[];
      mediaUrl?: string;
      mediaCaption?: string;
      mediaId?: string;
      interactive?: any;
      location?: { latitude: number; longitude: number; name?: string; address?: string };
    } 
  }>('/send', async (request, reply) => {
    try {
      const { 
        phone, 
        message, 
        messageType = 'text',
        templateName,
        templateParams,
        mediaUrl,
        mediaCaption,
        mediaId,
        interactive,
        location
      } = request.body;
      
      if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        return reply.status(500).send({ error: 'WhatsApp API credentials not configured' });
      }

      // Format phone number for Facebook API (with country code, without +)
      const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
      
      // Build message payload for Facebook Graph API
      const payload: any = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: messageType
      };

      // Add content based on message type
      switch (messageType) {
        case 'text':
          payload.text = { body: message };
          break;
          
        case 'template':
          if (!templateName) {
            return reply.status(400).send({ error: 'Template name required for template messages' });
          }
          payload.template = {
            name: templateName,
            language: { code: 'en_US' },
            components: templateParams ? [{
              type: 'body',
              parameters: templateParams.map(param => ({ type: 'text', text: param }))
            }] : []
          };
          break;
          
        case 'image':
          payload.image = mediaId ? 
            { id: mediaId, caption: mediaCaption } : 
            { link: mediaUrl, caption: mediaCaption };
          break;
          
        case 'document':
          payload.document = mediaId ? 
            { id: mediaId, caption: mediaCaption, filename: message } : 
            { link: mediaUrl, caption: mediaCaption, filename: message };
          break;
          
        case 'audio':
          payload.audio = mediaId ? { id: mediaId } : { link: mediaUrl };
          break;
          
        case 'video':
          payload.video = mediaId ? 
            { id: mediaId, caption: mediaCaption } : 
            { link: mediaUrl, caption: mediaCaption };
          break;
          
        case 'location':
          payload.location = location;
          break;
          
        case 'interactive':
          payload.interactive = interactive;
          break;
          
        default:
          payload.text = { body: message };
      }

      // Send message via Facebook Graph API
      const graphApiUrl = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await axios.post(
        graphApiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Store message in database
      const leadResult = await fastify.db.query(
        'SELECT id FROM leads WHERE phone = $1',
        [phone]
      );
      
      if (leadResult.rows.length > 0) {
        const leadId = leadResult.rows[0].id;
        await fastify.db.query(`
          INSERT INTO messages (leadId, content, direction, whatsappId, status, messageType)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [leadId, message, 'OUTBOUND', response.data.messages[0].id, 'SENT', messageType.toUpperCase()]);
        
        // Emit real-time event
        fastify.io.emit('message:sent', { leadId, message, messageId: response.data.messages[0].id });
      }

      return { 
        success: true, 
        messageId: response.data.messages[0].id,
        response: response.data 
      };
    } catch (error: any) {
      fastify.log.error('Error sending WhatsApp message via Facebook Graph API:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to send message';
      reply.status(500).send({ error: errorMessage, details: error.response?.data });
    }
  });
}

async function processIncomingMessage(
  fastify: FastifyInstance, 
  message: any, 
  contacts?: any[],
  metadata?: any
) {
  try {
    // Extract phone number - Facebook format includes country code
    const phone = message.from.startsWith('+') ? message.from : `+${message.from}`;
    const whatsappId = message.id;
    const messageType = message.type;
    
    // Extract message content based on type
    let messageContent = '';
    switch (messageType) {
      case 'text':
        messageContent = message.text?.body || '';
        break;
      case 'image':
        messageContent = `[Image${message.image?.caption ? ': ' + message.image.caption : ''}]`;
        break;
      case 'document':
        messageContent = `[Document: ${message.document?.filename || 'file'}${message.document?.caption ? ' - ' + message.document.caption : ''}]`;
        break;
      case 'audio':
        messageContent = `[Audio message${message.audio?.voice ? ' (Voice note)' : ''}]`;
        break;
      case 'video':
        messageContent = `[Video${message.video?.caption ? ': ' + message.video.caption : ''}]`;
        break;
      case 'sticker':
        messageContent = `[Sticker${message.sticker?.animated ? ' (Animated)' : ''}]`;
        break;
      case 'location':
        messageContent = `[Location: ${message.location?.name || 'Shared location'}${message.location?.address ? ' - ' + message.location.address : ''}]`;
        break;
      case 'button':
        messageContent = `[Button clicked: ${message.button?.text}]`;
        break;
      case 'interactive':
        if (message.interactive?.button_reply) {
          messageContent = `[Button: ${message.interactive.button_reply.title}]`;
        } else if (message.interactive?.list_reply) {
          messageContent = `[List selection: ${message.interactive.list_reply.title}]`;
        } else {
          messageContent = `[Interactive response]`;
        }
        break;
      default:
        messageContent = `[${messageType} message]`;
    }
    
    // Find or create lead
    const result = await fastify.db.query(
      'SELECT * FROM leads WHERE phone = $1',
      [phone]
    );
    let lead = result.rows[0];
    
    if (!lead) {
      // Create new lead from contact info
      const contact = contacts?.find(c => c.wa_id === message.from);
      const contactName = contact?.profile?.name || `Lead ${phone}`;
      
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
      INSERT INTO messages (leadId, content, direction, whatsappId, status, messageType)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [lead.id, messageContent, 'INBOUND', whatsappId, 'READ', messageType.toUpperCase()]);
    const messageRecord = messageResult.rows[0];
    
    // Create interaction record
    await fastify.db.query(`
      INSERT INTO interactions (leadId, type, description, completedAt)
      VALUES ($1, $2, $3, NOW())
    `, [lead.id, 'WHATSAPP', `Received ${messageType} message: ${messageContent.substring(0, 50)}...`]);
    
    // Emit real-time events
    fastify.io.emit('message:received', {
      ...messageRecord,
      lead,
      timestamp: message.timestamp,
      phoneNumberId: metadata?.phone_number_id
    });
    fastify.io.emit('lead:updated', lead);
    
    // Trigger AI suggestion generation through event
    fastify.io.emit('ai:generate_response', {
      leadId: lead.id,
      messageId: messageRecord.id,
      content: messageContent,
      messageType,
      phoneNumberId: metadata?.phone_number_id
    });
    
  } catch (error) {
    fastify.log.error('Error processing incoming message:', error);
  }
}

async function updateMessageStatus(
  fastify: FastifyInstance,
  status: any
) {
  try {
    const whatsappId = status.id;
    const statusValue = status.status.toUpperCase();
    
    // Update message status
    const result = await fastify.db.query(`
      UPDATE messages 
      SET status = $1, updatedAt = NOW()
      WHERE whatsappId = $2
      RETURNING *
    `, [statusValue, whatsappId]);
    
    if (result.rows.length > 0) {
      const updatedMessage = result.rows[0];
      
      // Emit status update event
      fastify.io.emit('message:status_updated', {
        messageId: updatedMessage.id,
        status: statusValue,
        timestamp: status.timestamp,
        recipientId: status.recipient_id,
        conversation: status.conversation,
        pricing: status.pricing
      });
      
      fastify.log.info(`Message ${whatsappId} status updated to ${statusValue}`);
    } else {
      fastify.log.warn(`Message ${whatsappId} not found for status update`);
    }
  } catch (error) {
    fastify.log.error('Error updating message status:', error);
  }
}

async function handleWebhookError(
  fastify: FastifyInstance,
  error: any
) {
  try {
    const errorCode = error.code;
    const errorMessage = error.message;
    const errorTitle = error.title;
    const errorDetails = error.error_data?.details;
    
    // Log the error for monitoring
    fastify.log.error('WhatsApp webhook error received:', {
      code: errorCode,
      title: errorTitle,
      message: errorMessage,
      details: errorDetails
    });
    
    // Emit error event for real-time monitoring
    fastify.io.emit('whatsapp:error', {
      code: errorCode,
      title: errorTitle,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error types
    switch (errorCode) {
      case 130429: // Rate limit exceeded
        fastify.log.warn('WhatsApp rate limit exceeded');
        break;
      case 131052: // Message undeliverable
        fastify.log.warn('WhatsApp message undeliverable');
        break;
      case 131056: // Phone number not on WhatsApp
        fastify.log.warn('Phone number not registered on WhatsApp');
        break;
      default:
        fastify.log.error(`Unhandled WhatsApp error: ${errorCode} - ${errorMessage}`);
    }
    
  } catch (err) {
    fastify.log.error('Error handling webhook error:', err);
  }
}