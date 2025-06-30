// 🔥 HOMEOPS DECODER - Premium Email Intelligence Engine
// Three-Step UX Flow: Gmail Connect → Training → Full Decoder
// Apple/Superhuman aesthetic with purple gradient branding

console.log('🚀 HomeOps Decoder loaded - Premium UX Flow v3.0');

// Global state
let decodedEmails = [];
let filteredEmails = [];
let selectedEmails = new Set();
let currentCategory = 'all';
let isProcessing = false;
let searchQuery = '';
let currentStep = 1; // 1: Gmail Connect, 2: Training, 3: Full Decoder
let trainingEmails = [];
let trainingProgress = 0;

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

// Sample training emails
const SAMPLE_TRAINING_EMAILS = [
  {
    id: 'training-1',
    sender: 'Woods Academy',
    subject: 'Picture Day - October 15th at 9 AM',
    body: 'Dear Parents, Picture day is scheduled for October 15th at 9 AM. Please ensure your child brings the photo form. Location: Main Hall. Please arrive 10 minutes early.',
    category: 'family',
    priority: 'medium',
    suggestedAction: 'Add to calendar and prepare photo form'
  },
  {
    id: 'training-2',
    sender: 'Honest Company',
    subject: '15% off sitewide + free shipping today only!',
    body: 'You\'ve purchased from us 4 times this year. Today only: 15% off everything + free shipping on orders over $35. Your favorite diapers are back in stock!',
    category: 'commerce',
    priority: 'low',
    suggestedAction: 'Reorder diapers if needed'
  },
  {
    id: 'training-3',
    sender: 'Dr. Sarah Johnson',
    subject: 'Appointment Reminder - Tomorrow at 2 PM',
    body: 'This is a reminder for your annual checkup tomorrow at 2 PM. Please arrive 15 minutes early to complete paperwork. Location: 123 Medical Center Dr.',
    category: 'schedule',
    priority: 'high',
    suggestedAction: 'Confirm appointment and set reminder'
  },
  {
    id: 'training-4',
    sender: 'Amazon',
    subject: 'Your order #12345 has shipped',
    body: 'Your recent order containing "Wireless Headphones" has shipped and will arrive tomorrow. Track your package here.',
    category: 'commerce',
    priority: 'low',
    suggestedAction: 'Track package delivery'
  }
];

// 🎯 INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 Initializing HomeOps Decoder...');
  
  // Check if dashboard view is already active
  const dashboardView = document.getElementById('dashboard-view');
  if (dashboardView && dashboardView.classList.contains('active')) {
    console.log('🎯 Dashboard view already active, initializing immediately');
    initializeDecoder();
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
  
  // Setup event listeners
  setupEventListeners();
  
  // Determine current step and show appropriate state
  determineCurrentStep();
}

function setupEventListeners() {
  console.log('🎛️ Setting up event listeners...');
  
  // Gmail connection
  document.querySelector('.gmail-connect-btn')?.addEventListener('click', connectGmail);
  
  // Training mode
  document.getElementById('complete-training-btn')?.addEventListener('click', completeTraining);
  
  // Full decoder actions
  document.getElementById('refresh-btn')?.addEventListener('click', refreshEmails);
  document.getElementById('process-btn')?.addEventListener('click', processEmails);
  document.getElementById('process-again-btn')?.addEventListener('click', processEmails);
  
  // Search functionality
  const searchInput = document.getElementById('decoder-search');
  const searchClear = document.getElementById('decoder-search-clear');
  
  if (searchInput && searchClear) {
    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);
  }
  
  // Category tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.category));
  });
  
  // Bottom action bar
  document.getElementById('bulk-archive')?.addEventListener('click', bulkArchive);
  document.getElementById('bulk-snooze')?.addEventListener('click', bulkSnooze);
  document.getElementById('bulk-mark-important')?.addEventListener('click', bulkMarkImportant);
}

