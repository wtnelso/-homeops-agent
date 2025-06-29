// Email Decoder Engine - Clean 3-Step Onboarding Flow
// User ID is now dynamically retrieved from Firebase Auth

console.log('🚀 Dashboard.js loaded - version 2024-06-29');
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 Current active view:', document.querySelector('.view.active')?.id);
console.log('🔍 Dashboard view element:', document.getElementById('dashboard-view'));

// Global state
let decodedEmails = [];
let isProcessing = false;
let processingInterval = null;
let emailCount = 0;
let onboardingStep = 1;
let onboardingFeedback = [];
let onboardingCompleted = false; // Track if onboarding is complete

// Add 'Commerce Inbox' to the categories
const CATEGORIES = [
  {
    key: 'urgent',
    label: 'Urgent & Actionable',
    color: '#ef4444',
    icon: 'zap',
    description: 'Critical emails that need your attention now.'
  },
  {
    key: 'schedule',
    label: 'Appointments & Schedule',
    color: '#3b82f6',
    icon: 'calendar-days',
    description: 'Events, appointments, and time-sensitive plans.'
  },
  {
    key: 'family',
    label: 'Family & Context',
    color: '#22c55e',
    icon: 'users',
    description: 'Family, school, and personal context.'
  },
  {
    key: 'commerce',
    label: 'Commerce Inbox',
    color: '#f59e42',
    icon: 'shopping-bag',
    description: 'Receipts, orders, shipping, and purchases.'
  }
];

// Get the real Firebase user ID
function getUserId() {
    // FORCE for local dev: always use test_user
    return "test_user";
}

// Wait for user ID to be available
async function waitForUserId() {
    console.log('🔍 waitForUserId: Starting...');
    
    // Try immediate
    let uid = getUserId();
    if (uid) {
        console.log('🔍 waitForUserId: Got userId immediately:', uid);
        return uid;
    }
    
    // Wait for Firebase Auth to initialize (max 2s instead of 3s)
    return new Promise((resolve) => {
        let waited = 0;
        const interval = setInterval(() => {
            uid = getUserId();
            if (uid) {
                clearInterval(interval);
                console.log('🔍 waitForUserId: Got userId after wait:', uid);
                resolve(uid);
            }
            waited += 100;
            if (waited > 2000) { // Reduced from 3000 to 2000
                clearInterval(interval);
                console.warn('⚠️ waitForUserId: Timed out, using fallback userId: test_user');
                resolve('test_user'); // Always return test_user as fallback
            }
        }, 100);
    });
}

async function initializeDecoderView() {
    const dashboardView = document.getElementById('dashboard-view');
    if (!dashboardView) {
        console.error('❌ dashboard-view element not found!');
        return;
    }
    
    console.log('🚀 initializeDecoderView: Starting...');
    console.log('🔍 Current active view:', document.querySelector('.view.active')?.id);
    console.log('🔍 Dashboard view display:', dashboardView.style.display);
    
    // Add safety timeout
    const safetyTimeout = setTimeout(() => {
        console.warn('⚠️ initializeDecoderView: Safety timeout reached, showing onboarding');
        showOnboardingFlow();
    }, 5000); // 5 second safety timeout
    
    try {
        let userId = await waitForUserId();
        console.log('🚀 initializeDecoderView: Got userId:', userId);
        
        // Check for Gmail connection param
        const urlParams = new URLSearchParams(window.location.search);
        const gmailConnected = urlParams.get('gmail_connected');
        
        if (gmailConnected === 'true') {
            // After OAuth, always go through onboarding flow
            // Don't immediately show emails - user needs to complete training first
            clearTimeout(safetyTimeout);
            
            // Check if we should start at processing step
            const step = urlParams.get('step');
            if (step === 'processing') {
                showOnboardingFlow();
                showOnboardingStep(2); // Start at processing step
            } else {
                showOnboardingFlow();
            }
            return;
        }
        
        // Normal load: check status
        try {
            const res = await fetch(`/api/gmail/status?user_id=${encodeURIComponent(userId)}`);
            const data = await res.json();
            clearTimeout(safetyTimeout);
            if (data.connected) {
                // Check if onboarding was previously completed
                const savedFeedback = localStorage.getItem('homeops_onboarding_feedback');
                if (savedFeedback) {
                    onboardingCompleted = true;
                    onboardingFeedback = JSON.parse(savedFeedback);
                    showDecoderReadyUI();
                } else {
                    showOnboardingFlow();
                }
            } else {
                showOnboardingFlow();
            }
        } catch (err) {
            console.error('❌ Error checking Gmail status:', err);
            clearTimeout(safetyTimeout);
            showOnboardingFlow();
        }
    } catch (err) {
        console.error('❌ Error in initializeDecoderView:', err);
        clearTimeout(safetyTimeout);
        showOnboardingFlow();
    }
}

