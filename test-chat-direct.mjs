#!/usr/bin/env node

/**
 * Direct test of chat API handler function
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Mock request and response objects
class MockRequest {
  constructor(body) {
    this.method = 'POST';
    this.body = body;
  }
}

class MockResponse {
  constructor() {
    this.headers = {};
    this.statusCode = 200;
    this.data = null;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.data = data;
    return this;
  }

  end() {
    return this;
  }
}

async function testChatFunction() {
  console.log('🧪 Testing Chat Function Directly...\n');

  try {
    // Import the chat handler
    const chatModule = await import('./api/chat.js');
    const chatHandler = chatModule.default;

    // Test data (using proper UUID format)
    const testMessage = {
      message: "What emails do I have about my kid's school activities?",
      userId: "12345678-1234-1234-1234-123456789012",
      accountId: "87654321-4321-4321-4321-210987654321",
      conversationId: null
    };

    console.log('📤 Testing with message:');
    console.log(`   Message: "${testMessage.message}"`);
    console.log(`   User ID: ${testMessage.userId}`);
    console.log(`   Account ID: ${testMessage.accountId}\n`);

    // Create mock request and response
    const req = new MockRequest(testMessage);
    const res = new MockResponse();

    // Call the handler
    console.log('🔧 Calling chat handler...\n');
    await chatHandler(req, res);

    console.log(`📡 Response Status: ${res.statusCode}`);

    if (res.statusCode === 200 && res.data) {
      console.log('\n✅ Success! Response received:');
      console.log('📊 Response Data:');
      console.log('- Success:', res.data.success);
      console.log('- Conversation ID:', res.data.conversationId);
      console.log('- Messages Count:', res.data.messages?.length || 0);

      if (res.data.messages && res.data.messages.length > 0) {
        const lastMessage = res.data.messages[res.data.messages.length - 1];
        console.log('\n💬 AI Response:');
        console.log(`"${lastMessage.content}"`);

        if (lastMessage.metadata) {
          console.log('\n🔧 Tool Usage Metadata:');
          console.log('- Model:', lastMessage.metadata.model);
          console.log('- Tools Available:', lastMessage.metadata.tools_available);
          console.log('- Tools Used:', lastMessage.metadata.tools_used);
        }
      }
    } else {
      console.error('❌ Error Response:', res.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testChatFunction();