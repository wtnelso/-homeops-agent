// 🔥 HOMEOPS DECODER - Premium Email Intelligence Engine
// Apple/Superhuman aesthetic with purple gradient branding

console.log('🚀 HomeOps Decoder loaded - Premium UI v2.0');

// Global state
let decodedEmails = [];
let filteredEmails = [];
let selectedEmails = new Set();
let currentCategory = 'all';
let isProcessing = false;
let searchQuery = '';

// Category configuration
const CATEGORIES = {
  urgent: {
    label: 'Urgent',
    icon: 'zap',
    color: '#ef4444',
    description: 'Requires immediate attention'
  },
  schedule: {
    label: 'Schedule', 
    icon: 'calendar-days',
    color: '#3b82f6',
    description: 'Events & appointments'
  },
  family: {
    label: 'Family',
    icon: 'users', 
    color: '#22c55e',
    description: 'Personal & family matters'
  },
  commerce: {
    label: 'Commerce',
    icon: 'shopping-bag',
    color: '#f59e0b', 
    description: 'Receipts & purchases'
  }
};

// 🎯 INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 Initializing HomeOps Decoder...');
  initializeDecoder();
  setupEventListeners();
  checkInitialState();
});

// 🔧 INITIALIZATION FUNCTIONS
function initializeDecoder() {
  console.log('🔧 Setting up decoder components...');
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Show loading state initially
  showLoadingState();
  
  // Check if user has Gmail connected
  checkGmailConnection();
}

function setupEventListeners() {
  console.log('🎛️ Setting up event listeners...');
  
  // Header actions
  document.getElementById('refresh-btn')?.addEventListener('click', refreshEmails);
  document.getElementById('process-btn')?.addEventListener('click', processEmails);
  document.getElementById('process-again-btn')?.addEventListener('click', processEmails);
  
  // Search functionality
  const searchInput = document.getElementById('decoder-search');
  const searchClear = document.getElementById('decoder-search-clear');
  
  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => {
      searchClear.style.display = searchInput.value ? 'flex' : 'none';
      // Optionally, trigger search/filter here
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      searchInput.focus();
      // Optionally, reset search/filter here
    });
  }
  
  // Category tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.category));
  });
  
  // Command bar actions
  document.getElementById('select-all-btn')?.addEventListener('click', toggleSelectAll);
  document.getElementById('bulk-archive-btn')?.addEventListener('click', bulkArchive);
  document.getElementById('bulk-snooze-btn')?.addEventListener('click', bulkSnooze);
  
  // Bottom action bar
  document.getElementById('bulk-archive')?.addEventListener('click', bulkArchive);
  document.getElementById('bulk-snooze')?.addEventListener('click', bulkSnooze);
  document.getElementById('bulk-mark-important')?.addEventListener('click', bulkMarkImportant);
}

function checkInitialState() {
  console.log('🔍 Checking initial state...');
  
  // Check if we have existing decoded emails
  const userId = getCurrentUserId();
  if (userId) {
    loadExistingEmails(userId);
  } else {
    showZeroState();
  }
}

// 🎛️ STATE MANAGEMENT
function showLoadingState() {
  hideAllStates();
  document.getElementById('loading-state').style.display = 'flex';
}

function showZeroState() {
  hideAllStates();
  document.getElementById('zero-state').style.display = 'flex';
  updateCategoryCounts();
}

function showEmailCards() {
  hideAllStates();
  document.getElementById('email-cards-container').style.display = 'grid';
  renderEmailCards();
}

function showTrainingMode() {
  hideAllStates();
  document.getElementById('training-mode').style.display = 'block';
  renderTrainingCards();
}

function hideAllStates() {
  const states = ['loading-state', 'zero-state', 'email-cards-container', 'training-mode'];
  states.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
}

// 📧 EMAIL CARD RENDERING
function renderEmailCards() {
  console.log('🎨 Rendering email cards...');
  
  const container = document.getElementById('email-cards-container');
  if (!container) return;
  
  const emailsToRender = filteredEmails.length > 0 ? filteredEmails : decodedEmails;
  
  if (emailsToRender.length === 0) {
    showZeroState();
    return;
  }
  
  container.innerHTML = emailsToRender.map(email => createEmailCard(email)).join('');
  
  // Re-initialize Lucide icons for new cards
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  updateCategoryCounts();
}