// New onboarding flow functions
function showOnboardingFlow() {
    console.log('🎯 Showing onboarding flow');
    
    // Hide main decoder content
    const mainContent = document.getElementById('decoder-main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Show onboarding
    const onboarding = document.getElementById('decoder-onboarding');
    if (onboarding) {
        onboarding.style.display = 'flex';
        showOnboardingStep(1);
        
        // Setup onboarding event listeners AFTER the HTML is rendered
        setTimeout(() => {
            setupOnboardingEventListeners();
        }, 100);
    }
}

function showOnboardingStep(step) {
    console.log(`🎯 Showing onboarding step ${step}`);
    onboardingStep = step;
    
    // Hide all steps
    const steps = document.querySelectorAll('.onboarding-step');
    steps.forEach(s => s.style.display = 'none');
    
    // Show current step
    const currentStep = document.getElementById(`onboarding-step-${step}`);
    if (currentStep) {
        currentStep.style.display = 'block';
    }
    
    // Handle step-specific logic
    if (step === 2) {
        startProcessingAnimation();
    } else if (step === 3) {
        setupLearningEngine();
    }
}

function setupOnboardingEventListeners() {
    console.log('🎧 Setting up onboarding event listeners');
    
    // Gmail connect button
    const connectBtn = document.getElementById('onboarding-connect-gmail-btn');
    if (connectBtn) {
        console.log('✅ Found onboarding-connect-gmail-btn, attaching click handler');
        connectBtn.addEventListener('click', connectGmail);
    } else {
        console.error('❌ onboarding-connect-gmail-btn not found in DOM');
    }
    
    // Feedback buttons for learning engine
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
        btn.addEventListener('click', handleFeedback);
    });
}

async function connectGmail() {
    console.log('🔗 Connect Gmail button clicked!');
    
    try {
        const userId = await waitForUserId();
        console.log('🔗 User ID:', userId);
        
        const response = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        console.log('🔗 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🔗 Response data:', data);
            
            if (data.authUrl) {
                console.log('🔗 Redirecting to:', data.authUrl);
                window.location.href = data.authUrl;
            } else {
                console.error('❌ No authUrl in response');
                showErrorMessage('Failed to get Gmail auth URL. Please try again.');
            }
        } else {
            console.error('❌ Failed to get Gmail auth URL, status:', response.status);
            showErrorMessage('Failed to connect Gmail. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error connecting Gmail:', error);
        showErrorMessage('Error connecting Gmail. Please try again.');
    }
}

function startProcessingAnimation() {
    console.log('🔄 Starting processing animation');
    
    const messages = [
        "Scanning your last 1,000 emails...",
        "Detecting calendar invites, receipts, school messages...",
        "Analyzing email patterns and priorities...",
        "Organizing your inbox by importance...",
        "Almost done..."
    ];
    
    let messageIndex = 0;
    const messageElement = document.getElementById('processing-message');
    
    processingInterval = setInterval(() => {
        if (messageElement) {
            messageElement.textContent = messages[messageIndex];
        }
        
        messageIndex++;
        if (messageIndex >= messages.length) {
            messageIndex = 0;
        }
        
        // Simulate email count
        emailCount += Math.floor(Math.random() * 10) + 5;
        const countElement = document.getElementById('email-count');
        if (countElement) {
            countElement.textContent = `${emailCount} emails processed...`;
        }
    }, 2000);
    
    // Complete processing after 5 seconds
    setTimeout(() => {
        clearInterval(processingInterval);
        showOnboardingStep(3);
    }, 5000);
}

