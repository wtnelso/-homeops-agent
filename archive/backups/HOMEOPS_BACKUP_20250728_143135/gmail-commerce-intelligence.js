// Gmail-Powered DTC Brand Database Builder
// Extracts real DTC brands from Gmail promotions to populate Commerce Intelligence database
// This replaces manual brand curation with real-world email marketing data

const { google } = require('googleapis');
const fs = require('fs').promises;
require('dotenv').config();

class GmailBrandDatabaseBuilder {
  constructor() {
    this.gmail = null;
    this.masterBrandDatabase = {};
    this.oauth2Client = null;
  }

  async initializeGmail() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    if (process.env.GMAIL_ACCESS_TOKEN) {
      this.oauth2Client.setCredentials({
        access_token: process.env.GMAIL_ACCESS_TOKEN,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    console.log('✅ Gmail API initialized for brand database building');
  }

  // Build master DTC brand database from user's Gmail
  async buildMasterDatabase(maxEmails = 2000) {
    try {
      console.log('🏗️ Building DTC brand database from Gmail promotions...');

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'category:promotions',
        maxResults: maxEmails
      });

      const messages = response.data.messages || [];
      console.log(`📧 Found ${messages.length} promotion emails to analyze`);

      const brandAnalysis = {};
      let processedCount = 0;

      // Process emails in batches
      for (let i = 0; i < Math.min(messages.length, 500); i += 10) {
        const batch = messages.slice(i, i + 10);
        await Promise.all(batch.map(async (message) => {
          try {
            const email = await this.gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            });

            const brand = this.extractBrandData(email.data);
            if (brand && this.isDTCBrand(brand)) {
              const domain = brand.domain;
              if (!brandAnalysis[domain]) {
                brandAnalysis[domain] = {
                  name: brand.name,
                  domain: domain,
                  emailCount: 0,
                  categories: new Set(),
                  products: new Set(),
                  pricing: [],
                  emailQualityScore: 0,
                  subjects: [],
                  firstSeen: null,
                  lastSeen: null
                };
              }

              brandAnalysis[domain].emailCount++;
              const emailDate = new Date(parseInt(email.data.internalDate));
              
              if (!brandAnalysis[domain].firstSeen || emailDate < brandAnalysis[domain].firstSeen) {
                brandAnalysis[domain].firstSeen = emailDate;
              }
              if (!brandAnalysis[domain].lastSeen || emailDate > brandAnalysis[domain].lastSeen) {
                brandAnalysis[domain].lastSeen = emailDate;
              }

              brandAnalysis[domain].subjects.push(brand.subject);
              this.categorizeEmailContent(email.data, brandAnalysis[domain]);
            }
            
            processedCount++;
            if (processedCount % 50 === 0) {
              console.log(`📊 Processed ${processedCount}/${messages.length} emails...`);
            }
          } catch (error) {
            // Skip individual email errors
          }
        }));

        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }

      // Convert to Commerce Intelligence database format
      this.masterBrandDatabase = this.convertToCommerceFormat(brandAnalysis);
      
      console.log(`✅ Built master database with ${Object.keys(this.masterBrandDatabase).length} DTC brands!`);
      
      // Save to file for persistence
      await this.saveDatabaseToFile();
      