// 🎯 STEP MANAGEMENT
function determineCurrentStep() {
  console.log('🔍 Determining current step...');
  
  const userId = getCurrentUserId();
  const hasGmailConnected = localStorage.getItem(`gmail_connected_${userId}`);
  const hasCompletedTraining = localStorage.getItem(`training_completed_${userId}`);
  
  if (!hasGmailConnected) {
    console.log('📧 Step 1: Gmail not connected');
    showStep1GmailConnect();
  } else if (!hasCompletedTraining) {
    console.log('🎓 Step 2: Gmail connected but training not completed');
    showStep2Training();
  } else {
    console.log('🚀 Step 3: Full decoder ready');
    showStep3FullDecoder();
  }
}

function showStep1GmailConnect() {
  console.log('📧 Showing Step 1: Gmail Connect');
  currentStep = 1;
  hideAllSteps();
  
  const step1Container = document.getElementById('step1-gmail-connect');
  if (step1Container) {
    step1Container.style.display = 'flex';
  }
  
  // Hide navigation elements
  hideDecoderControls();
}

function showStep2Training() {
  console.log('🎓 Showing Step 2: Training Mode');
  currentStep = 2;
  hideAllSteps();
  
  const step2Container = document.getElementById('step2-training');
  if (step2Container) {
    step2Container.style.display = 'block';
  }
  
  // Initialize training
  initializeTraining();
  
  // Hide navigation elements
  hideDecoderControls();
}

function showStep3FullDecoder() {
  console.log('🚀 Showing Step 3: Full Decoder');
  currentStep = 3;
  hideAllSteps();
  
  const step3Container = document.getElementById('step3-full-decoder');
  if (step3Container) {
    step3Container.style.display = 'block';
  }
  
  // Show navigation elements
  showDecoderControls();
  
  // Check for existing emails
  checkExistingEmails();
}

function hideAllSteps() {
  const steps = ['step1-gmail-connect', 'step2-training', 'step3-full-decoder'];
  steps.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
}

function hideDecoderControls() {
  const controls = ['command-bar', 'category-tabs', 'bottom-actions'];
  controls.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
}

function showDecoderControls() {
  const controls = ['command-bar', 'category-tabs'];
  controls.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'flex';
  });
}

// 📧 STEP 1: GMAIL CONNECTION
async function connectGmail() {
  console.log('📧 Connecting Gmail...');
  
  try {
    const userId = getCurrentUserId();
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.authUrl) {
        // Store connection status
        localStorage.setItem(`gmail_connected_${userId}`, 'true');
        
        // Redirect to Gmail OAuth
        window.location.href = data.authUrl;
      }
    } else {
      throw new Error('Failed to get auth URL');
    }
  } catch (error) {
    console.error('❌ Gmail connection error:', error);
    showError('Failed to connect Gmail. Please try again.');
  }
}

// 🎓 STEP 2: TRAINING MODE
function initializeTraining() {
  console.log('🎓 Initializing training mode...');
  
  trainingEmails = [...SAMPLE_TRAINING_EMAILS];
  trainingProgress = 0;
  
  renderTrainingCards();
  updateTrainingProgress();
}

function renderTrainingCards() {
  console.log('🎨 Rendering training cards...');
  
  const container = document.getElementById('training-cards');
  if (!container) return;
  
  container.innerHTML = '';
  
  trainingEmails.forEach((email, index) => {
    const card = createTrainingCard(email, index);
    container.appendChild(card);
  });
}

function createTrainingCard(email, index) {
  const card = document.createElement('div');
  card.className = 'training-card';
  card.dataset.emailId = email.id;
  
  const category = CATEGORIES[email.category];
  
  card.innerHTML = `
    <div class="training-card-header">
      <div class="training-card-icon">
        <i data-lucide="${category.icon}"></i>
      </div>
      <div>
        <div class="training-card-title">${category.label}</div>
        <div class="training-card-subtitle">${category.description}</div>
      </div>
    </div>
    
    <div class="training-card-content">
      <div class="training-email-preview">
        <div class="training-email-sender">${email.sender}</div>
        <div class="training-email-subject">${email.subject}</div>
        <div class="training-email-body">${email.body}</div>
      </div>
      
      <div class="training-feedback-options">
        <button class="feedback-option" data-feedback="accurate">Accurate</button>
        <button class="feedback-option" data-feedback="inaccurate">Inaccurate</button>
        <button class="feedback-option" data-feedback="unsure">Unsure</button>
      </div>
    </div>
    
    <div class="training-card-actions">
      <button class="training-action-btn secondary" onclick="skipTrainingEmail('${email.id}')">Skip</button>
      <button class="training-action-btn primary" onclick="submitTrainingFeedback('${email.id}')" disabled>Submit</button>
    </div>
  `;
  
  // Add event listeners for feedback options
  const feedbackOptions = card.querySelectorAll('.feedback-option');
  const submitBtn = card.querySelector('.training-action-btn.primary');
  
  feedbackOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      feedbackOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');
      // Enable submit button
      submitBtn.disabled = false;
    });
  });
  
  // Initialize Lucide icons for this card
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  return card;
}

