const CommerceIntelligence = require('./services/commerce-intelligence');

async function testAllQueries() {
  const ci = new CommerceIntelligence();
  
  const testQueries = [
    "I need a black shirt for my daughters field day",
    "I need new cleats",
    "mens tennis shoes for my tennis match",
    "Looking for a gift for my brother for his bachelor party"
  ];
  
  console.log('🧪 TESTING COMPREHENSIVE COMMERCE INTELLIGENCE\n');
  
  for (const query of testQueries) {
    try {
      console.log(`🔍 Query: "${query}"`);
      const result = await ci.process(query);
      
      const interpretation = result.interpretation;
      const amazon = result.results[0];
      const dtc = result.results[1];
      
      console.log(`📊 Category: ${interpretation.category}`);
      console.log(`🏷️  Keywords: ${JSON.stringify(interpretation.keywords)}`);
      console.log(`🛒 Amazon: ${amazon.title} ($${amazon.price})`);
      console.log(`🎯 D2C: ${dtc.source} - ${dtc.title || dtc.defaultProduct?.title}`);
      console.log(`✅ ${amazon.title.includes('Apple') ? '❌ WRONG PRODUCT' : '✅ GOOD MATCH'}\n`);
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
    }
  }
}

testAllQueries().catch(console.error);