function createEmailCard(email) {
  const category = CATEGORIES[email.category] || CATEGORIES.urgent;
  const isSelected = selectedEmails.has(email.id);
  
  return `
    <div class="email-card ${isSelected ? 'selected' : ''}" data-email-id="${email.id}" data-category="${email.category}">
      <div class="card-header">
        <div class="card-category">
          <i data-lucide="${category.icon}"></i>
          <span>${category.label}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon" onclick="toggleEmailSelection('${email.id}')" title="Select">
            <i data-lucide="${isSelected ? 'check-square' : 'square'}"></i>
          </button>
          <button class="btn-icon" onclick="archiveEmail('${email.id}')" title="Archive">
            <i data-lucide="archive"></i>
          </button>
        </div>
      </div>
      
      <div class="card-content">
        <div class="email-sender">
          <strong>${email.sender}</strong>
          <span class="email-time">${formatTime(email.timestamp)}</span>
        </div>
        
        <div class="email-subject">
          ${email.subject}
        </div>
        
        <div class="email-summary">
          ${email.summary || email.snippet}
        </div>
      </div>
      
      <div class="card-footer">
        <div class="email-actions">
          <button class="btn-action" onclick="snoozeEmail('${email.id}')">
            <i data-lucide="clock"></i>
            <span>Snooze</span>
          </button>
          <button class="btn-action" onclick="markImportant('${email.id}')">
            <i data-lucide="star"></i>
            <span>Important</span>
          </button>
          <button class="btn-action" onclick="replyToEmail('${email.id}')">
            <i data-lucide="reply"></i>
            <span>Reply</span>
          </button>
        </div>
        
        <div class="email-feedback">
          <button class="btn-feedback" onclick="giveFeedback('${email.id}', 'positive')" title="Good categorization">
            <i data-lucide="thumbs-up"></i>
          </button>
          <button class="btn-feedback" onclick="giveFeedback('${email.id}', 'negative')" title="Wrong categorization">
            <i data-lucide="thumbs-down"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// 🎓 TRAINING MODE
function renderTrainingCards() {
  console.log('🎓 Rendering training cards...');
  
  const container = document.getElementById('training-cards');
  if (!container) return;
  
  const trainingEmails = [
    {
      id: 'training-1',
      sender: 'Dr. Sarah Chen',
      subject: 'Appointment Confirmation: Tomorrow 2:30 PM',
      summary: 'Your child\'s annual checkup is confirmed for tomorrow at 2:30 PM. Please arrive 15 minutes early.',
      category: 'urgent'
    },
    {
      id: 'training-2', 
      sender: 'Jessica Martinez - School Principal',
      subject: 'Parent-Teacher Conference: This Friday',
      summary: 'Reminder: Your parent-teacher conference is scheduled for this Friday at 3:00 PM.',
      category: 'schedule'
    },
    {
      id: 'training-3',
      sender: 'PTO Newsletter',
      subject: 'This Week\'s School Events',
      summary: 'Check out this week\'s events including the bake sale on Friday and early dismissal on Wednesday.',
      category: 'family'
    },
    {
      id: 'training-4',
      sender: 'Amazon Prime',
      subject: 'Your order has shipped',
      summary: 'Your order #123-4567890-1234567 containing "Organic Baby Formula" will arrive tomorrow between 2-6 PM.',
      category: 'commerce'
    }
  ];
  
  container.innerHTML = trainingEmails.map(email => createTrainingCard(email)).join('');
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function createTrainingCard(email) {
  const category = CATEGORIES[email.category];
  
  return `
    <div class="training-card" data-training-id="${email.id}">
      <div class="training-header">
        <div class="training-category">
          <i data-lucide="${category.icon}"></i>
          <span>${category.label}</span>
        </div>
        <p class="training-description">${category.description}</p>
      </div>
      
      <div class="training-content">
        <div class="training-email">
          <strong>${email.sender}</strong><br>
          <span class="email-subject">${email.subject}</span><br>
          <span class="email-body">${email.summary}</span>
        </div>
      </div>
      
      <div class="training-feedback">
        <button class="btn-feedback" onclick="giveTrainingFeedback('${email.id}', 'negative')" title="Wrong categorization">
          <i data-lucide="thumbs-down"></i>
        </button>
        <button class="btn-feedback" onclick="giveTrainingFeedback('${email.id}', 'positive')" title="Good categorization">
          <i data-lucide="thumbs-up"></i>
        </button>
      </div>
    </div>
  `;
}

// 📊 CATEGORY MANAGEMENT
function switchCategory(category) {
  console.log(`📊 Switching to category: ${category}`);
  
  // Update tab states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  
  currentCategory = category;
  filterEmails();
}

function updateCategoryCounts() {
  const counts = {
    all: decodedEmails.length,
    urgent: decodedEmails.filter(e => e.category === 'urgent').length,
    schedule: decodedEmails.filter(e => e.category === 'schedule').length,
    family: decodedEmails.filter(e => e.category === 'family').length,
    commerce: decodedEmails.filter(e => e.category === 'commerce').length
  };
  
  Object.entries(counts).forEach(([category, count]) => {
    const element = document.getElementById(`count-${category}`);
    if (element) element.textContent = count;
  });
}

// 🎛️ EMAIL ACTIONS
function toggleEmailSelection(emailId) {
  if (selectedEmails.has(emailId)) {
    selectedEmails.delete(emailId);
  } else {
    selectedEmails.add(emailId);
  }
  
  updateSelectionUI();
  renderEmailCards(); // Re-render to update selection state
}

function toggleSelectAll() {
  const emailsToSelect = filteredEmails.length > 0 ? filteredEmails : decodedEmails;
  
  if (selectedEmails.size === emailsToSelect.length) {
    selectedEmails.clear();
  } else {
    emailsToSelect.forEach(email => selectedEmails.add(email.id));
  }
  
  updateSelectionUI();
  renderEmailCards();
}

function updateSelectionUI() {
  const selectedCount = selectedEmails.size;
  const bottomActions = document.getElementById('bottom-actions');
  const selectedCountElement = document.getElementById('selected-count');
  
  if (selectedCount > 0) {
    bottomActions.classList.add('visible');
    selectedCountElement.textContent = `${selectedCount} selected`;
  } else {
    bottomActions.classList.remove('visible');
  }
}

// 🚀 EMAIL PROCESSING
async function processEmails() {
  console.log('🚀 Processing emails...');
  
  if (isProcessing) return;
  
  isProcessing = true;
  showLoadingState();
  
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No user ID found');
    }
    
    // Show processing animation
    const loadingContent = document.querySelector('.loading-content h3');
    const messages = [
      'Scanning your inbox...',
      'Detecting calendar invites, receipts, school messages...',
      'Learning your communication patterns...',
      'Organizing by priority...'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (loadingContent && messageIndex < messages.length) {
        loadingContent.textContent = messages[messageIndex];
        messageIndex++;
      }
    }, 2000);
    
    // Call the correct email processing endpoint
    const response = await fetch('/api/email-decoder/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    clearInterval(messageInterval);
    
    const result = await response.json();
    
    if (!response.ok) {
      if (result.needsReauth) {
        // Show reauthorization message with button to reconnect
        showError(`
          <div style="text-align: center;">
            <h3 style="color: #dc2626; margin-bottom: 1rem;">Gmail Connection Expired</h3>
            <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.6;">
              Your Gmail connection has expired. Please reconnect to continue using the email decoder.
            </p>
            <button onclick="connectGmail()" class="btn-primary" style="
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              margin-right: 12px;
            ">Reconnect Gmail</button>
            <button onclick="hideAllStates()" class="btn-secondary" style="
              background: #f1f5f9;
              color: #64748b;
              border: 1px solid #e2e8f0;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">Cancel</button>
          </div>
        `);
      } else {
        throw new Error(result.error || 'Failed to process emails');
      }
      return;
    }
    
    decodedEmails = result.emails || [];
    
    console.log(`✅ Processed ${decodedEmails.length} emails`);
    
    if (decodedEmails.length === 0) {
      showZeroState();
    } else {
      showEmailCards();
    }
    
  } catch (error) {
    console.error('❌ Error processing emails:', error);
    showError(`Failed to process emails: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

async function refreshEmails() {
  console.log('🔄 Refreshing emails...');
  await processEmails();
}

// 📧 EMAIL ACTIONS
async function archiveEmail(emailId) {
  console.log(`📧 Archiving email: ${emailId}`);
  // TODO: Implement archive functionality
  showSuccess('Email archived');
}

async function snoozeEmail(emailId) {
  console.log(`📧 Snoozing email: ${emailId}`);
  // TODO: Implement snooze functionality
  showSuccess('Email snoozed');
}

async function markImportant(emailId) {
  console.log(`📧 Marking email as important: ${emailId}`);
  // TODO: Implement mark important functionality
  showSuccess('Email marked as important');
}

async function replyToEmail(emailId) {
  console.log(`📧 Replying to email: ${emailId}`);
  // TODO: Implement reply functionality
  showSuccess('Opening reply composer');
}

// 🎓 FEEDBACK SYSTEM
async function giveFeedback(emailId, feedback) {
  console.log(`🎓 Giving feedback: ${feedback} for email: ${emailId}`);
  
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailId,
        feedback,
        userId: getCurrentUserId()
      })
    });
    
    if (response.ok) {
      showSuccess('Thank you for your feedback!');
    }
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
  }
}