function submitTrainingFeedback(emailId) {
  console.log('📝 Submitting training feedback for:', emailId);
  
  const card = document.querySelector(`[data-email-id="${emailId}"]`);
  const selectedFeedback = card.querySelector('.feedback-option.selected');
  
  if (!selectedFeedback) {
    showError('Please select a feedback option');
    return;
  }
  
  const feedback = selectedFeedback.dataset.feedback;
  
  // Mark card as completed
  card.classList.add('completed');
  
  // Store feedback
  const userId = getCurrentUserId();
  const feedbackKey = `training_feedback_${userId}_${emailId}`;
  localStorage.setItem(feedbackKey, feedback);
  
  // Update progress
  trainingProgress++;
  updateTrainingProgress();
  
  // Check if training is complete
  if (trainingProgress >= trainingEmails.length) {
    showCompleteTrainingButton();
  }
}

function skipTrainingEmail(emailId) {
  console.log('⏭️ Skipping training email:', emailId);
  
  const card = document.querySelector(`[data-email-id="${emailId}"]`);
  card.classList.add('completed');
  
  // Store skip feedback
  const userId = getCurrentUserId();
  const feedbackKey = `training_feedback_${userId}_${emailId}`;
  localStorage.setItem(feedbackKey, 'skipped');
  
  // Update progress
  trainingProgress++;
  updateTrainingProgress();
  
  // Check if training is complete
  if (trainingProgress >= trainingEmails.length) {
    showCompleteTrainingButton();
  }
}

