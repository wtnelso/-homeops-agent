// SummaryRow Component - Mental Load Digest Tiles
class SummaryRow {
  constructor() {
    this.tiles = [
      {
        id: 'urgent',
        icon: 'alert-triangle',
        label: 'Urgent Messages',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)'
      },
      {
        id: 'events', 
        icon: 'calendar-days',
        label: 'Calendar Events',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.15)'
      },
      {
        id: 'commerce',
        icon: 'shopping-cart', 
        label: 'Commerce Updates',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)'
      },
      {
        id: 'insights',
        icon: 'brain',
        label: 'Total Insights', 
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)'
      }
    ];
  }

  render() {
    return `
      <div class="summary-row">
        ${this.tiles.map(tile => this.renderTile(tile)).join('')}
      </div>
    `;
  }

  renderTile(tile) {
    return `
      <div class="summary-tile" data-tile-id="${tile.id}" style="border-left: 4px solid ${tile.color};">
        <div class="tile-icon" style="color: ${tile.color};">
          <i data-lucide="${tile.icon}" style="width: 32px; height: 32px;"></i>
        </div>
        <div class="tile-count" id="${tile.id}-count">-</div>
        <div class="tile-label">${tile.label}</div>
        <div class="tile-trend" id="${tile.id}-trend"></div>
      </div>
    `;
  }

  updateTile(tileId, count, trend = null) {
    const countElement = document.getElementById(`${tileId}-count`);
    const trendElement = document.getElementById(`${tileId}-trend`);
    
    if (countElement) {
      // Animate count change
      const currentCount = parseInt(countElement.textContent) || 0;
      this.animateCount(countElement, currentCount, count);
    }
    
    if (trendElement && trend) {
      trendElement.innerHTML = this.renderTrend(trend);
      lucide.createIcons();
    }
  }

  animateCount(element, start, end) {
    const duration = 1000;
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  renderTrend(trend) {
    if (!trend || trend.change === 0) return '';
    
    const isPositive = trend.change > 0;
    const icon = isPositive ? 'trending-up' : 'trending-down';
    const color = isPositive ? '#ef4444' : '#22c55e'; // Red for up (more work), green for down (less work)
    
    return `
      <div class="tile-trend-indicator" style="
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: ${color};
        margin-top: 4px;
      ">
        <i data-lucide="${icon}" style="width: 12px; height: 12px;"></i>
        <span>${Math.abs(trend.change)} ${trend.period || 'vs last week'}</span>
      </div>
    `;
  }

  updateAll(summaryData) {
    console.log('📊 Updating summary tiles:', summaryData);
    
    Object.keys(summaryData).forEach(key => {
      if (key === 'trends') return; // Skip trends object
      
      const value = summaryData[key];
      const trend = summaryData.trends?.[key];
      
      this.updateTile(key, value, trend);
    });
    
    // Add pulse animation to tiles with high values
    this.highlightCriticalTiles(summaryData);
  }

  highlightCriticalTiles(summaryData) {
    // Highlight urgent messages if count is high
    if (summaryData.urgent > 5) {
      const urgentTile = document.querySelector('[data-tile-id="urgent"]');
      if (urgentTile) {
        urgentTile.style.animation = 'pulse 2s infinite';
        urgentTile.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.3)';
      }
    }
    
    // Add CSS for pulse animation if not exists
    if (!document.getElementById('summary-animations')) {
      const style = document.createElement('style');
      style.id = 'summary-animations';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .summary-tile {
          transition: all 0.3s ease;
        }
        
        .summary-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }
      `;
      document.head.appendChild(style);
    }
  }

  async loadFromFirestore() {
    try {
      console.log('🔥 Loading summary data from Firestore...');
      
      // This would integrate with your Firebase setup
      const summaryData = await this.fetchFirestoreData();
      this.updateAll(summaryData);
      
      return summaryData;
    } catch (error) {
      console.error('❌ Error loading from Firestore:', error);
      throw error;
    }
  }

  async fetchFirestoreData() {
    // Integration with your existing Firebase collections
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    try {
      // This assumes your Firestore collections exist
      // Replace with actual Firestore queries based on your schema
      const [
        emailIntelligence,
        calendarEvents, 
        userFeedback,
        emotionalLoad
      ] = await Promise.all([
        this.queryCollection('email_intelligence', sevenDaysAgo),
        this.queryCollection('calendar_events', sevenDaysAgo),
        this.queryCollection('user_feedback', sevenDaysAgo),
        this.queryCollection('emotional_load', sevenDaysAgo)
      ]);
      
      return {
        urgent: emailIntelligence.filter(e => e.priority === 'high').length,
        events: calendarEvents.length,
        commerce: emailIntelligence.filter(e => e.category === 'commerce').length,
        insights: emailIntelligence.length,
        trends: {
          urgent: { change: 2, period: 'vs last week' },
          events: { change: -1, period: 'vs last week' },
          commerce: { change: 1, period: 'vs last week' },
          insights: { change: 5, period: 'vs last week' }
        }
      };
      
    } catch (error) {
      console.error('Firestore query error:', error);
      throw error;
    }
  }

  async queryCollection(collectionName, since) {
    // Placeholder for actual Firestore query
    // You'll need to implement this based on your Firebase setup
    console.log(`Querying ${collectionName} since ${since}`);
    
    // Return mock data for now
    switch(collectionName) {
      case 'email_intelligence':
        return [
          { priority: 'high', category: 'family' },
          { priority: 'high', category: 'travel' },
          { priority: 'medium', category: 'commerce' },
          { priority: 'medium', category: 'commerce' },
          { priority: 'low', category: 'news' }
        ];
      case 'calendar_events':
        return [
          { title: 'Golf Tournament', date: '2025-07-20' },
          { title: 'School Meeting', date: '2025-07-22' },
          { title: 'Flight Departure', date: '2025-07-25' }
        ];
      default:
        return [];
    }
  }

  // Utility method to refresh data
  async refresh() {
    console.log('🔄 Refreshing summary data...');
    
    try {
      // Show loading state
      this.showLoadingState();
      
      // Load fresh data
      await this.loadFromFirestore();
      
      console.log('✅ Summary data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing summary data:', error);
      this.showErrorState();
    }
  }

  showLoadingState() {
    const tiles = document.querySelectorAll('.summary-tile .tile-count');
    tiles.forEach(tile => {
      tile.innerHTML = '<i data-lucide="loader" style="width: 16px; height: 16px;"></i>';
    });
    lucide.createIcons();
  }

  showErrorState() {
    const tiles = document.querySelectorAll('.summary-tile .tile-count');
    tiles.forEach(tile => {
      tile.innerHTML = '<i data-lucide="alert-circle" style="width: 16px; height: 16px; color: #ef4444;"></i>';
    });
    lucide.createIcons();
  }
}

// Make SummaryRow available globally
window.SummaryRow = SummaryRow;
