// 🔥 HOMEOPS DECODER - Premium Email Intelligence Engine
// Apple/Superhuman aesthetic with purple gradient branding

console.log('🚀 HomeOps Decoder loaded - Premium UI v2.0');

// Global state
let decodedEmails = [];

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
  
  // Check if dashboard view is already active
  const dashboardView = document.getElementById('dashboard-view');
  if (dashboardView && dashboardView.classList.contains('active')) {
    console.log('🎯 Dashboard view already active, initializing immediately');
    initializeDecoder();
    setupEventListeners();
    checkInitialState();
  } else {
    console.log('🎯 Dashboard view not active, waiting for activation');
    // The initialization will happen when the dashboard view is activated
  }
});

// 🔧 INITIALIZATION FUNCTIONS
function initializeDecoder() {
  console.log('🔧 Setting up decoder components...');
  
  // Check if dashboard view is active
  const dashboardView = document.getElementById('dashboard-view');
  if (!dashboardView || dashboardView.style.display === 'none') {
    console.log('⚠️ Dashboard view not active, skipping initialization');
    return;
  }
  
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
  const loadingState = document.getElementById('loading-state');
  if (loadingState) {
    loadingState.style.display = 'flex';
  }
}

function showOnboardingState() {
  hideAllStates();
  const onboardingState = document.getElementById('onboarding-state');
  if (onboardingState) {
    onboardingState.style.display = 'flex';
    initializeWizard();
  }
}

function showZeroState() {
  hideAllStates();
  const zeroState = document.getElementById('zero-state');
  if (zeroState) {
    zeroState.style.display = 'flex';
  }
  updateCategoryCounts();
}

function showEmailCards() {
  hideAllStates();
  const emailCardsContainer = document.getElementById('email-cards-container');
  if (emailCardsContainer) {
    emailCardsContainer.style.display = 'grid';
  }
  renderEmailCards();
}

function showTrainingMode() {
  hideAllStates();
  const trainingMode = document.getElementById('training-mode');
  if (trainingMode) {
    trainingMode.style.display = 'block';
  }
  renderTrainingCards();
}

