#!/usr/bin/env node

require('dotenv').config({ path: './apps/backend/.env' });
const axios = require('axios');

// ⚠️ IMPORTANT: Replace this with your actual WhatsApp number
// Format: Country code + number (without + sign)
// Example: 919876543210 for India, 15551234567 for USA
// const YOUR_WHATSAPP_NUMBER = '919028946979'; // Your primary WhatsApp number
const YOUR_WHATSAPP_NUMBER = '918446267174'; // Alternative number

async function sendTestMessage() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  console.log('🚀 Sending WhatsApp Test Message...');
  console.log('📱 From:', phoneNumberId);
  console.log('📱 To:', YOUR_WHATSAPP_NUMBER);
  console.log('');
  
  try {
    // Send hello_world template
    console.log('📨 Sending hello_world template message...');
    
    const payload = {
      messaging_product: 'whatsapp',
      to: YOUR_WHATSAPP_NUMBER,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message Sent Successfully!');
    console.log('📨 Message ID:', response.data.messages[0].id);
    console.log('');
    console.log('📱 Check your WhatsApp for the message!');
    console.log('💬 Reply to test the webhook reception');
    
  } catch (error) {
    console.log('❌ Message Sending Failed');
    if (error.response) {
      console.log('📋 Error:', error.response.status, error.response.statusText);
      console.log('📋 Details:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error?.code === 131030) {
        console.log('');
        console.log('⚠️  You need to add your WhatsApp number to the test recipients list!');
        console.log('');
        console.log('📝 How to fix:');
        console.log('1. Go to Facebook Developer Console');
        console.log('2. Navigate to WhatsApp → API Setup');
        console.log('3. Find "To" section');
        console.log('4. Click "Manage phone number list"');
        console.log('5. Add your WhatsApp number: ' + YOUR_WHATSAPP_NUMBER);
        console.log('6. Verify the number if required');
        console.log('7. Try running this script again');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Check if number was changed from default
if (YOUR_WHATSAPP_NUMBER === '919876543210') {
  console.log('⚠️  WARNING: You need to update YOUR_WHATSAPP_NUMBER in this script!');
  console.log('📝 Edit the file and replace 919876543210 with your actual WhatsApp number');
  console.log('📝 Format: Country code + number (no + sign)');
  console.log('📝 Example: 15551234567 for USA, 919876543210 for India');
  process.exit(1);
}

sendTestMessage().catch(console.error);