      return this.masterBrandDatabase;

    } catch (error) {
      console.error('❌ Brand database building failed:', error);
      throw error;
    }
  }

  extractBrandData(emailData) {
    const headers = emailData.payload.headers;
    const fromHeader = headers.find(h => h.name === 'From');
    const subjectHeader = headers.find(h => h.name === 'Subject');
    
    if (!fromHeader) return null;

    const fromEmail = fromHeader.value;
    const subject = subjectHeader ? subjectHeader.value : '';

    const emailMatch = fromEmail.match(/<(.+)>/) || fromEmail.match(/([^\\s]+@[^\\s]+)/);
    if (!emailMatch) return null;

    const email = emailMatch[1] || emailMatch[0];
    const domain = email.split('@')[1];
    
    let brandName = fromEmail.split('<')[0].trim().replace(/"/g, '');
    if (!brandName || brandName.includes('@')) {
      brandName = domain.split('.')[0];
    }

    return {
      name: brandName,
      domain: domain,
      email: email,
      subject: subject
    };
  }

  isDTCBrand(brand) {
    // Filter out non-DTC domains
    const excludeDomains = [
      'gmail.com', 'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 
      'bestbuy.com', 'homedepot.com', 'lowes.com', 'costco.com', 'kohls.com',
      'macys.com', 'nordstrom.com', 'jcpenney.com', 'sears.com', 'paypal.com',
      'ups.com', 'fedex.com', 'usps.com', 'apple.com', 'google.com', 'microsoft.com',
      'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'youtube.com'
    ];
    
    return !excludeDomains.includes(brand.domain.toLowerCase());
  }

  categorizeEmailContent(emailData, brandInfo) {
    const subject = emailData.payload.headers.find(h => h.name === 'Subject')?.value || '';
    const body = this.extractEmailBody(emailData);
    const content = (subject + ' ' + body).toLowerCase();

    // Enhanced category detection for Commerce Intelligence
    const categoryPatterns = {
      'men': ['men', 'mens', 'guy', 'male', 'gentleman', 'husband', 'boyfriend', 'father', 'dad'],
      'women': ['women', 'womens', 'lady', 'female', 'wife', 'girlfriend', 'mother', 'mom'],
      'clothing': ['shirt', 'dress', 'pants', 'jacket', 'hoodie', 'sweater', 'jeans', 'fashion', 'apparel'],
      'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'athletic shoes', 'footwear'],
      'beauty': ['skincare', 'makeup', 'beauty', 'serum', 'moisturizer', 'cleanser', 'cosmetics'],
      'home': ['home', 'furniture', 'decor', 'bedding', 'kitchen', 'living', 'house'],
      'tech': ['tech', 'gadget', 'phone', 'laptop', 'headphones', 'charging', 'electronics'],
      'wellness': ['wellness', 'health', 'vitamin', 'supplement', 'fitness', 'yoga', 'meditation'],
      'coffee': ['coffee', 'espresso', 'beans', 'grinder', 'brewing', 'roast', 'caffeine'],
      'kids': ['kids', 'children', 'baby', 'toddler', 'toys', 'educational', 'child'],
      'gifting': ['gift', 'holiday', 'birthday', 'valentine', 'mother', 'father', 'present'],
      'sports': ['sports', 'athletic', 'running', 'gym', 'workout', 'tennis', 'golf', 'fitness'],
      'food': ['food', 'snack', 'meal', 'organic', 'healthy', 'nutrition', 'eat'],
      'outdoor': ['outdoor', 'camping', 'hiking', 'adventure', 'nature', 'travel'],
      'pets': ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten'],
      'subscription': ['subscription', 'monthly', 'box', 'delivery', 'recurring']
    };

    // Detect categories
    for (const [category, keywords] of Object.entries(categoryPatterns)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        brandInfo.categories.add(category);
      }
    }

    // Extract pricing for loyalty scoring
    const priceMatches = content.match(/\\$([0-9]+(?:\\.[0-9]{2})?)/g);
    if (priceMatches) {
      const prices = priceMatches.map(p => parseFloat(p.replace('$', '')));
      brandInfo.pricing.push(...prices);
    }
  }

  extractEmailBody(emailData) {
    let body = '';
    
    if (emailData.payload.body && emailData.payload.body.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString();
    } else if (emailData.payload.parts) {
      for (const part of emailData.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }
    
    return body.substring(0, 1000);
  }

  // Convert to format expected by Commerce Intelligence engine
  convertToCommerceFormat(brandAnalysis) {
    const database = {};
    
    for (const [domain, analysis] of Object.entries(brandAnalysis)) {
      // Skip brands with insufficient data
      if (analysis.emailCount < 2) continue;

      // Calculate loyalty score based on email engagement
      const daysSinceFirst = (Date.now() - analysis.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceLast = (Date.now() - analysis.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      
      const frequencyScore = Math.min(analysis.emailCount / 20, 1);
      const recencyScore = Math.max(0, 1 - (daysSinceLast / 365));
      const longevityScore = Math.min(daysSinceFirst / 365, 1); // Older brands get slight bonus
      
      const loyaltyScore = (frequencyScore * 0.5 + recencyScore * 0.3 + longevityScore * 0.2);

      // Calculate average pricing
      let avgPrice = 50;
      if (analysis.pricing.length > 0) {
        avgPrice = analysis.pricing.reduce((a, b) => a + b, 0) / analysis.pricing.length;
      }

      database[domain] = {
        name: analysis.name,
        domain: domain,
        categories: Array.from(analysis.categories),
        defaultProduct: {
          title: `${analysis.name} Premium Product`,
          price: `$${Math.round(avgPrice)}`,
          url: `https://${domain}`
        },
        emailQualityScore: Math.min(0.95, 0.6 + (analysis.emailCount * 0.03)),
        loyaltyScore: Math.min(0.99, Math.max(0.5, loyaltyScore)),
        emailCount: analysis.emailCount,
        firstSeen: analysis.firstSeen,
        lastSeen: analysis.lastSeen,
        offer: "Discovered from your email engagement",
        brandStory: `A brand you've engaged with ${analysis.emailCount} times since ${analysis.firstSeen.getFullYear()}`,
        trustSignals: ["Email subscriber", `${analysis.emailCount} emails`, "Real engagement"]
      };
    }

    return database;
  }

  async saveDatabaseToFile() {
    try {
      const filename = `gmail-dtc-brands-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(this.masterBrandDatabase, null, 2));
      console.log(`💾 Saved brand database to ${filename}`);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  // Get brands for specific categories (used by Commerce Intelligence)
  getBrandsForCategory(category) {
    return Object.values(this.masterBrandDatabase).filter(brand => 
      brand.categories.includes(category)
    );
  }
}

module.exports = GmailBrandDatabaseBuilder;
