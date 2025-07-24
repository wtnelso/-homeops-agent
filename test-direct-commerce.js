// Test Commerce Intelligence directly
const CommerceIntelligence = require('./services/commerce-intelligence');

async function testCommerce() {
  console.log('🧪 Testing Commerce Intelligence directly...');
  
  const ci = new CommerceIntelligence();
  
  try {
    console.log('📝 Testing query: "Looking for a gift for my brother in laws birthday"');
    const result = await ci.process("Looking for a gift for my brother in laws birthday");
    
    console.log('✅ Result received:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📍 Stack:', error.stack);
  }
}

testCommerce();