function updateTrainingProgress() {
  const progressFill = document.getElementById('training-progress-fill');
  const progressText = document.getElementById('training-progress-text');
  
  if (progressFill && progressText) {
    const percentage = (trainingProgress / trainingEmails.length) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${trainingProgress} of ${trainingEmails.length}`;
  }
}

function showCompleteTrainingButton() {
  const completeBtn = document.getElementById('complete-training-btn');
  if (completeBtn) {
    completeBtn.style.display = 'inline-flex';
  }
}

function completeTraining() {
  console.log('✅ Completing training...');
  
  const userId = getCurrentUserId();
  localStorage.setItem(`training_completed_${userId}`, 'true');
  
  // Move to Step 3
  showStep3FullDecoder();
}

// 🚀 STEP 3: FULL DECODER ENGINE
function checkExistingEmails() {
  console.log('🔍 Checking for existing emails...');
  
  const userId = getCurrentUserId();
  if (userId) {
    loadExistingEmails(userId);
  } else {
    showZeroState();
  }
}

async function loadExistingEmails(userId) {
  try {
    const response = await fetch(`/api/emails/${userId}`);
    if (response.ok) {
      const emails = await response.json();
      if (emails.length > 0) {
        decodedEmails = emails;
        showEmailCards();
      } else {
        showZeroState();
      }
    } else {
      showZeroState();
    }
  } catch (error) {
    console.error('❌ Error loading emails:', error);
    showZeroState();
  }
}

function showZeroState() {
  console.log('📭 Showing zero state...');
  
  const zeroState = document.getElementById('zero-state');
  const emailCardsContainer = document.getElementById('email-cards-container');
  
  if (zeroState) zeroState.style.display = 'flex';
  if (emailCardsContainer) emailCardsContainer.style.display = 'none';
  
  updateCategoryCounts();
}

function showEmailCards() {
  console.log('📧 Showing email cards...');
  
  const zeroState = document.getElementById('zero-state');
  const emailCardsContainer = document.getElementById('email-cards-container');
  
  if (zeroState) zeroState.style.display = 'none';
  if (emailCardsContainer) emailCardsContainer.style.display = 'grid';
  
  renderEmailCards();
}

function renderEmailCards() {
  console.log('🎨 Rendering email cards...');
  
  const container = document.getElementById('email-cards-container');
  if (!container) return;
  
  const emailsToRender = filteredEmails.length > 0 ? filteredEmails : decodedEmails;
  
  if (emailsToRender.length === 0) {
    showZeroState();
    return;
  }
  
  container.innerHTML = '';
  
  emailsToRender.forEach(email => {
    const card = createEmailCard(email);
    container.appendChild(card);
  });
  
  updateCategoryCounts();
}

function createEmailCard(email) {
  const card = document.createElement('div');
  card.className = 'email-card';
  card.dataset.emailId = email.id;
  
  const category = CATEGORIES[email.category] || CATEGORIES.urgent;
  
  card.innerHTML = `
    <div class="email-card-header">
      <div class="email-card-icon" style="background: ${category.color}20; color: ${category.color};">
        <i data-lucide="${category.icon}"></i>
      </div>
      <div class="email-card-meta">
        <div class="email-sender">${email.sender}</div>
        <div class="email-time">${formatTime(email.timestamp)}</div>
      </div>
      <div class="email-priority ${email.priority}">${email.priority}</div>
    </div>
    
    <div class="email-card-content">
      <div class="email-subject">${email.subject}</div>
      <div class="email-preview">${email.preview}</div>
    </div>
    
    <div class="email-card-actions">
      <button class="action-btn secondary" onclick="archiveEmail('${email.id}')">
        <i data-lucide="archive"></i>
        Archive
      </button>
      <button class="action-btn primary" onclick="replyToEmail('${email.id}')">
        <i data-lucide="reply"></i>
        Reply
      </button>
    </div>
  `;
  
  // Initialize Lucide icons for this card
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  return card;
}

// 🔍 SEARCH AND FILTERING
function handleSearch() {
  const searchInput = document.getElementById('decoder-search');
  const searchClear = document.getElementById('decoder-search-clear');
  
  if (searchInput && searchClear) {
    searchQuery = searchInput.value.toLowerCase();
    searchClear.style.display = searchQuery ? 'flex' : 'none';
    
    // Filter emails
    if (searchQuery) {
      filteredEmails = decodedEmails.filter(email => 
        email.sender.toLowerCase().includes(searchQuery) ||
        email.subject.toLowerCase().includes(searchQuery) ||
        email.preview.toLowerCase().includes(searchQuery)
      );
    } else {
      filteredEmails = [];
    }
    
    renderEmailCards();
  }
}

function clearSearch() {
  const searchInput = document.getElementById('decoder-search');
  const searchClear = document.getElementById('decoder-search-clear');
  
  if (searchInput && searchClear) {
    searchInput.value = '';
    searchClear.style.display = 'none';
    searchQuery = '';
    filteredEmails = [];
    renderEmailCards();
    searchInput.focus();
  }
}

function switchCategory(category) {
  console.log('🔄 Switching to category:', category);
  
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
  
  currentCategory = category;
  
  // Filter emails by category
  if (category === 'all') {
    filteredEmails = [];
  } else {
    filteredEmails = decodedEmails.filter(email => email.category === category);
  }
  
  renderEmailCards();
}

function updateCategoryCounts() {
  const emails = filteredEmails.length > 0 ? filteredEmails : decodedEmails;
  
  const counts = {
    all: emails.length,
    urgent: emails.filter(e => e.category === 'urgent').length,
    schedule: emails.filter(e => e.category === 'schedule').length,
    family: emails.filter(e => e.category === 'family').length,
    commerce: emails.filter(e => e.category === 'commerce').length
  };
  
  Object.entries(counts).forEach(([category, count]) => {
    const countElement = document.getElementById(`count-${category}`);
    if (countElement) {
      countElement.textContent = count;
    }
  });
}

// 📧 EMAIL PROCESSING
async function processEmails() {
  if (isProcessing) return;
  
  console.log('🔄 Processing emails...');
  isProcessing = true;
  
  const processBtn = document.getElementById('process-btn');
  if (processBtn) {
    processBtn.classList.add('processing');
    processBtn.innerHTML = '<i data-lucide="loader-2" class="spinning"></i> Processing...';
  }
  
  try {
    const userId = getCurrentUserId();
    const response = await fetch('/api/process-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (response.ok) {
      const result = await response.json();
      decodedEmails = result.emails || [];
      showEmailCards();
      showSuccess(`Processed ${decodedEmails.length} emails successfully!`);
    } else {
      throw new Error('Failed to process emails');
    }
  } catch (error) {
    console.error('❌ Email processing error:', error);
    showError('Failed to process emails. Please try again.');
  } finally {
    isProcessing = false;
    
    if (processBtn) {
      processBtn.classList.remove('processing');
      processBtn.innerHTML = '<i data-lucide="play"></i> Process Emails';
    }
  }
}

async function refreshEmails() {
  console.log('🔄 Refreshing emails...');
  await processEmails();
}

// 🎛️ EMAIL ACTIONS
async function archiveEmail(emailId) {
  console.log('📦 Archiving email:', emailId);
  
  try {
    const response = await fetch(`/api/emails/${emailId}/archive`, { method: 'POST' });
    if (response.ok) {
      decodedEmails = decodedEmails.filter(e => e.id !== emailId);
      renderEmailCards();
      showSuccess('Email archived successfully');
    }
  } catch (error) {
    console.error('❌ Archive error:', error);
    showError('Failed to archive email');
  }
}

async function replyToEmail(emailId) {
  console.log('💬 Replying to email:', emailId);
  
  const email = decodedEmails.find(e => e.id === emailId);
  if (email) {
    // Open compose window or redirect to Gmail
    window.open(`https://mail.google.com/mail/u/0/#compose?to=${encodeURIComponent(email.sender)}&subject=${encodeURIComponent('Re: ' + email.subject)}`);
  }
}

