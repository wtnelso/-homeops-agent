#!/usr/bin/env node

/**
 * Test script for LangChain tools integration in chat API
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:10000/api';

// Test data (using proper UUID format)
const testMessage = {
  message: "What emails do I have about my kid's school activities?",
  userId: "12345678-1234-1234-1234-123456789012",
  accountId: "87654321-4321-4321-4321-210987654321",
  conversationId: null
};

async function testChatAPI() {
  console.log('🧪 Testing LangChain Tools Integration...\n');

  try {
    console.log('📤 Sending test message to chat API:');
    console.log(`   Message: "${testMessage.message}"`);
    console.log(`   User ID: ${testMessage.userId}`);
    console.log(`   Account ID: ${testMessage.accountId}\n`);

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const responseData = await response.json();

    console.log('\n✅ Success! Response received:');
    console.log('📊 Response Data:');
    console.log('- Success:', responseData.success);
    console.log('- Conversation ID:', responseData.conversationId);
    console.log('- Messages Count:', responseData.messages?.length || 0);

    if (responseData.messages && responseData.messages.length > 0) {
      const lastMessage = responseData.messages[responseData.messages.length - 1];
      console.log('\n💬 AI Response:');
      console.log(`"${lastMessage.content}"`);

      if (lastMessage.metadata) {
        console.log('\n🔧 Tool Usage Metadata:');
        console.log('- Model:', lastMessage.metadata.model);
        console.log('- Tools Available:', lastMessage.metadata.tools_available);
        console.log('- Tools Used:', lastMessage.metadata.tools_used);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testChatAPI();