function hideAllStates() {
  const states = ['loading-state', 'onboarding-state', 'zero-state', 'email-cards-container', 'training-mode', 'error-state'];
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
  
  const emailsToRender = decodedEmails;
  
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
  
  // Only show training cards if we have real emails to train on
  if (!decodedEmails || decodedEmails.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <h3>No emails available for training</h3>
        <p>Please process your emails first to start training the decoder.</p>
        <button onclick="processEmails()" class="btn-primary" style="
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        ">Process Emails</button>
      </div>
    `;
    return;
  }
  
  // Use real emails for training (first 4 emails)
  const trainingEmails = decodedEmails.slice(0, 4);
  
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
      const emailsToSelect = decodedEmails;
  
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
    console.log('🔍 Calling email processing endpoint with user_id:', userId);
    const response = await fetch('/api/email-decoder/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response headers:', response.headers);
    
    clearInterval(messageInterval);
    
    const result = await response.json();
    console.log('🔍 Response result:', result);
    
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
        showError(result.error || 'Failed to process emails');
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
  console.log(`🎓 Training feedback: ${emailId} - ${feedback}`);
  
  // Mark the training card as completed
  const trainingCard = document.querySelector(`[data-training-id="${emailId}"]`);
  if (trainingCard) {
    trainingCard.style.opacity = '0.5';
    trainingCard.style.pointerEvents = 'none';
  }
  
  // Check if all training cards are completed
  const allTrainingCards = document.querySelectorAll('.training-card');
  const completedCards = document.querySelectorAll('.training-card[style*="opacity: 0.5"]');
  
  if (completedCards.length === allTrainingCards.length) {
    // All training completed - transition to full decoder
    setTimeout(() => {
      completeTraining();
    }, 1000);
  }
}

// Function to transition from training to full decoder
function completeTraining() {
  console.log('🎓 Training completed, transitioning to full decoder...');
  
  // Hide training mode
  const trainingMode = document.getElementById('training-mode');
  if (trainingMode) {
    trainingMode.style.display = 'none';
  }
  
  // Show the full decoder with the 4 categories
  showEmailCards();
  
  // Process real emails
  processEmails();
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
  
  // Hide all other states
  hideAllStates();
  
  // Show error state
  const errorState = document.getElementById('error-state');
  const errorMessage = document.getElementById('error-message');
  
  if (errorState && errorMessage) {
    errorMessage.textContent = message;
    errorState.style.display = 'flex';
  } else {
    // Fallback if error state doesn't exist
    console.error('Error state container not found');
  }
}

// Function to retry from error state
function retryFromError() {
  console.log('🔄 Retrying from error state...');
  
  // Hide error state
  const errorState = document.getElementById('error-state');
  if (errorState) {
    errorState.style.display = 'none';
  }
  
  // Try to process emails again
  processEmails();
}

// 🔍 GMAIL CONNECTION
async function checkGmailConnection() {
  try {
    const userId = getCurrentUserId();
    
    // Check if we just connected Gmail (from URL parameters)
    const gmailStep = sessionStorage.getItem('gmail_step');
    if (gmailStep === 'processing') {
      console.log('🎯 Gmail just connected, moving to processing step');
      sessionStorage.removeItem('gmail_step');
      showWizardStep(2); // Show processing step
      return;
    }
    
    // Show loading state while checking
    showLoadingState();
    
    const response = await fetch(`/api/gmail/status?user_id=${userId}`);
    
    if (response.ok) {
      const { connected } = await response.json();
      
      if (!connected) {
        // Show onboarding step 1: Gmail connection
        showOnboardingState();
      } else {
        // Gmail is connected, check if we have processed emails
        loadExistingEmails(userId);
      }
    } else {
      // If we can't check status, show onboarding
      showOnboardingState();
    }
  } catch (error) {
    console.error('❌ Error checking Gmail connection:', error);
    // If there's an error, show onboarding
    showOnboardingState();
  }
}

async function loadExistingEmails(userId) {
  try {
    const response = await fetch(`/api/email-decoder/emails?user_id=${userId}`);
    if (response.ok) {
      const result = await response.json();
      decodedEmails = result.emails || [];
      if (decodedEmails.length === 0) {
        // No emails found, show processing step instead of training mode
        showOnboardingState();
        showWizardStep(2); // Show processing step
      } else {
        showEmailCards();
      }
    } else {
      // If we can't load emails, show processing step
      showOnboardingState();
      showWizardStep(2); // Show processing step
    }
  } catch (error) {
    console.error('❌ Error loading existing emails:', error);
    showOnboardingState();
    showWizardStep(2); // Show processing step
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
window.connectGmail = connectGmail;
window.processEmailsFromWizard = processEmailsFromWizard;
window.initializeDecoder = initializeDecoder;
window.retryFromError = retryFromError;

// Global function to initialize decoder when dashboard view is activated
window.initializeDashboardDecoder = function() {
  console.log('🎯 Dashboard view activated, initializing decoder...');
  setTimeout(() => {
    initializeDecoder();
    setupEventListeners();
    checkInitialState();
  }, 100); // Small delay to ensure DOM is ready
};

// Debug function to check token status
window.debugTokens = async function() {
  try {
    const userId = getCurrentUserId();
    console.log('🔍 Debug: Checking tokens for user:', userId);
    
    const response = await fetch(`/api/gmail/debug-tokens?user_id=${userId}`);
    const result = await response.json();
    
    console.log('🔍 Debug result:', result);
    
    if (result.exists) {
      alert(`✅ Tokens found!\nAccess Token: ${result.tokenData.hasAccessToken}\nRefresh Token: ${result.tokenData.hasRefreshToken}\nExpiry: ${new Date(result.tokenData.expiryDate).toLocaleString()}`);
    } else {
      alert('❌ No tokens found');
    }
  } catch (error) {
    console.error('❌ Debug error:', error);
    alert('❌ Debug error: ' + error.message);
  }
};

// 🎯 WIZARD NAVIGATION FUNCTIONS
function showWizardStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.style.display = 'none';
    step.classList.remove('active');
  });
  
  // Show current step
  const currentStep = document.getElementById(`step-${stepNumber}`);
  if (currentStep) {
    currentStep.style.display = 'block';
    setTimeout(() => currentStep.classList.add('active'), 50);
  }
  
  // Update progress indicators
  updateProgressIndicator(stepNumber);
}

function updateProgressIndicator(currentStep) {
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressLines = document.querySelectorAll('.progress-line');
  
  progressSteps.forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNumber < currentStep) {
      step.classList.add('completed');
    } else if (stepNumber === currentStep) {
      step.classList.add('active');
    }
  });
  
  progressLines.forEach((line, index) => {
    const lineNumber = index + 1;
    line.classList.remove('completed');
    
    if (lineNumber < currentStep) {
      line.classList.add('completed');
    }
  });
}

// 🚀 ONBOARDING FLOW FUNCTIONS
function completeOnboarding() {
  console.log('✅ Onboarding completed');
  showWizardStep(4);
}

function finishOnboarding() {
  console.log('🎉 Onboarding finished - showing main decoder');
  hideAllStates();
  showEmailCards();
}

// Handle Process Emails button in wizard
function processEmailsFromWizard() {
  console.log('🚀 Processing emails from wizard...');
  processEmails().then(() => {
    // After processing, move to step 3 (review & train)
    showWizardStep(3);
  }).catch((error) => {
    console.error('❌ Error processing emails from wizard:', error);
    showError('Failed to process emails. Please try again.');
  });
}

// Override the existing connectGmail function to advance to step 2
const originalConnectGmail = window.connectGmail;
window.connectGmail = function() {
  console.log('🔗 Gmail connection initiated');
  // Call the original function
  if (originalConnectGmail) {
    originalConnectGmail();
  }
};

// Initialize wizard when onboarding state is shown
function initializeWizard() {
  console.log('🎯 Initializing onboarding wizard');
  showWizardStep(1);
}

// 🎯 STATE CONTAINERS */ 