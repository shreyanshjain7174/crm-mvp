#!/usr/bin/env node

require('dotenv').config({ path: './apps/backend/.env' });
const fastify = require('fastify')({ logger: true });
const crypto = require('crypto');

// Facebook WhatsApp webhook verification
fastify.get('/api/whatsapp/webhook', async (request, reply) => {
  // Facebook webhook verification process
  const mode = request.query['hub.mode'];
  const token = request.query['hub.verify_token'];
  const challenge = request.query['hub.challenge'];

  console.log('Webhook verification request received:');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);
  console.log('Expected token:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('✅ Webhook verified successfully!');
      return challenge;
    } else {
      // Return 403 Forbidden if verify tokens do not match
      console.log('❌ Webhook verification failed - invalid token');
      console.log('Expected:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
      console.log('Received:', token);
      return reply.status(403).send('Forbidden');
    }
  } else {
    // Return 400 Bad Request if required parameters are missing
    console.log('❌ Webhook verification failed - missing parameters');
    return reply.status(400).send('Bad Request');
  }
});

// Facebook WhatsApp webhook for incoming messages
fastify.post('/api/whatsapp/webhook', async (request, reply) => {
  try {
    console.log('📨 Webhook received:', JSON.stringify(request.body, null, 2));

    // Verify webhook signature (optional but recommended for production)
    const signature = request.headers['x-hub-signature-256'];
    if (signature && process.env.WHATSAPP_APP_SECRET) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
        .update(JSON.stringify(request.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.log('⚠️ Invalid webhook signature');
        return reply.status(403).send('Invalid signature');
      } else {
        console.log('✅ Webhook signature verified');
      }
    }

    const data = request.body;
    
    // Check if this is a WhatsApp Business Account notification
    if (data.object === 'whatsapp_business_account') {
      console.log('📱 WhatsApp Business Account notification received');
      
      for (const entry of data.entry) {
        console.log('📋 Processing entry:', entry.id);
        
        for (const change of entry.changes) {
          const { value } = change;
          
          // Process incoming messages
          if (value.messages && value.messages.length > 0) {
            console.log('📨 Messages received:');
            for (const message of value.messages) {
              console.log(`  - From: ${message.from}`);
              console.log(`  - Type: ${message.type}`);
              console.log(`  - Content: ${message.text?.body || `[${message.type} message]`}`);
              console.log(`  - ID: ${message.id}`);
            }
          }
          
          // Process message status updates
          if (value.statuses && value.statuses.length > 0) {
            console.log('📊 Status updates received:');
            for (const status of value.statuses) {
              console.log(`  - Message ID: ${status.id}`);
              console.log(`  - Status: ${status.status}`);
              console.log(`  - Recipient: ${status.recipient_id}`);
            }
          }
          
          // Process errors
          if (value.errors && value.errors.length > 0) {
            console.log('❌ Errors received:');
            for (const error of value.errors) {
              console.log(`  - Code: ${error.code}`);
              console.log(`  - Title: ${error.title}`);
              console.log(`  - Message: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Facebook requires a 200 OK response
    return reply.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Facebook expects 200 OK response even on errors to prevent retries
    return reply.status(200).send('OK');
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log('🚀 Webhook test server running on http://localhost:' + port);
    console.log('📋 Webhook endpoint: http://localhost:' + port + '/api/whatsapp/webhook');
    console.log('🔑 Verify token:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
    console.log('');
    console.log('Ready for Facebook webhook verification!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();