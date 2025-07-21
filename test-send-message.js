#!/usr/bin/env node

require('dotenv').config({ path: './apps/backend/.env' });
const axios = require('axios');

async function testSendMessage() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Replace this with your actual WhatsApp number (without + but with country code)
  const testRecipient = '919876543210'; // Your WhatsApp number
  
  console.log('🚀 Testing WhatsApp Message Sending...');
  console.log('📱 From:', phoneNumberId);
  console.log('📱 To:', testRecipient);
  
  try {
    // Test 1: Send hello_world template
    console.log('\n📋 Test 1: Sending hello_world template...');
    
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: testRecipient,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    const templateResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      templatePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template Message Sent Successfully');
    console.log('📨 Message ID:', templateResponse.data.messages[0].id);
    console.log('📱 Response:', templateResponse.data);
    
    // Wait a moment before next test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Send text message (will only work within 24 hours after template)
    console.log('\n📋 Test 2: Sending text message...');
    
    const textPayload = {
      messaging_product: 'whatsapp',
      to: testRecipient,
      type: 'text',
      text: {
        body: 'Hello! This is a test message from your CRM system. 🚀'
      }
    };

    const textResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      textPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Text Message Sent Successfully');
    console.log('📨 Message ID:', textResponse.data.messages[0].id);
    
  } catch (error) {
    console.log('❌ Message Sending Failed');
    if (error.response) {
      console.log('📋 Error:', error.response.status, error.response.statusText);
      console.log('📋 Details:', error.response.data);
      
      if (error.response.data.error?.code === 131030) {
        console.log('\n📝 Solution: Add your WhatsApp number to the recipients list in Facebook Developer Console');
        console.log('1. Go to WhatsApp → API Setup');
        console.log('2. Click "Manage phone number list"');
        console.log('3. Add your WhatsApp number');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Reply to the WhatsApp message to test webhook');
  console.log('2. Check your webhook server logs for incoming messages');
  console.log('3. Test different message types (images, documents, etc.)');
}

testSendMessage().catch(console.error);