async function giveTrainingFeedback(emailId, feedback) {
  console.log(`🎓 Training feedback: ${feedback} for email: ${emailId}`);
  
  // TODO: Implement training feedback
  showSuccess('Thank you for helping us learn!');
  
  // Move to next training card or complete training
  const trainingCard = document.querySelector(`[data-training-id="${emailId}"]`);
  if (trainingCard) {
    trainingCard.style.opacity = '0.5';
    trainingCard.style.pointerEvents = 'none';
  }
}

// 🎛️ BULK ACTIONS
async function bulkArchive() {
  if (selectedEmails.size === 0) return;
  
  console.log(`📧 Bulk archiving ${selectedEmails.size} emails`);
  // TODO: Implement bulk archive
  showSuccess(`${selectedEmails.size} emails archived`);
  selectedEmails.clear();
  updateSelectionUI();
  renderEmailCards();
}

async function bulkSnooze() {
  if (selectedEmails.size === 0) return;
  
  console.log(`📧 Bulk snoozing ${selectedEmails.size} emails`);
  // TODO: Implement bulk snooze
  showSuccess(`${selectedEmails.size} emails snoozed`);
  selectedEmails.clear();
  updateSelectionUI();
  renderEmailCards();
}

async function bulkMarkImportant() {
  if (selectedEmails.size === 0) return;
  
  console.log(`📧 Bulk marking ${selectedEmails.size} emails as important`);
  // TODO: Implement bulk mark important
  showSuccess(`${selectedEmails.size} emails marked as important`);
  selectedEmails.clear();
  updateSelectionUI();
  renderEmailCards();
}

