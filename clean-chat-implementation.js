// Clean Chat Implementation - Professional UI
// Replace the existing executeLifeIntelligence function with this

async function executeLifeIntelligence(message, messagesDiv) {
  console.log('🧠 executeLifeIntelligence called with:', message);
  
  // Show user message
  const userMessage = `
    <div style="display: flex; justify-content: flex-end; margin: 20px 0;">
      <div style="background: #3b82f6; color: white; padding: 12px 18px; border-radius: 20px; max-width: 70%; font-size: 15px; line-height: 1.4; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${message}
      </div>
    </div>
  `;
  
  // Show thinking indicator
  const thinkingIndicator = `
    <div id="thinking-indicator" style="display: flex; justify-content: flex-start; margin: 20px 0;">
      <div style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); padding: 12px 18px; border-radius: 20px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        <div style="width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
        Thinking...
      </div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    </style>
  `;
  
  messagesDiv.innerHTML += userMessage + thinkingIndicator;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    // Get or create user ID for this session
    let userId = localStorage.getItem('homeops_user_id');
    if (!userId) {
      userId = 'mobile_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('homeops_user_id', userId);
    }
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: message,
        userId: userId
      })
    });
    
    const data = await response.json();
    console.log('🧠 Chat API response:', data);
    
    // Remove thinking indicator
    const thinkingEl = document.getElementById('thinking-indicator');
    if (thinkingEl) thinkingEl.remove();
    
    // Display clean AI response
    const aiResponse = `
      <div style="display: flex; justify-content: flex-start; margin: 20px 0;">
        <div style="background: rgba(255,255,255,0.08); color: white; padding: 16px 18px; border-radius: 20px; max-width: 85%; font-size: 15px; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${(data.reply || data.response || 'I\'m here to help you plan and organize your life. What would you like assistance with?').replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
    
    messagesDiv.innerHTML += aiResponse;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Remove thinking indicator
    const thinkingEl = document.getElementById('thinking-indicator');
    if (thinkingEl) thinkingEl.remove();
    
    // Show error message
    const errorMessage = `
      <div style="display: flex; justify-content: flex-start; margin: 20px 0;">
        <div style="background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 16px 18px; border-radius: 20px; max-width: 85%; font-size: 15px;">
          I'm having trouble connecting right now. Please try again in a moment.
        </div>
      </div>
    `;
    
    messagesDiv.innerHTML += errorMessage;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

// Enhanced sendMessage function for regular chat
async function sendMessage(messageInput, messagesDiv) {
  const message = messageInput.value.trim();
  if (!message) return;
  
  // Clear input
  messageInput.value = '';
  
  // Show user message
  const userMessage = `
    <div style="display: flex; justify-content: flex-end; margin: 20px 0;">
      <div style="background: #3b82f6; color: white; padding: 12px 18px; border-radius: 20px; max-width: 70%; font-size: 15px; line-height: 1.4; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${message}
      </div>
    </div>
  `;
  
  // Show thinking indicator
  const thinkingIndicator = `
    <div id="thinking-indicator-regular" style="display: flex; justify-content: flex-start; margin: 20px 0;">
      <div style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); padding: 12px 18px; border-radius: 20px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        <div style="width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
        Thinking...
      </div>
    </div>
  `;
  
  messagesDiv.innerHTML += userMessage + thinkingIndicator;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    // Get or create user ID for this session
    let userId = localStorage.getItem('homeops_user_id');
    if (!userId) {
      userId = 'mobile_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('homeops_user_id', userId);
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Remove thinking indicator
    const thinkingEl = document.getElementById('thinking-indicator-regular');
    if (thinkingEl) thinkingEl.remove();

    // Display AI response
    const aiResponse = `
      <div style="display: flex; justify-content: flex-start; margin: 20px 0;">
        <div style="background: rgba(255,255,255,0.08); color: white; padding: 16px 18px; border-radius: 20px; max-width: 85%; font-size: 15px; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${(data.reply || data.response || 'I\'m here to help!').replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
    
    messagesDiv.innerHTML += aiResponse;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  } catch (error) {
    console.error('Chat error:', error);
    
    // Remove thinking indicator
    const thinkingEl = document.getElementById('thinking-indicator-regular');
    if (thinkingEl) thinkingEl.remove();
    
    // Show error message
    const errorMessage = `
      <div style="display: flex; justify-content: flex-start; margin: 20px 0;">
        <div style="background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 16px 18px; border-radius: 20px; max-width: 85%; font-size: 15px;">
          I'm having trouble connecting. Please try again.
        </div>
      </div>
    `;
    
    messagesDiv.innerHTML += errorMessage;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}