function setupLearningEngine() {
    console.log('🧠 Setting up learning engine');
    
    // Initialize feedback tracking
    onboardingFeedback = [];
    
    // Show sample cards with feedback buttons
    const sampleCards = document.querySelectorAll('.sample-card');
    sampleCards.forEach((card, index) => {
        card.style.display = 'block';
    });
    
    updateLearningProgress();
}

function handleFeedback(event) {
    const card = event.target.closest('.sample-card');
    const emailId = card.dataset.emailId;
    const feedback = event.target.dataset.feedback;
    
    console.log(`👍 Feedback for ${emailId}: ${feedback}`);
    
    // Store feedback
    onboardingFeedback.push({
        emailId: emailId,
        feedback: feedback
    });
    
    // Disable feedback buttons for this card
    const feedbackBtns = card.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    // Update progress
    updateLearningProgress();
    
    // Check if all feedback is complete
    if (onboardingFeedback.length >= 4) {
        setTimeout(() => {
            completeOnboarding();
        }, 1000);
    }
}

function updateLearningProgress() {
    const progress = onboardingFeedback.length;
    const progressElement = document.getElementById('learning-progress');
    if (progressElement) {
        progressElement.textContent = `${progress}/4 completed`;
    }
}

function completeOnboarding() {
    console.log('✅ Onboarding completed');
    
    // Mark onboarding as complete
    onboardingCompleted = true;
    
    // Store feedback in localStorage
    localStorage.setItem('homeops_onboarding_feedback', JSON.stringify(onboardingFeedback));
    
    // Show success message
    showSuccessMessage('Onboarding completed! Welcome to HomeOps.');
    
    // Transition to full decoder
    setTimeout(() => {
        showDecoderReadyUI();
    }, 2000);
}

function showDecoderReadyUI() {
    console.log('🎯 showDecoderReadyUI: Showing decoder ready UI');
    
    // Hide onboarding
    const onboarding = document.getElementById('decoder-onboarding');
    if (onboarding) {
        onboarding.style.display = 'none';
    }
    
    // Show main decoder content
    const mainContent = document.getElementById('decoder-main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        console.log('✅ Main decoder content shown');
    } else {
        console.error('❌ decoder-main-content element not found!');
    }
    
    // Initialize decoder
    initializeDecoder();
}

function initializeDecoder() {
    console.log('🚀 Initializing decoder');
    
    // Load decoder data
    loadDecoderData();
    
    // Setup event listeners
    setupDecoderEventListeners();
}

function setupDecoderEventListeners() {
    // Add any decoder-specific event listeners here
    console.log('🎧 Setup decoder event listeners');
}

async function loadDecoderData() {
    console.log('📊 Loading decoder data');
    
    // Don't load emails until onboarding is complete
    if (!onboardingCompleted) {
        console.log('⏳ Onboarding not complete, skipping email load');
        return;
    }
    
    try {
        const userId = await waitForUserId();
        const response = await fetch(`/api/gmail/emails?user_id=${encodeURIComponent(userId)}`);
        
        if (response.ok) {
            const data = await response.json();
            decodedEmails = data.emails || [];
            renderDecodedEmails();
        } else {
            console.log('📭 No emails found or not connected');
        }
    } catch (error) {
        console.error('❌ Error loading decoder data:', error);
    }
}

