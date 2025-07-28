// Dynamic D2C Brand Discovery Engine
// Real-time brand discovery with multiple data sources

class DynamicDTCDiscovery {
  constructor() {
    this.apiKeys = {
      builtwith: process.env.BUILTWITH_API_KEY,
      trustpilot: process.env.TRUSTPILOT_API_KEY,
      similarweb: process.env.SIMILARWEB_API_KEY,
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY
    };
  }

  // 1. Discover D2C brands by category using multiple sources
  async discoverBrandsByCategory(category, keywords = []) {
    const sources = await Promise.allSettled([
      this.getShopifyStoresByCategory(category),
      this.getBuiltWithStores(category, keywords),
      this.getTrustpilotBrands(keywords),
      this.getProductHuntLaunches(keywords)
    ]);

    return this.aggregateAndScore(sources, category);
  }

  // 2. Shopify Store Discovery (Real API)
  async getShopifyStoresByCategory(category) {
    try {
      // Use Store Leads API (real service)
      const response = await fetch(`https://api.storeleads.app/v1/stores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.storeLeads}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            platform: 'shopify',
            category: category,
            traffic_min: 10000, // Minimum monthly visitors
            founded_after: '2020-01-01' // Focus on newer D2C brands
          },
          limit: 50
        })
      });

      const data = await response.json();
      return data.stores.map(store => ({
        name: store.business_name,
        domain: store.domain,
        category: store.category,
        traffic: store.monthly_visitors,
        founded: store.founded_date,
        revenue_estimate: store.estimated_revenue,
        source: 'shopify_discovery'
      }));
    } catch (error) {
      console.error('Shopify discovery error:', error);
      return [];
    }
  }

  // 3. BuiltWith Technology Detection (Real API)
  async getBuiltWithStores(category, keywords) {
    try {
      // Find stores using Shopify + specific technologies
      const techQuery = keywords.join('+');
      const response = await fetch(
        `https://api.builtwith.com/v19/api.json?KEY=${this.apiKeys.builtwith}&LOOKUP=shopify+${techQuery}&HIDETEXT=yes&NOMETA=yes&NOPII=yes`
      );

      const data = await response.json();
      return data.Results?.map(result => ({
        name: result.Domain,
        domain: result.Domain,
        technologies: result.Technologies,
        traffic: result.Traffic,
        source: 'builtwith'
      })) || [];
    } catch (error) {
      console.error('BuiltWith error:', error);
      return [];
    }
  }

  // 4. Trustpilot Review Data (Real API)
  async getTrustpilotBrands(keywords) {
    try {
      const searchQuery = keywords.join(' ');
      const response = await fetch(
        `https://api.trustpilot.com/v1/business-units/search?query=${encodeURIComponent(searchQuery)}&sortBy=trustScore`,
        {
          headers: {
            'apikey': this.apiKeys.trustpilot
          }
        }
      );

      const data = await response.json();
      return data.businessUnits?.map(business => ({
        name: business.displayName,
        domain: business.websiteUrl,
        trustScore: business.trustScore,
        reviewCount: business.numberOfReviews,
        category: business.categories?.[0]?.name,
        source: 'trustpilot'
      })) || [];
    } catch (error) {
      console.error('Trustpilot error:', error);
      return [];
    }
  }

  // 5. Product Hunt Launches (Real API)
  async getProductHuntLaunches(keywords) {
    try {
      const query = `
        query($search: String!) {
          posts(first: 20, searchQuery: $search) {
            edges {
              node {
                name
                tagline
                websiteUrl
                votesCount
                commentsCount
                createdAt
                maker {
                  name
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.productHunt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { search: keywords.join(' ') }
        })
      });

      const data = await response.json();
      return data.data?.posts?.edges?.map(edge => ({
        name: edge.node.name,
        domain: edge.node.websiteUrl,
        description: edge.node.tagline,
        votes: edge.node.votesCount,
        buzz: edge.node.commentsCount,
        launched: edge.node.createdAt,
        source: 'product_hunt'
      })) || [];
    } catch (error) {
      console.error('Product Hunt error:', error);
      return [];
    }
  }

  // 6. Aggregate and Score Brands
  async aggregateAndScore(sources, category) {
    const brands = [];
    
    // Combine all sources
    sources.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        brands.push(...result.value);
      }
    });

    // Remove duplicates and enhance with additional data
    const uniqueBrands = this.deduplicateByDomain(brands);
    
    // Score each brand for relevance and quality
    const scoredBrands = await Promise.all(
      uniqueBrands.map(brand => this.scoreBrand(brand, category))
    );

    // Sort by composite score and return top candidates
    return scoredBrands
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 10);
  }

  // 7. Brand Scoring Algorithm
  async scoreBrand(brand, category) {
    let score = 0;
    
    // Traffic score (0-30 points)
    if (brand.traffic) {
      score += Math.min(brand.traffic / 100000 * 30, 30);
    }
    
    // Trust score (0-25 points)
    if (brand.trustScore) {
      score += (brand.trustScore / 5) * 25;
    }
    
    // Review volume (0-20 points)
    if (brand.reviewCount) {
      score += Math.min(Math.log10(brand.reviewCount) * 5, 20);
    }
    
    // Recency bonus (0-15 points)
    if (brand.founded) {
      const yearsSinceFounded = new Date().getFullYear() - new Date(brand.founded).getFullYear();
      score += Math.max(15 - yearsSinceFounded * 2, 0);
    }
    
    // Community buzz (0-10 points)
    if (brand.votes) {
      score += Math.min(brand.votes / 100 * 10, 10);
    }

    // Get additional website metrics
    const websiteMetrics = await this.getWebsiteMetrics(brand.domain);
    
    return {
      ...brand,
      compositeScore: score,
      metrics: websiteMetrics,
      lastUpdated: new Date().toISOString()
    };
  }

  // 8. Website Quality Metrics
  async getWebsiteMetrics(domain) {
    try {
      // Check if site is live, get performance data
      const checks = await Promise.allSettled([
        this.checkSiteHealth(domain),
        this.getSimilarWebData(domain),
        this.checkSocialSignals(domain)
      ]);

      return {
        isLive: checks[0].status === 'fulfilled' ? checks[0].value : false,
        traffic: checks[1].status === 'fulfilled' ? checks[1].value : null,
        social: checks[2].status === 'fulfilled' ? checks[2].value : null
      };
    } catch (error) {
      return { isLive: false, traffic: null, social: null };
    }
  }

  // Helper methods
  deduplicateByDomain(brands) {
    const seen = new Set();
    return brands.filter(brand => {
      const domain = this.extractDomain(brand.domain);
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    });
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}

module.exports = DynamicDTCDiscovery;
