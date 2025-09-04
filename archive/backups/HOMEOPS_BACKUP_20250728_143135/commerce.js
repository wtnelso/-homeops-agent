const express = require('express');
const router = express.Router();
const brandDatabase = require('../data/brand-database');

// Function to get brands by category and age appropriateness
function getBrandsByContext(userMessage) {
  const msg = userMessage.toLowerCase();
  let relevantBrands = {};
  
  // Children's products (ages 0-12) - improved pattern matching
  if (msg.includes('year old') || msg.includes('toy') || msg.includes('kid') || msg.includes('child') || 
      (msg.includes('birthday') && (msg.includes('boy') || msg.includes('girl') || msg.includes('nephew') || msg.includes('niece'))) ||
      msg.match(/\d+\s*year\s*old/i) || msg.match(/birthday.*\d+/i) || msg.match(/\d+.*birthday/i)) {
    
    // Extract age if mentioned - multiple patterns
    const ageMatch = msg.match(/(\d+)\s*year\s*old/i) || 
                     msg.match(/birthday.*?(\d+)/i) || 
                     msg.match(/(\d+).*?birthday/i) ||
                     msg.match(/for\s+a\s+(\d+)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    
    console.log(`🎂 Children's product detected. Age extracted: ${age} from message: "${msg}"`);
    
    if (age && age <= 12) {
      // Filter children's brands by age range
      Object.entries(brandDatabase.children).forEach(([key, brand]) => {
        if (brand.ageRange) {
          const [minAge, maxAge] = brand.ageRange.split('-').map(a => parseInt(a));
          if (age >= minAge && age <= maxAge) {
            relevantBrands[key] = brand;
            console.log(`✅ Added age-appropriate brand: ${key} (ages ${minAge}-${maxAge})`);
          }
        }
      });
      
      // If no age-specific brands found, add general children brands
      if (Object.keys(relevantBrands).length === 0) {
        Object.assign(relevantBrands, brandDatabase.children);
      }
      
      // If we have teen age, include teen brands
      if (age >= 13) {
        Object.assign(relevantBrands, brandDatabase.teens);
      }
    } else {
      // General children's products
      Object.assign(relevantBrands, brandDatabase.children);
    }
  }
  
  // Bedding and home products
  else if (msg.includes('bedding') || msg.includes('sheet') || msg.includes('pillow') || 
           msg.includes('mattress') || msg.includes('comforter') || msg.includes('duvet')) {
    Object.assign(relevantBrands, brandDatabase.home);
  }
  
  // Wedding gifts - combine multiple categories for couples
  else if (msg.includes('wedding') || msg.includes('engagement') || msg.includes('bridal') ||
           (msg.includes('brother') && msg.includes('wedding')) || (msg.includes('sister') && msg.includes('wedding'))) {
    // Combine home, fashion, and wellness for wedding gifts
    Object.assign(relevantBrands, brandDatabase.home);
    Object.assign(relevantBrands, brandDatabase.fashion);
    Object.assign(relevantBrands, brandDatabase.wellness);
  }
  
  // Anniversary and romantic gifts - detect budget level
  else if (msg.includes('anniversary') || msg.includes('valentine') || msg.includes('romantic') ||
           (msg.includes('wife') && (msg.includes('gift') || msg.includes('present'))) ||
           (msg.includes('husband') && (msg.includes('gift') || msg.includes('present')))) {
    
    // Check for high-budget indicators
    const highBudget = msg.includes('$1000') || msg.includes('$2000') || msg.includes('$3000') || 
                       msg.includes('$4000') || msg.includes('$5000') || msg.includes('5000') || 
                       msg.includes('luxury') || msg.includes('special') || msg.includes('milestone') ||
                       msg.includes('significant') || msg.includes('expensive') || msg.includes('splurge') ||
                       msg.includes('$1,000') || msg.includes('$2,000') || msg.includes('$3,000') || 
                       msg.includes('$4,000') || msg.includes('$5,000') || msg.includes('$6,000') ||
                       msg.includes('$7,000') || msg.includes('$8,000') || msg.includes('$9,000') ||
                       msg.includes('$10,000') || msg.includes('10000') || msg.includes('10,000');
    
    if (highBudget) {
      // For luxury budgets, prioritize luxury brands
      Object.assign(relevantBrands, brandDatabase.luxury);
      // Also include some premium regular brands
      Object.assign(relevantBrands, brandDatabase.fashion);
      Object.assign(relevantBrands, brandDatabase.beauty);
    } else {
      // Regular budget anniversary gifts
      Object.assign(relevantBrands, brandDatabase.fashion);
      Object.assign(relevantBrands, brandDatabase.beauty);
      Object.assign(relevantBrands, brandDatabase.home);
    }
  }
  
  // Fashion and apparel
  else if (msg.includes('clothes') || msg.includes('shirt') || msg.includes('pants') || 
           msg.includes('dress') || msg.includes('shoes') || msg.includes('fashion')) {
    Object.assign(relevantBrands, brandDatabase.fashion);
  }
  
  // Beauty and personal care
  else if (msg.includes('beauty') || msg.includes('makeup') || msg.includes('skincare') || 
           msg.includes('cosmetics') || msg.includes('lotion')) {
    Object.assign(relevantBrands, brandDatabase.beauty);
  }
  
  // Health and wellness
  else if (msg.includes('health') || msg.includes('vitamin') || msg.includes('supplement') || 
           msg.includes('fitness') || msg.includes('wellness')) {
    Object.assign(relevantBrands, brandDatabase.wellness);
  }
  
  // Food and beverage
  else if (msg.includes('food') || msg.includes('snack') || msg.includes('drink') || 
           msg.includes('beverage') || msg.includes('coffee')) {
    Object.assign(relevantBrands, brandDatabase.food);
  }
  
  // Pet products
  else if (msg.includes('pet') || msg.includes('dog') || msg.includes('cat') || 
           msg.includes('puppy') || msg.includes('kitten')) {
    Object.assign(relevantBrands, brandDatabase.pets);
  }
  
  // Technology
  else if (msg.includes('tech') || msg.includes('gadget') || msg.includes('electronic') || 
           msg.includes('device') || msg.includes('computer')) {
    Object.assign(relevantBrands, brandDatabase.tech);
  }
  
  // Default to fashion for general gifts
  else {
    Object.assign(relevantBrands, brandDatabase.fashion);
  }
  
  return relevantBrands;
}

// Commerce Profile Recommendations API
router.post('/recommendations', async (req, res) => {
  console.log("✅ Commerce profile route called!");
  try {
    // Hardcode API key temporarily to bypass environment issues
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ success: false, message: 'OpenAI API key not set.' });
    }
    
    const userMessage = req.body?.context || 'Suggest a gift';
    
    // Get relevant brands based on context
    const relevantBrands = getBrandsByContext(userMessage);
    const brandNames = Object.keys(relevantBrands).slice(0, 10).join(', ');
    
    // Create context-aware system prompt
    let systemPrompt = '';
    
    if (userMessage.includes('year old') || userMessage.includes('toy') || userMessage.includes('kid') || userMessage.includes('child')) {
      // Children's products prompt
      systemPrompt = `You are a children's product expert. You MUST ONLY recommend products from these exact brands: ${brandNames}

MANDATORY RULES:
- ONLY use brands from this list: ${brandNames}
- NO other brands are allowed
- Each recommendation MUST include one of these brand names in the product title
- Products must be age-appropriate for children

For each recommendation:
1. Start with "Brand: [BRAND NAME]" then describe a specific product
2. Explain why this brand has earned parental loyalty
3. Include realistic pricing
4. Focus on age-appropriate benefits

Example format:
"Brand: Lovevery - The Play Kits for 8-Year-Olds"

STRICT REQUIREMENT: Every recommendation must begin with "Brand: " followed by one of these brands: ${brandNames}`;
      
    } else if (userMessage.includes('wedding') || userMessage.includes('engagement') || userMessage.includes('bridal') ||
               (userMessage.includes('brother') && userMessage.includes('wedding')) || (userMessage.includes('sister') && userMessage.includes('wedding'))) {
      // Wedding gifts prompt
      systemPrompt = `You are a wedding gift expert specializing in meaningful gifts for couples. You MUST ONLY recommend products from these exact brands: ${brandNames}

FOCUS CATEGORIES: Home, Fashion, and Wellness brands perfect for newlyweds starting their life together.

For each recommendation, provide:
1. A specific wedding gift from one of these brands
2. Why this brand has earned loyalty from couples and families
3. Realistic pricing that fits the specified budget
4. How this gift helps couples build their new home together

STRICT RULES:
- ONLY use brands from this list: ${brandNames}
- Focus on home essentials, quality basics, or wellness items
- Consider items couples would use together
- Price ranges should reflect the specified budget

Respond with exactly 3 recommendations, each from a different brand category (home/fashion/wellness).`;
      
    } else if (userMessage.includes('anniversary') || userMessage.includes('valentine') || userMessage.includes('romantic') ||
               (userMessage.includes('wife') && (userMessage.includes('gift') || userMessage.includes('present'))) ||
               (userMessage.includes('husband') && (userMessage.includes('gift') || userMessage.includes('present')))) {
      // Anniversary/romantic gifts prompt
      systemPrompt = `You are a romantic gift expert specializing in anniversary and special occasion gifts. You MUST ONLY recommend products from these exact brands: ${brandNames}

FOCUS CATEGORIES: Fashion, Beauty, and Home brands that create memorable romantic gifts.

For each recommendation, provide:
1. A specific romantic/anniversary product from one of these brands
2. Why this brand creates meaningful gift experiences
3. Realistic pricing that fits the specified budget
4. How this gift expresses love and thoughtfulness

STRICT RULES:
- ONLY use brands from this list: ${brandNames}
- Focus on romantic, luxurious, or personal items
- Consider the relationship milestone (anniversary, etc.)
- Price ranges should reflect the specified budget

Respond with exactly 3 recommendations, each from a different brand category (fashion/beauty/home).`;
      
    } else if (userMessage.includes('bedding') || userMessage.includes('sheet') || userMessage.includes('pillow') || userMessage.includes('mattress')) {
      // Bedding products prompt
      systemPrompt = `You are a sleep and bedding expert. You MUST ONLY recommend products from these exact brands: ${brandNames}

Focus specifically on these bedding brands: ${brandNames}

For each recommendation, provide:
1. A specific bedding product from one of these brands
2. Why this brand has earned loyalty (sustainability, quality, comfort)
3. Realistic pricing from the actual brand
4. Specific material and comfort benefits

Respond with exactly 3 recommendations, each from a different brand in the list above.`;
      
    } else {
      // General products prompt
      systemPrompt = `You are an anti-platform commerce advisor. You MUST ONLY recommend products from these exact brands: ${brandNames}

Focus specifically on these brands: ${brandNames}

For each recommendation, provide:
1. A specific product from one of these brands
2. Why this brand has earned loyalty (quality, marketing, values)
3. Realistic pricing from the actual brand
4. Specific product benefits

Respond with exactly 3 recommendations, each from a different brand in the list above.`;
    }
    
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 600,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Find 3 specific product recommendations for: ${userMessage}. Focus on actual D2C brands that have earned customer loyalty.` 
          }
        ]
      })
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errorData);
      return res.status(500).json({ success: false, message: 'OpenAI API error' });
    }

    const openaiData = await openaiRes.json();
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', openaiData);
      return res.status(500).json({ success: false, message: 'Invalid OpenAI response' });
    }

    const content = openaiData.choices[0].message.content;
    console.log('OpenAI response:', content);
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return res.status(500).json({ success: false, message: 'No recommendations generated' });
    }

    let recommendations = [];
    
    // Parse recommendations with brand intelligence
    for (let i = 0; i < 3 && i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\d+\./) || line.includes('recommendation') || line.length > 20) {
        const productText = line.replace(/^\d+\.\s*/, '').trim();
        
        // Extract brand from content using comprehensive database
        let detectedBrand = 'Curated D2C Brand';
        let brandUrl = 'https://www.google.com/search?q=';
        let loyaltyReason = 'Direct-to-consumer excellence and customer loyalty';
        
        // Check all categories for brand matches
        const allBrands = {};
        Object.values(brandDatabase).forEach(category => {
          Object.assign(allBrands, category);
        });
        
        for (const brand of Object.keys(allBrands)) {
          // Case-insensitive brand matching with flexible formatting
          const brandVariations = [
            brand.toLowerCase(),
            brand.replace(/&/g, 'and').toLowerCase(),
            brand.replace(/\s+/g, '').toLowerCase(),
            brand.replace(/'/g, '').toLowerCase()
          ];
          
          const textLower = productText.toLowerCase();
          
          if (brandVariations.some(variation => textLower.includes(variation))) {
            detectedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
            brandUrl = `https://${allBrands[brand].domain}`;
            loyaltyReason = allBrands[brand].loyalty;
            break; // Exit loop once we find a match
          }
        }
        
        // Extract pricing information from AI response or use intelligent defaults
        let extractedPrice = '$75 - $250'; // default
        
        // Try to extract price from AI response first
        const pricePatterns = [
          /\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g,
          /Price:\s*\$[\d,]+(?:\s*-\s*\$[\d,]+)?/gi,
          /costs?\s*\$[\d,]+/gi,
          /around\s*\$[\d,]+/gi
        ];
        
        for (const pattern of pricePatterns) {
          const priceMatch = productText.match(pattern);
          if (priceMatch) {
            extractedPrice = priceMatch[0].replace(/Price:\s*/i, '').replace(/costs?\s*/i, '').replace(/around\s*/i, '');
            break;
          }
        }
        
        // If no price extracted, use intelligent budget-based pricing
        if (extractedPrice === '$75 - $250') {
          const msgLower = userMessage.toLowerCase();
          if (msgLower.includes('5000') || msgLower.includes('$5,000') || msgLower.includes('luxury') || 
              msgLower.includes('anniversary') || msgLower.includes('special')) {
            // Check if it's a luxury brand
            const luxuryBrands = ['cartier', 'tiffany', 'hermès', 'chanel', 'dior', 'louis vuitton', 'gucci', 'prada'];
            if (luxuryBrands.some(luxury => productText.toLowerCase().includes(luxury))) {
              extractedPrice = '$2,000 - $15,000';
            } else {
              extractedPrice = '$500 - $2,000';
            }
          } else if (msgLower.includes('2000') || msgLower.includes('$2,000')) {
            extractedPrice = '$500 - $2,000';
          } else if (msgLower.includes('1000') || msgLower.includes('$1,000')) {
            extractedPrice = '$300 - $1,000';
          }
        }
        
        recommendations.push({
          productName: productText.length > 100 ? productText.substring(0, 100) + '...' : productText,
          description: loyaltyReason,
          brand: detectedBrand,
          price: extractedPrice,
          url: brandUrl,
          loyaltyScore: 'High',
          isDirect: true
        });
      }
    }
    
    // Fallback if parsing fails
    if (recommendations.length === 0) {
      recommendations = [{
        productName: 'Curated Brand Recommendation',
        description: 'Direct-to-consumer brand that has earned loyalty through quality and values',
        brand: 'Independent D2C Brand',
        price: '$75 - $200',
        url: 'https://www.google.com/search?q=best+direct+to+consumer+brands',
        loyaltyScore: 'High',
        isDirect: true
      }];
    }
    
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error('Commerce API error:', err);
    res.status(500).json({ success: false, message: 'API error', error: err.message });
  }
});

module.exports = router;