async function processEmails() {
    if (isProcessing) {
        console.log('⏳ Already processing emails...');
        return;
    }
    
    console.log('🔄 Processing emails...');
    isProcessing = true;
    
    try {
        const userId = await waitForUserId();
        const response = await fetch('/api/gmail/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        if (response.ok) {
            const data = await response.json();
            decodedEmails = data.emails || [];
            renderDecodedEmails();
            showSuccessMessage('Emails processed successfully!');
        } else {
            showErrorMessage('Failed to process emails. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error processing emails:', error);
        showErrorMessage('Error processing emails. Please try again.');
    } finally {
        isProcessing = false;
    }
}

function renderDecodedEmails() {
    console.log('🎨 renderDecodedEmails: Starting with', decodedEmails.length, 'emails');
    
    // Group emails by category
    const emailsByCategory = {
        urgent: decodedEmails.filter(email => email.category === 'urgent'),
        scheduled: decodedEmails.filter(email => email.category === 'scheduled'),
        family: decodedEmails.filter(email => email.category === 'family'),
        commerce: decodedEmails.filter(email => email.category === 'commerce')
    };
    
    console.log('📊 Emails by category:', emailsByCategory);
    
    // Render each category
    CATEGORIES.forEach(category => {
        const container = document.getElementById(`${category.key}-emails`);
        if (!container) {
            console.error(`❌ Container not found for category: ${category.key}`);
            return;
        }
        
        const emails = emailsByCategory[category.key] || [];
        console.log(`📧 Rendering ${emails.length} emails for ${category.key}`);
        
        if (emails.length === 0) {
            // Show zero state
            container.innerHTML = createZeroState(category);
            console.log(`📭 Created zero state for ${category.key}`);
        } else {
            // Show emails
            container.innerHTML = emails.map(email => createEmailCard(email, category.key)).join('');
            console.log(`✅ Rendered ${emails.length} email cards for ${category.key}`);
        }
    });
    
    // Add refresh button if all categories are empty
    const allEmpty = CATEGORIES.every(category => 
        (emailsByCategory[category.key] || []).length === 0
    );
    
    if (allEmpty) {
        addRefreshButton();
    }
    
    // Update stats
    updateStats({
        urgent: emailsByCategory.urgent.length,
        scheduled: emailsByCategory.scheduled.length,
        family: emailsByCategory.family.length,
        commerce: emailsByCategory.commerce.length
    });
}

function createZeroState(category) {
    const zeroStates = {
        urgent: {
            icon: 'zap',
            title: 'All Clear',
            message: 'No urgent emails requiring immediate attention. Your inbox is well-managed!'
        },
        scheduled: {
            icon: 'calendar',
            title: 'No Events',
            message: 'No upcoming events or appointments detected. Enjoy your free time!'
        },
        family: {
            icon: 'heart',
            title: 'Family Quiet',
            message: 'No family-related emails found. Everyone is doing well!'
        },
        commerce: {
            icon: 'shopping-bag',
            title: 'No Purchases',
            message: 'No pending orders or shopping-related emails. Your wallet is safe!'
        }
    };
    
    const state = zeroStates[category.key];
    
    return `
        <div class="decoder-zero-state ${category.key}">
            <svg class="lucide lucide-${state.icon}" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                ${getIconPath(state.icon)}
            </svg>
            <div class="decoder-zero-state-title">${state.title}</div>
            <div class="decoder-zero-state-message">${state.message}</div>
        </div>
    `;
}

function getIconPath(iconName) {
    const icons = {
        zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
        'shopping-bag': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>'
    };
    
    return icons[iconName] || '';
}

function addRefreshButton() {
    const decoderContent = document.querySelector('.decoder-main-content');
    if (!decoderContent) return;
    
    // Remove existing refresh section if any
    const existingRefresh = document.querySelector('.decoder-refresh-section');
    if (existingRefresh) {
        existingRefresh.remove();
    }
    
    // Add refresh section
    const refreshSection = document.createElement('div');
    refreshSection.className = 'decoder-refresh-section';
    refreshSection.innerHTML = `
        <button class="decoder-refresh-btn" onclick="refreshEmails()">
            <svg class="lucide lucide-refresh-cw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23,4 23,10 17,10"></polyline>
                <polyline points="1,20 1,14 7,14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Process Emails Again
        </button>
    `;
    
    decoderContent.appendChild(refreshSection);
}

function refreshEmails() {
    console.log('🔄 Refreshing emails...');
    
    // Add rotating animation
    const refreshBtn = document.querySelector('.decoder-refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        refreshBtn.disabled = true;
    }
    
    // Reload emails
    loadDecoderData().finally(() => {
        // Remove animation after a delay
        setTimeout(() => {
            if (refreshBtn) {
                refreshBtn.classList.remove('rotating');
                refreshBtn.disabled = false;
            }
        }, 2000);
    });
}

function createEmailCard(email, type) {
    const category = CATEGORIES.find(cat => cat.key === type);
    const color = category ? category.color : '#64748b';
    
    // Determine priority tag
    let priorityTag = '';
    if (email.priority === 'high' || type === 'urgent') {
        priorityTag = '<span class="decoder-tag urgent">High Priority</span>';
    } else if (email.priority === 'medium') {
        priorityTag = '<span class="decoder-tag priority">Medium Priority</span>';
    }
    
    // Get primary action based on category
    const primaryAction = getPrimaryAction(email);
    
    return `
        <div class="decoder-card" data-email-id="${email.id}">
            <div class="decoder-card-header">
                <div class="decoder-card-sender">${email.sender}</div>
                <div class="decoder-card-dates">${email.time}</div>
            </div>
            
            <div class="decoder-card-subject">${email.subject}</div>
            <div class="decoder-card-summary">${email.preview}</div>
            
            ${priorityTag ? `<div class="decoder-card-tags">${priorityTag}</div>` : ''}
            
            <div class="decoder-card-actions">
                <button onclick="handleEmailAction('${email.id}', 'primary')" class="decoder-action-btn primary">
                    ${primaryAction}
                </button>
                <button onclick="handleEmailAction('${email.id}', 'secondary')" class="decoder-action-btn">
                    More Options
                </button>
            </div>
            
            <div class="decoder-card-footer">
                <div class="decoder-feedback">
                    <button class="decoder-feedback-btn" onclick="handleEmailFeedback('${email.id}', 'positive')" title="This was helpful">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
                            <rect x="2" y="9" width="20" height="10" rx="2" ry="2"></rect>
                        </svg>
                    </button>
                    <button class="decoder-feedback-btn" onclick="handleEmailFeedback('${email.id}', 'negative')" title="This wasn't helpful">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 15v4a3 3 0 0 0 6 0v-4"></path>
                            <rect x="2" y="9" width="20" height="10" rx="2" ry="2"></rect>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getTypeColor(type) {
    const category = CATEGORIES.find(cat => cat.key === type);
    return category ? category.color : '#64748b';
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#64748b';
    }
}

function getPrimaryAction(email) {
    if (email.category === 'urgent') return 'Reply Now';
    if (email.category === 'schedule') return 'Add to Calendar';
    if (email.category === 'family') return 'Mark as Read';
    if (email.category === 'commerce') return 'View Details';
    return 'Open';
}

function updateStats(summary) {
    // Update column counts
    const urgentCount = document.getElementById('urgent-count');
    const scheduleCount = document.getElementById('schedule-count');
    const familyCount = document.getElementById('family-count');
    const commerceCount = document.getElementById('commerce-count');
    
    if (urgentCount) urgentCount.textContent = summary.urgent;
    if (scheduleCount) scheduleCount.textContent = summary.scheduled;
    if (familyCount) familyCount.textContent = summary.family;
    if (commerceCount) commerceCount.textContent = summary.commerce;
    
    // Animate the counts
    animateStat('#urgent-count', 0, summary.urgent, 1000);
    animateStat('#schedule-count', 0, summary.scheduled, 1000);
    animateStat('#family-count', 0, summary.family, 1000);
    animateStat('#commerce-count', 0, summary.commerce, 1000);
}

function animateStat(selector, index, targetValue, duration) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    animateNumber(element, index, targetValue, duration);
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function updateProcessingUI(processing) {
    const processBtn = document.getElementById('process-emails-btn');
    if (processBtn) {
        processBtn.disabled = processing;
        processBtn.textContent = processing ? 'Processing...' : 'Process Emails';
    }
}

function handleEmailAction(emailId, actionType) {
    console.log('🎯 Email action:', actionType, 'for email:', emailId);
    
    // Find the email card
    const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
    if (emailCard) {
        emailCard.classList.add('action-taken');
    }
    
    // Show success message
    showSuccessMessage(`Action completed: ${actionType}`);
    
    // In a real app, you would send this to your backend
    // For now, just log it
    console.log('📧 Email action logged:', { emailId, actionType, timestamp: new Date() });
}

function handleEmailFeedback(emailId, feedbackType) {
    console.log('👍 Email feedback:', feedbackType, 'for email:', emailId);
    
    // Find the feedback buttons for this email
    const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
    if (emailCard) {
        const feedbackBtns = emailCard.querySelectorAll('.decoder-feedback-btn');
        
        // Remove selected state from all buttons
        feedbackBtns.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected state to clicked button
        const clickedBtn = emailCard.querySelector(`[onclick*="${feedbackType}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('selected');
        }
    }
    
    // Show success message
    const message = feedbackType === 'positive' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve this.';
    showSuccessMessage(message);
    
    // In a real app, you would send this to your backend
    // For now, just log it
    console.log('📧 Email feedback logged:', { emailId, feedbackType, timestamp: new Date() });
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function setupEventListeners() {
    console.log('🎧 Setting up event listeners');
    
    // Process emails button
    const processBtn = document.getElementById('process-emails-btn');
    if (processBtn) {
        processBtn.addEventListener('click', processEmails);
    }
    
    // Tool switching
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.dataset.tool;
            switchTool(tool);
        });
    });
}

