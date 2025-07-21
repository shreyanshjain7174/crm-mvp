#!/usr/bin/env node

require('dotenv').config({ path: './apps/backend/.env' });
const axios = require('axios');

async function testFacebookWhatsAppAPI() {
  console.log('🚀 Testing Facebook WhatsApp Cloud API Integration...\n');

  // Check environment variables
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  console.log('📋 Environment Check:');
  console.log(`✅ Access Token: ${accessToken ? '✓ Set' : '❌ Missing'}`);
  console.log(`✅ Phone Number ID: ${phoneNumberId ? '✓ Set' : '❌ Missing'}`);
  console.log(`✅ Webhook Verify Token: ${verifyToken ? '✓ Set' : '❌ Missing'}`);
  console.log(`✅ App Secret: ${appSecret ? '✓ Set' : '❌ Missing'}\n`);

  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing required Facebook WhatsApp API credentials');
    console.log('\n📝 Setup Instructions:');
    console.log('1. Go to https://developers.facebook.com/');
    console.log('2. Create a new Business app');
    console.log('3. Add WhatsApp product to your app');
    console.log('4. Get your Access Token and Phone Number ID');
    console.log('5. Update your .env file with the credentials');
    return;
  }

  // Test 1: Verify API access by getting phone number info
  try {
    console.log('📋 Test 1: Verifying API Access...');
    
    const phoneInfoResponse = await axios.get(
      `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('✅ API Access Valid');
    console.log('📱 Phone Number Info:', phoneInfoResponse.data);
    console.log(`📞 Display Number: ${phoneInfoResponse.data.display_phone_number}`);
    console.log(`🆔 Phone Number ID: ${phoneInfoResponse.data.id}\n`);

  } catch (error) {
    console.log('❌ API Access Failed');
    if (error.response) {
      console.log('📋 Error:', error.response.status, error.response.statusText);
      console.log('📋 Details:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('🔐 Invalid access token - check your credentials');
      } else if (error.response.status === 400) {
        console.log('📝 Invalid phone number ID or request format');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
    return;
  }

  // Test 2: Send a test message (using hello_world template)
  try {
    console.log('📋 Test 2: Sending Test Template Message...');
    
    // Note: Replace this with your actual test WhatsApp number
    const testRecipient = '919876543210'; // Your WhatsApp number (without +)
    
    const messagePayload = {
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

    const messageResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template Message Sent Successfully');
    console.log('📨 Message ID:', messageResponse.data.messages[0].id);
    console.log('📱 Sent to:', testRecipient);
    console.log('📋 Response:', messageResponse.data);

  } catch (error) {
    console.log('❌ Message Sending Failed');
    if (error.response) {
      console.log('📋 Error:', error.response.status, error.response.statusText);
      console.log('📋 Details:', error.response.data);
      
      if (error.response.data.error?.code === 131056) {
        console.log('📞 Phone number not registered on WhatsApp or not in test recipients');
      } else if (error.response.data.error?.code === 132000) {
        console.log('📝 Message template not approved or doesn\'t exist');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  // Test 3: Test webhook verification endpoint
  try {
    console.log('\n📋 Test 3: Testing Webhook Verification...');
    
    const webhookTestUrl = 'http://localhost:3001/api/whatsapp/webhook';
    const testParams = {
      'hub.mode': 'subscribe',
      'hub.verify_token': verifyToken,
      'hub.challenge': 'test_challenge_12345'
    };

    const webhookResponse = await axios.get(webhookTestUrl, {
      params: testParams,
      timeout: 5000
    });

    if (webhookResponse.data === 'test_challenge_12345') {
      console.log('✅ Webhook Verification Working');
      console.log('📋 Challenge Response:', webhookResponse.data);
    } else {
      console.log('❌ Webhook Verification Failed');
      console.log('📋 Unexpected Response:', webhookResponse.data);
    }

  } catch (error) {
    console.log('❌ Webhook Test Failed (Backend may not be running)');
    if (error.code === 'ECONNREFUSED') {
      console.log('📝 Start your backend server with: npm run dev');
    } else {
      console.log('📋 Error:', error.message);
    }
  }

  console.log('\n🎉 Facebook WhatsApp API Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Add your test WhatsApp number to the test recipients list in Facebook Developer Console');
  console.log('2. Configure webhook URL in Facebook Developer Console:');
  console.log('   - Webhook URL: https://yourdomain.com/api/whatsapp/webhook');
  console.log(`   - Verify Token: ${verifyToken}`);
  console.log('3. Subscribe to webhook events: messages, message_deliveries, message_reads');
  console.log('4. Test with real WhatsApp messages');
}

testFacebookWhatsAppAPI().catch(console.error);