async function bulkArchive() {
  console.log('📦 Bulk archiving emails...');
  
  if (selectedEmails.size === 0) {
    showError('No emails selected');
    return;
  }
  
  try {
    const response = await fetch('/api/emails/bulk-archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailIds: Array.from(selectedEmails) })
    });
    
    if (response.ok) {
      decodedEmails = decodedEmails.filter(e => !selectedEmails.has(e.id));
      selectedEmails.clear();
      renderEmailCards();
      updateSelectionUI();
      showSuccess(`Archived ${selectedEmails.size} emails`);
    }
  } catch (error) {
    console.error('❌ Bulk archive error:', error);
    showError('Failed to archive emails');
  }
}

async function bulkSnooze() {
  console.log('⏰ Bulk snoozing emails...');
  showError('Snooze functionality coming soon');
}

async function bulkMarkImportant() {
  console.log('⭐ Bulk marking emails as important...');
  showError('Mark important functionality coming soon');
}

// 🛠️ UTILITY FUNCTIONS
function getCurrentUserId() {
  // Get user ID from localStorage or generate a test one
  return localStorage.getItem('homeops_user_id') || 'test_user';
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function showSuccess(message) {
  console.log('✅ Success:', message);
  // You can implement a toast notification here
}

function showError(message) {
  console.error('❌ Error:', message);
  // You can implement a toast notification here
}

function retryFromError() {
  console.log('🔄 Retrying from error...');
  determineCurrentStep();
}

// 🎯 VIEW ACTIVATION HANDLER
function onDashboardViewActivated() {
  console.log('🎯 Dashboard view activated, initializing decoder...');
  initializeDecoder();
}

// Export for global access
window.onDashboardViewActivated = onDashboardViewActivated;
window.connectGmail = connectGmail;
window.completeTraining = completeTraining;
window.processEmails = processEmails;
window.refreshEmails = refreshEmails;
window.archiveEmail = archiveEmail;
window.replyToEmail = replyToEmail;
window.bulkArchive = bulkArchive;
window.bulkSnooze = bulkSnooze;
window.bulkMarkImportant = bulkMarkImportant;
window.retryFromError = retryFromError;
window.submitTrainingFeedback = submitTrainingFeedback;
window.skipTrainingEmail = skipTrainingEmail; 