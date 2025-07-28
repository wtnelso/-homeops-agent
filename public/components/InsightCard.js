// InsightCard Component - Reusable insight card with Lucide icons
class InsightCard {
  constructor(insight) {
    this.insight = insight;
  }

  render() {
    return `
      <div class="insight-card" data-insight-id="${this.insight.id || this.insight.title}">
        <div class="insight-header">
          <div class="insight-icon">
            <i data-lucide="${this.insight.icon || 'info'}" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="insight-content">
            <div class="insight-title">${this.insight.title}</div>
            <div class="insight-meta">
              <span class="insight-category">${this.insight.category}</span>
              <span>•</span>
              <span class="insight-date">${this.formatDate(this.insight.date)}</span>
              <span>•</span>
              <span class="insight-priority" style="color: ${this.getPriorityColor(this.insight.priority)}">${this.insight.priority}</span>
            </div>
            <div class="insight-text">${this.insight.insight}</div>
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }

  renderActions() {
    const actions = this.insight.actions || [
      { type: 'primary', icon: 'plus', text: this.insight.action || 'Take Action', action: 'primary' },
      { type: 'secondary', icon: 'expand', text: 'Expand', action: 'expand' },
      { type: 'secondary', icon: 'x', text: 'Dismiss', action: 'dismiss' }
    ];

    return `
      <div class="insight-actions">
        ${actions.map(action => `
          <button class="action-btn ${action.type}" 
                  onclick="InsightCard.handleAction('${action.action}', '${this.insight.title}', '${this.insight.action || 'Take Action'}')">
            <i data-lucide="${action.icon}" style="width: 14px; height: 14px;"></i>
            ${action.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  formatDate(dateStr) {
    if (!dateStr) return 'No date';
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return dateStr;
    }
  }

  getPriorityColor(priority) {
    switch(priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b'; 
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  }

  // Static method to handle actions from all insight cards
  static async handleAction(actionType, title, primaryAction) {
    console.log(`InsightCard action: ${actionType} for "${title}"`);
    
    switch(actionType) {
      case 'primary':
        await InsightCard.handlePrimaryAction(primaryAction, title);
        break;
      case 'expand':
        InsightCard.expandInsight(title);
        break;
      case 'dismiss':
        InsightCard.dismissInsight(title);
        break;
      default:
        console.warn('Unknown action type:', actionType);
    }
  }

  static async handlePrimaryAction(action, title) {
    if (action === 'Add to Calendar') {
      try {
        const response = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            action: 'add',
            source: 'insight_card'
          })
        });
        
        const result = await response.json();
        if (result.success) {
          InsightCard.showNotification(`✅ Added "${title}" to calendar`, 'success');
        } else {
          InsightCard.showNotification(`❌ Failed to add to calendar: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Calendar action error:', error);
        InsightCard.showNotification(`Calendar action: ${action} for "${title}"`, 'info');
      }
    } else if (action === 'Create Shopping List') {
      try {
        const response = await fetch('/api/shopping-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            action: 'create',
            source: 'insight_card'
          })
        });
        
        const result = await response.json();
        if (result.success) {
          InsightCard.showNotification(`✅ Created shopping list for "${title}"`, 'success');
        } else {
          InsightCard.showNotification(`❌ Failed to create shopping list: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Shopping list action error:', error);
        InsightCard.showNotification(`Shopping list action: ${action} for "${title}"`, 'info');
      }
    } else {
      InsightCard.showNotification(`${action} action triggered for: ${title}`, 'info');
    }
  }

  static expandInsight(title) {
    console.log(`Expanding insight: ${title}`);
    
    // Find the insight data from the global dashboard
    let insight = null;
    if (window.dashboard && window.dashboard.data.insights) {
      insight = window.dashboard.data.insights.find(i => i.title === title);
    }
    
    if (insight) {
      InsightCard.showInsightModal(insight);
    } else {
      InsightCard.showNotification(`Would show detailed modal for: ${title}`, 'info');
    }
  }

  static showInsightModal(insight) {
    // Create a modal overlay
    const modal = document.createElement('div');
    modal.className = 'insight-modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
      <div class="insight-modal" style="
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        backdrop-filter: blur(20px);
        color: white;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <i data-lucide="${insight.icon || 'info'}" style="width: 24px; height: 24px;"></i>
          <h3 style="margin: 0; font-size: 20px; font-weight: 600;">${insight.title}</h3>
        </div>
        
        <div style="display: flex; gap: 12px; font-size: 14px; opacity: 0.8; margin-bottom: 16px;">
          <span>${insight.category}</span>
          <span>•</span>
          <span>${insight.date}</span>
          <span>•</span>
          <span style="color: ${new InsightCard(insight).getPriorityColor(insight.priority)}">${insight.priority} Priority</span>
        </div>
        
        <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          ${insight.insight}
        </div>
        
        ${insight.details ? `
          <div style="background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.8;">Additional Details:</h4>
            <div style="font-size: 14px; line-height: 1.4;">${insight.details}</div>
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button onclick="this.closest('.insight-modal-overlay').remove()" style="
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 8px 16px;
            color: white;
            cursor: pointer;
            font-size: 14px;
          ">Close</button>
          <button onclick="InsightCard.handlePrimaryAction('${insight.action}', '${insight.title}'); this.closest('.insight-modal-overlay').remove();" style="
            background: rgba(139, 92, 246, 0.3);
            border: 1px solid rgba(139, 92, 246, 0.5);
            border-radius: 8px;
            padding: 8px 16px;
            color: white;
            cursor: pointer;
            font-size: 14px;
          ">${insight.action || 'Take Action'}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  static dismissInsight(title) {
    console.log(`Dismissing insight: ${title}`);
    
    // Find and animate the card
    const cards = document.querySelectorAll('.insight-card');
    cards.forEach(card => {
      if (card.querySelector('.insight-title').textContent === title) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          card.remove();
          InsightCard.showNotification(`Dismissed: ${title}`, 'info');
        }, 300);
      }
    });
    
    // Remove from global dashboard data if available
    if (window.dashboard && window.dashboard.data.insights) {
      window.dashboard.data.insights = window.dashboard.data.insights.filter(i => i.title !== title);
    }
  }

  static showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `insight-notification insight-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                   type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                   'rgba(59, 130, 246, 0.9)'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Make InsightCard available globally
window.InsightCard = InsightCard;