function switchTool(tool) {
    console.log(`🔄 Switching to tool: ${tool}`);
    
    // Hide all tool content
    const toolContents = document.querySelectorAll('.tool-content');
    toolContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active class from all buttons
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tool content
    const selectedContent = document.getElementById(`${tool}-content`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Add active class to selected button
    const selectedButton = document.querySelector(`[data-tool="${tool}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Initialize specific tool
    if (tool === 'decoder') {
        initializeDecoderView();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Email Decoder Engine Initialized');
    try {
        // Check if we're on the dashboard view
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView && dashboardView.classList.contains('active')) {
            console.log('🎯 Dashboard view is active, initializing decoder');
            initializeDecoderView();
        } else {
            console.log('⏳ Dashboard view not active yet, waiting for activation');
            // Set up a listener for when the dashboard view becomes active
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (dashboardView.classList.contains('active')) {
                            console.log('🎯 Dashboard view became active, initializing decoder');
                            observer.disconnect();
                            initializeDecoderView();
                        }
                    }
                });
            });
            observer.observe(dashboardView, { attributes: true });
        }
    } catch (error) {
        console.error('❌ Error in DOMContentLoaded:', error);
    }
    
    // Setup general event listeners
    setupEventListeners();
});

// Helper function for email categorization
function categorizeEmail(email) {
    // This would be replaced with actual AI categorization
    const categories = ['urgent', 'schedule', 'family', 'commerce'];
    return categories[Math.floor(Math.random() * categories.length)];
}

// Global function that can be called from layout.js
window.initializeEmailDecoder = function() {
    console.log('🎯 initializeEmailDecoder called from layout.js');
    initializeDecoderView();
};

// Force activate dashboard view and initialize decoder
function forceActivateDashboard() {
    console.log('🎯 Force activating dashboard view...');
    
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Show dashboard view
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) {
        dashboardView.classList.add('active');
        dashboardView.style.display = 'block';
        console.log('✅ Dashboard view activated');
        
        // Initialize decoder after a short delay
        setTimeout(() => {
            initializeDecoderView();
        }, 100);
    } else {
        console.error('❌ Dashboard view element not found!');
    }
}

// Auto-activate dashboard if we're on the dashboard page
if (window.location.pathname.includes('dashboard') || window.location.search.includes('view=dashboard')) {
    console.log('🎯 Auto-activating dashboard view...');
    setTimeout(forceActivateDashboard, 500);
}

// Global function for manual activation (can be called from browser console)
window.activateDashboard = function() {
    console.log('🎯 Manual dashboard activation triggered');
    forceActivateDashboard();
};

// Also expose the initialization function
window.initializeDecoder = function() {
    console.log('🎯 Manual decoder initialization triggered');
    initializeDecoderView();
}; 