// 🔧 UTILITY FUNCTIONS
function getCurrentUserId() {
  // TODO: Get from Firebase Auth or session
  return 'test_user';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function showSuccess(message) {
  // TODO: Implement toast notification
  console.log(`✅ ${message}`);
}

function showError(message) {
  console.error(`❌ ${message}`);
  
  // Hide loading state
  hideAllStates();
  
  // Show error state
  const dashboardView = document.getElementById('dashboard-view');
  if (dashboardView) {
    dashboardView.innerHTML = `
      <div class="error-state" style="
        text-align: center;
        padding: 4rem 2rem;
        max-width: 600px;
        margin: 0 auto;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="color: #dc2626; margin-bottom: 1rem;">Something went wrong</h3>
        <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.6;">${message}</p>
        <button onclick="processEmails()" class="btn-primary" style="
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.2s;
        ">
          <i data-lucide="refresh-cw" style="width:1.2rem;height:1.2rem;margin-right:0.5rem;"></i>
          Try Again
        </button>
      </div>
    `;
  }
}

// 🔍 GMAIL CONNECTION
async function checkGmailConnection() {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`/api/gmail/status?userId=${userId}`);
    
    if (response.ok) {
      const { connected } = await response.json();
      
      if (!connected) {
        // Show onboarding/training mode
        showTrainingMode();
      } else {
        // Load existing emails
        loadExistingEmails(userId);
      }
    }
  } catch (error) {
    console.error('❌ Error checking Gmail connection:', error);
    showTrainingMode();
  }
}

async function loadExistingEmails(userId) {
  try {
    const response = await fetch(`/api/emails?userId=${userId}`);
    
    if (response.ok) {
      const result = await response.json();
      decodedEmails = result.emails || [];
      
      if (decodedEmails.length === 0) {
        showZeroState();
      } else {
        showEmailCards();
      }
    }
  } catch (error) {
    console.error('❌ Error loading existing emails:', error);
    showZeroState();
  }
}

// Gmail connection function
async function connectGmail() {
  console.log('🔗 Connecting Gmail...');
  
  const userId = getCurrentUserId();
  if (!userId) {
    showError('No user ID found. Please log in again.');
    return;
  }
  
  try {
    // Show connecting state
    showLoadingState();
    const loadingContent = document.querySelector('.loading-content h3');
    if (loadingContent) {
      loadingContent.textContent = 'Connecting to Gmail...';
    }
    
    // Get OAuth URL from backend
    const response = await fetch('/api/gmail/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get Gmail OAuth URL');
    }
    
    // Redirect to Gmail OAuth
    window.location.href = result.authUrl;
    
  } catch (error) {
    console.error('❌ Gmail connection error:', error);
    showError(`Failed to connect Gmail: ${error.message}`);
  }
}

// 🌐 GLOBAL FUNCTIONS (for onclick handlers)
window.toggleEmailSelection = toggleEmailSelection;
window.archiveEmail = archiveEmail;
window.snoozeEmail = snoozeEmail;
window.markImportant = markImportant;
window.replyToEmail = replyToEmail;
window.giveFeedback = giveFeedback;
window.giveTrainingFeedback = giveTrainingFeedback; 