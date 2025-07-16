#!/usr/bin/env node

require('dotenv').config({ path: './apps/backend/.env' });
const axios = require('axios');

async function testAiSensyAPI() {
  const apiKey = process.env.AISENSY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ AISENSY_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🔑 AiSensy API Key found');
  console.log('🧪 Testing AiSensy API Integration...\n');

  // Test 1: Check API key validity by trying to get account info
  try {
    console.log('📋 Test 1: Validating API Key...');
    
    // Try sending a test message to validate the API key
    // Note: Using a properly formatted test number
    const testPayload = {
      to: '919876543210', // Replace with your actual WhatsApp number (without +)
      type: 'text',
      recipient_type: 'individual',
      text: {
        body: 'Test message from CRM - API validation'
      }
    };

    const response = await axios.post(
      'https://backend.aisensy.com/direct-apis/t1/messages',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-AiSensy-ApiKey': apiKey
        }
      }
    );

    console.log('✅ API Key is valid');
    console.log('📱 Test message sent successfully');
    console.log('📋 Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      console.log('📋 Error Details:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('🔐 Authentication failed - check your API key');
      } else if (error.response.status === 400) {
        console.log('📝 Request format issue - this is expected for test number');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  // Test 2: Test template message API (campaign API)
  try {
    console.log('\n📋 Test 2: Testing Template Message API...');
    
    const templatePayload = {
      apiKey: apiKey,
      campaignName: process.env.AISENSY_CAMPAIGN_NAME || 'CRM_Chat',
      destination: '15558132299', // Replace with your test number
      userName: 'Test User',
      source: 'CRM_Test',
      templateParams: ['Welcome to our CRM system!'],
      tags: ['test', 'crm'],
      attributes: {
        source: 'CRM_MVP_Test',
        timestamp: new Date().toISOString()
      }
    };

    const templateResponse = await axios.post(
      'https://backend.aisensy.com/campaign/t1/api/v2',
      templatePayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template API working');
    console.log('📋 Template Response:', templateResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Template API Error:', error.response.status, error.response.statusText);
      console.log('📋 Error Details:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('\n🎉 AiSensy API Integration Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Replace test phone number with your actual WhatsApp number');
  console.log('2. Configure webhook URL in AiSensy dashboard');
  console.log('3. Test the full integration with your CRM backend');
}

testAiSensyAPI().catch(console.error);