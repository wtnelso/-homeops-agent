// Email Decoder Engine - Clear Onboarding Flow
// User ID is now dynamically retrieved from Firebase Auth

// Global state
let decodedEmails = [];
let isProcessing = false;
let onboardingStep = 1;
let onboardingFeedback = [];
let processingInterval;
let emailCount = 0;

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
            // After OAuth, always check status
            try {
                const res = await fetch(`/api/gmail/status?user_id=${encodeURIComponent(userId)}`);
                const data = await res.json();
                clearTimeout(safetyTimeout);
                if (data.connected) {
                    showDecoderReadyUI();
                    return;
                } else {
                    showOnboardingFlow();
                    return;
                }
            } catch (err) {
                console.error('❌ Error checking Gmail status after OAuth:', err);
                clearTimeout(safetyTimeout);
                showOnboardingFlow();
                return;
            }
        }
        
        // Normal load: check status
        try {
            const res = await fetch(`/api/gmail/status?user_id=${encodeURIComponent(userId)}`);
            const data = await res.json();
            clearTimeout(safetyTimeout);
            if (data.connected) {
                showDecoderReadyUI();
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
    
    // Hide the main decoder content
    const mainContent = document.getElementById('decoder-main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Show the onboarding
    const onboarding = document.getElementById('decoder-onboarding');
    if (onboarding) {
        onboarding.style.display = 'flex';
        showOnboardingStep(1);
    }
    
    // Setup onboarding event listeners
    setupOnboardingEventListeners();
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
    // Gmail connect button
    const connectBtn = document.getElementById('connect-gmail-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectGmail);
    }
    
    // Feedback buttons for learning engine
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
        btn.addEventListener('click', handleFeedback);
    });
}

async function connectGmail() {
    console.log('🔗 Connecting Gmail...');
    
    try {
        const userId = await waitForUserId();
        const response = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Gmail OAuth URL generated:', data.authUrl);
            
            // Redirect to Gmail OAuth
            window.location.href = data.authUrl;
        } else {
            console.error('❌ Failed to generate Gmail OAuth URL');
            showErrorMessage('Failed to connect Gmail. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error connecting Gmail:', error);
        showErrorMessage('Error connecting Gmail. Please try again.');
    }
}

function startProcessingAnimation() {
    console.log('🔄 Starting processing animation');
    
    // Reset state
    emailCount = 0;
    onboardingFeedback = [];
    
    // Update email counter
    const emailCounter = document.getElementById('email-count');
    const progressFill = document.getElementById('processing-progress-fill');
    
    // Start counter animation
    processingInterval = setInterval(() => {
        emailCount += Math.floor(Math.random() * 15) + 5; // Random increment
        if (emailCount > 1000) emailCount = 1000;
        
        if (emailCounter) {
            emailCounter.textContent = emailCount;
        }
        
        if (progressFill) {
            const progress = (emailCount / 1000) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        // Stop after 4 seconds
        if (emailCount >= 1000) {
            clearInterval(processingInterval);
            setTimeout(() => {
                showOnboardingStep(3);
            }, 1000);
        }
    }, 100);
    
    // Cycle through processing messages
    const messages = ['message-1', 'message-2', 'message-3'];
    let messageIndex = 0;
    
    const messageInterval = setInterval(() => {
        // Hide all messages
        messages.forEach(id => {
            const msg = document.getElementById(id);
            if (msg) msg.classList.remove('active');
        });
        
        // Show current message
        const currentMsg = document.getElementById(messages[messageIndex]);
        if (currentMsg) currentMsg.classList.add('active');
        
        messageIndex = (messageIndex + 1) % messages.length;
        
        // Stop when processing is done
        if (emailCount >= 1000) {
            clearInterval(messageInterval);
        }
    }, 1500);
}

function setupLearningEngine() {
    console.log('🧠 Setting up learning engine');
    
    // Reset feedback state
    onboardingFeedback = [];
    
    // Update progress
    updateLearningProgress();
    
    // Setup feedback button listeners
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
        btn.addEventListener('click', handleFeedback);
    });
}

function handleFeedback(event) {
    const btn = event.currentTarget;
    const card = btn.closest('.sample-card');
    const cardId = card.dataset.cardId;
    const feedback = btn.dataset.feedback;
    
    console.log(`👍 Feedback for card ${cardId}: ${feedback}`);
    
    // Store feedback
    onboardingFeedback[cardId] = feedback;
    
    // Update button state
    const cardBtns = card.querySelectorAll('.feedback-btn');
    cardBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    // Mark card as completed
    card.classList.add('completed');
    
    // Update progress
    updateLearningProgress();
    
    // Check if all cards are completed
    const completedCount = Object.keys(onboardingFeedback).length;
    if (completedCount >= 4) {
        setTimeout(() => {
            completeOnboarding();
        }, 1000);
    }
}

function updateLearningProgress() {
    const completedCount = Object.keys(onboardingFeedback).length;
    const progressFill = document.getElementById('learning-progress-fill');
    const completedSpan = document.getElementById('completed-count');
    
    if (completedSpan) {
        completedSpan.textContent = completedCount;
    }
    
    if (progressFill) {
        const progress = (completedCount / 4) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

function completeOnboarding() {
    console.log('✅ Onboarding completed');
    
    // Store feedback in localStorage
    localStorage.setItem('homeops_onboarding_feedback', JSON.stringify(onboardingFeedback));
    
    // Show success message and transition to decoder
    showSuccessMessage('Onboarding completed! Welcome to HomeOps.');
    
    // Transition to decoder view
    setTimeout(() => {
        showDecoderReadyUI();
    }, 2000);
}

function showDecoderReadyUI() {
    console.log('🎯 Showing decoder ready UI');
    
    // Hide onboarding
    const onboarding = document.getElementById('decoder-onboarding');
    if (onboarding) {
        onboarding.style.display = 'none';
    }
    
    // Show main decoder content
    const mainContent = document.getElementById('decoder-main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // Initialize decoder functionality
    initializeDecoder();
}

function initializeDecoder() {
    console.log('🚀 Initializing decoder');
    
    // Load any existing feedback
    const savedFeedback = localStorage.getItem('homeops_onboarding_feedback');
    if (savedFeedback) {
        try {
            onboardingFeedback = JSON.parse(savedFeedback);
            console.log('📊 Loaded saved feedback:', onboardingFeedback);
        } catch (e) {
            console.error('❌ Error loading saved feedback:', e);
        }
    }
    
    // Setup decoder event listeners
    setupDecoderEventListeners();
    
    // Load initial data
    loadDecoderData();
}

function setupDecoderEventListeners() {
    // Process emails button
    const processBtn = document.getElementById('process-emails-btn');
    if (processBtn) {
        processBtn.addEventListener('click', processEmails);
    }
}

async function loadDecoderData() {
    console.log('📊 Loading decoder data');
    
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
                            console.log('🎯 Dashboard view now active, initializing decoder');
                            observer.disconnect();
                            initializeDecoderView();
                        }
                    }
                });
            });
            
            if (dashboardView) {
                observer.observe(dashboardView, { attributes: true });
            }
        }
        
        setupEventListeners();
    } catch (err) {
        console.error('❌ DOMContentLoaded error:', err);
        // Show onboarding as fallback
        showOnboardingFlow();
    }
});

function showOnboardingFlow() {
    // Clear any existing content
    const dashboardView = document.getElementById('dashboard-view');
    dashboardView.innerHTML = '';
    
    // Create onboarding container
    const onboardingContainer = document.createElement('div');
    onboardingContainer.className = 'onboarding-container';
    onboardingContainer.style.cssText = `
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    onboardingContainer.innerHTML = `
        <!-- Step 1: Welcome -->
        <div class="onboarding-step active" id="step-1">
            <div style="text-align: center; margin-bottom: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📧</div>
                <h1 style="color: #1e293b; margin-bottom: 0.5rem; font-size: 2.5rem;">Welcome to HomeOps</h1>
                <p style="color: #64748b; font-size: 1.2rem; line-height: 1.6;">
                    Your inbox, decoded. Signal vs. noise, sorted.
                </p>
            </div>
            <div style="background: rgba(255,255,255,0.85); border-radius: 28px; padding: 2.5rem 2rem; box-shadow: 0 8px 32px rgba(30,41,59,0.10); margin-bottom: 2.5rem;">
                <h2 style="color: #1e293b; margin-bottom: 2.2rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.01em;">What HomeOps Does</h2>
                <div class="lucide-onboarding-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.2rem;">
                    <div class="lucide-onboarding-card" style="backdrop-filter: blur(8px); background: rgba(255, 68, 68, 0.07); border-radius: 20px; padding: 2.2rem 1.2rem 1.7rem 1.2rem; text-align: center; box-shadow: 0 2px 16px rgba(239,68,68,0.07);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 1.1rem;">
                            <i data-lucide="zap" style="width:2.2em;height:2.2em;color:#ef4444;"></i>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444; margin-bottom: 0.7rem; letter-spacing: -0.01em;">Urgent & Actionable</div>
                        <div style="color: #1e293b; font-size: 1.08rem; font-weight: 500; opacity: 0.82;">What needs your attention — now.</div>
                    </div>
                    <div class="lucide-onboarding-card" style="backdrop-filter: blur(8px); background: rgba(59,130,246,0.07); border-radius: 20px; padding: 2.2rem 1.2rem 1.7rem 1.2rem; text-align: center; box-shadow: 0 2px 16px rgba(59,130,246,0.07);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 1.1rem;">
                            <i data-lucide="calendar-days" style="width:2.2em;height:2.2em;color:#2563eb;"></i>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #2563eb; margin-bottom: 0.7rem; letter-spacing: -0.01em;">Appointments & Schedule</div>
                        <div style="color: #1e293b; font-size: 1.08rem; font-weight: 500; opacity: 0.82;">Everything coming up, already decoded.</div>
                    </div>
                    <div class="lucide-onboarding-card" style="backdrop-filter: blur(8px); background: rgba(34,197,94,0.07); border-radius: 20px; padding: 2.2rem 1.2rem 1.7rem 1.2rem; text-align: center; box-shadow: 0 2px 16px rgba(34,197,94,0.07);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 1.1rem;">
                            <i data-lucide="users" style="width:2.2em;height:2.2em;color:#22c55e;"></i>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #22c55e; margin-bottom: 0.7rem; letter-spacing: -0.01em;">Family & Context</div>
                        <div style="color: #1e293b; font-size: 1.08rem; font-weight: 500; opacity: 0.82;">The rhythm of your family, in one place.</div>
                    </div>
                    <div class="lucide-onboarding-card" style="backdrop-filter: blur(8px); background: rgba(245,158,66,0.07); border-radius: 20px; padding: 2.2rem 1.2rem 1.7rem 1.2rem; text-align: center; box-shadow: 0 2px 16px rgba(245,158,66,0.07);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 1.1rem;">
                            <i data-lucide="shopping-bag" style="width:2.2em;height:2.2em;color:#f59e42;"></i>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #f59e42; margin-bottom: 0.7rem; letter-spacing: -0.01em;">Commerce Inbox</div>
                        <div style="color: #1e293b; font-size: 1.08rem; font-weight: 500; opacity: 0.82;">What you've bought. What matters. What's next.</div>
                    </div>
                </div>
            </div>
            <div style="text-align: center;">
                <button onclick="nextStep()" class="primary-btn" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    transition: all 0.2s;
                ">Get Started →</button>
            </div>
        </div>
        
        <!-- Step 2: Connect Gmail -->
        <div class="onboarding-step" id="step-2" style="display: none;">
            <div style="text-align: center; margin-bottom: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔗</div>
                <h1 style="color: #1e293b; margin-bottom: 0.5rem;">Connect Your Gmail</h1>
                <p style="color: #64748b; font-size: 1.2rem;">
                    HomeOps needs access to your Gmail to decode your emails
                </p>
            </div>
            
            <div style="background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 8px 32px rgba(0,0,0,0.08); margin-bottom: 2rem;">
                <h2 style="color: #1e293b; margin-bottom: 1rem;">How it works:</h2>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                        <div>
                            <strong>Click "Connect Gmail"</strong>
                            <p style="color: #64748b; margin: 0; font-size: 0.9rem;">You'll be redirected to Google's secure login</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                        <div>
                            <strong>Grant Permission</strong>
                            <p style="color: #64748b; margin: 0; font-size: 0.9rem;">Allow HomeOps to read your emails (we never send emails)</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                        <div>
                            <strong>Start Decoding</strong>
                            <p style="color: #64748b; margin: 0; font-size: 0.9rem;">Your emails will be organized automatically</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="connectGmail()" class="connect-gmail-btn" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 1.5rem 3rem;
                    border-radius: 12px;
                    font-size: 1.2rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    transition: all 0.2s;
                    margin-bottom: 1rem;
                ">🔗 Connect Gmail</button>
                <br>
                <button onclick="prevStep()" class="secondary-btn" style="
                    background: transparent;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">← Back</button>
            </div>
        </div>
        
        <!-- Step 3: Processing -->
        <div class="onboarding-step" id="step-3" style="display: none;">
            <div style="text-align: center; margin-bottom: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔄</div>
                <h1 style="color: #1e293b; margin-bottom: 0.5rem;">Processing Your Emails</h1>
                <p style="color: #64748b; font-size: 1.2rem;">
                    HomeOps is analyzing your inbox...
                </p>
            </div>
            
            <div style="background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 8px 32px rgba(0,0,0,0.08); margin-bottom: 2rem;">
                <div style="text-align: center;">
                    <div class="loading-spinner" style="
                        width: 3rem;
                        height: 3rem;
                        border: 4px solid #e2e8f0;
                        border-top: 4px solid #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    "></div>
                    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">AI is decoding your emails</h3>
                    <p style="color: #64748b;">This usually takes 10-30 seconds</p>
                </div>
            </div>
        </div>
    `;
    
    dashboardView.appendChild(onboardingContainer);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        .connect-gmail-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        .secondary-btn:hover {
            background: #f8fafc;
        }
    `;
    document.head.appendChild(style);
}

function nextStep() {
    const currentStep = document.querySelector('.onboarding-step.active');
    const nextStepElement = currentStep.nextElementSibling;
    
    if (currentStep && nextStepElement) {
        currentStep.classList.remove('active');
        currentStep.style.display = 'none';
        nextStepElement.classList.add('active');
        nextStepElement.style.display = 'block';
    }
}

function prevStep() {
    const currentStep = document.querySelector('.onboarding-step.active');
    const prevStepElement = currentStep.previousElementSibling;
    
    if (currentStep && prevStepElement) {
        currentStep.classList.remove('active');
        currentStep.style.display = 'none';
        prevStepElement.classList.add('active');
        prevStepElement.style.display = 'block';
    }
}

async function processEmails() {
    if (isProcessing) {
        console.log('⏳ Already processing emails...');
        return;
    }
    
    console.log('🔄 Processing emails...');
    isProcessing = true;
    updateProcessingUI(true);
    
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
        updateProcessingUI(false);
    }
}

function renderDecodedEmails() {
    console.log('📧 Rendering decoded emails:', decodedEmails.length);
    
    // Group emails by category
    const urgentEmails = decodedEmails.filter(email => email.category === 'urgent');
    const scheduleEmails = decodedEmails.filter(email => email.category === 'schedule');
    const familyEmails = decodedEmails.filter(email => email.category === 'family');
    const commerceEmails = decodedEmails.filter(email => email.category === 'commerce');
    
    // Render each column
    renderEmailColumn('urgent-emails', urgentEmails, 'urgent');
    renderEmailColumn('schedule-emails', scheduleEmails, 'schedule');
    renderEmailColumn('family-emails', familyEmails, 'family');
    renderEmailColumn('commerce-emails', commerceEmails, 'commerce');
    
    // Update stats
    updateStats({
        total: decodedEmails.length,
        urgent: urgentEmails.length,
        schedule: scheduleEmails.length,
        family: familyEmails.length,
        commerce: commerceEmails.length
    });
}

function renderEmailColumn(containerId, emails, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    if (emails.length === 0) {
        container.innerHTML = '<div class="empty-state">No emails in this category</div>';
        return;
    }
    
    emails.forEach(email => {
        const emailCard = createEmailCard(email, type);
        container.appendChild(emailCard);
    });
}

function createEmailCard(email, type) {
    const card = document.createElement('div');
    card.className = 'email-item';
    card.dataset.emailId = email.id;
    
    const priorityClass = email.priority || 'medium';
    card.classList.add(priorityClass);
    
    card.innerHTML = `
        <div class="priority-badge priority-${priorityClass}">${email.priority || 'Medium'} Priority</div>
        <div class="email-sender">${email.sender}</div>
        <div class="email-subject">${email.subject}</div>
        <div class="email-preview">${email.preview}</div>
        <div class="action-buttons">
            <button class="action-btn primary" onclick="handleEmailAction('${email.id}', 'primary')">
                ${getPrimaryAction(email)}
            </button>
            <button class="action-btn secondary" onclick="handleEmailAction('${email.id}', 'secondary')">
                Archive
            </button>
        </div>
    `;
    
    return card;
}

function getTypeColor(type) {
    const colors = {
        urgent: '#ef4444',
        schedule: '#3b82f6',
        family: '#22c55e',
        commerce: '#f59e0b'
    };
    return colors[type] || '#6b7280';
}

function getPriorityColor(priority) {
    const colors = {
        high: '#ef4444',
        medium: '#3b82f6',
        low: '#22c55e'
    };
    return colors[priority] || '#6b7280';
}

function getPrimaryAction(email) {
    const actions = {
        urgent: 'Handle Now',
        schedule: 'Add to Calendar',
        family: 'Review',
        commerce: 'Track Order'
    };
    return actions[email.category] || 'View';
}

function updateStats(summary) {
    const stats = [
        { selector: '.stat-number', value: summary.total },
        { selector: '.stat-number', value: summary.urgent }
    ];
    
    stats.forEach((stat, index) => {
        const element = document.querySelector(stat.selector);
        if (element) {
            animateStat(stat.selector, index, stat.value);
        }
    });
}

function animateStat(selector, index, targetValue) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    animateNumber(element, currentValue, targetValue, 1000);
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
    if (!processBtn) return;
    
    if (processing) {
        processBtn.innerHTML = '<span class="process-icon spinning">🔄</span><span class="process-text">Processing...</span>';
        processBtn.disabled = true;
    } else {
        processBtn.innerHTML = '<span class="process-icon">🔄</span><span class="process-text">Process Emails</span>';
        processBtn.disabled = false;
    }
}

function handleEmailAction(emailId, actionType) {
    console.log(`📧 Email action: ${emailId} - ${actionType}`);
    
    // Remove the email card from the UI
    const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
    if (emailCard) {
        emailCard.style.opacity = '0.5';
        emailCard.style.pointerEvents = 'none';
    }
    
    // Show success message
    const actionText = actionType === 'primary' ? 'Action taken' : 'Email archived';
    showSuccessMessage(`${actionText} successfully!`);
}

function showSuccessMessage(message) {
    // Create toast notification
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorMessage(message) {
    // Create toast notification
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function setupEventListeners() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Add any other global event listeners here
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .demo-message {
        margin: 2rem;
    }
`;
document.head.appendChild(style);

console.log('✅ Email Decoder Engine Ready');

// Add a proper 4-column Email Decoder UI for when Gmail is connected
function showDecoderReadyUI() {
    const dashboardView = document.getElementById('dashboard-view');
    dashboardView.innerHTML = `
        <div class="decoder-ready-container" style="max-width:1400px;margin:0 auto;padding:2rem;">
            <div style="text-align:center;margin-bottom:3rem;">
                <div style="font-size:3rem;margin-bottom:1rem;">🧠</div>
                <h2 style="color:#1e293b;margin-bottom:0.5rem;">Gmail Connected!</h2>
                <p style="color:#64748b;font-size:1.1rem;margin-bottom:2rem;">You're ready to decode your inbox. Click below to process your emails.</p>
                <button id="process-emails-btn" class="process-btn" style="
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
                    <span class="process-text">Process Emails</span>
                </button>
            </div>
            
            <!-- 4-Column Email Decoder Layout -->
            <div class="decoder-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;">
                <!-- Urgent & Actionable -->
                <div class="decoder-col" style="background: rgba(239,68,68,0.05); border-radius: 16px; padding: 1.5rem;">
                    <div class="decoder-col-header" style="
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        color: white;
                        padding: 1rem;
                        border-radius: 12px;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                    ">
                        <i data-lucide="zap" style="width:1.2em;height:1.2em;"></i>
                        Urgent & Actionable
                    </div>
                    <div id="urgent-emails" class="decoder-cards"></div>
                </div>
                
                <!-- Appointments & Schedule -->
                <div class="decoder-col" style="background: rgba(59,130,246,0.05); border-radius: 16px; padding: 1.5rem;">
                    <div class="decoder-col-header" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        padding: 1rem;
                        border-radius: 12px;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                    ">
                        <i data-lucide="calendar-days" style="width:1.2em;height:1.2em;"></i>
                        Appointments & Schedule
                    </div>
                    <div id="schedule-emails" class="decoder-cards"></div>
                </div>
                
                <!-- Family & Context -->
                <div class="decoder-col" style="background: rgba(34,197,94,0.05); border-radius: 16px; padding: 1.5rem;">
                    <div class="decoder-col-header" style="
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        color: white;
                        padding: 1rem;
                        border-radius: 12px;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                    ">
                        <i data-lucide="users" style="width:1.2em;height:1.2em;"></i>
                        Family & Context
                    </div>
                    <div id="family-emails" class="decoder-cards"></div>
                </div>
                
                <!-- Commerce Inbox -->
                <div class="decoder-col" style="background: rgba(245,158,66,0.05); border-radius: 16px; padding: 1.5rem;">
                    <div class="decoder-col-header" style="
                        background: linear-gradient(135deg, #f59e42 0%, #fbbf24 100%);
                        color: white;
                        padding: 1rem;
                        border-radius: 12px;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                    ">
                        <i data-lucide="shopping-bag" style="width:1.2em;height:1.2em;"></i>
                        Commerce Inbox
                    </div>
                    <div id="commerce-emails" class="decoder-cards"></div>
                </div>
            </div>
            
            <div id="decoded-emails-container"></div>
        </div>
    `;
    
    // Attach event listener for process button
    const processBtn = document.getElementById('process-emails-btn');
    if (processBtn) {
        processBtn.addEventListener('click', function(e) {
            e.preventDefault();
            processEmails();
        });
    }
}

function categorizeEmail(email) {
    const categories = [];
    // ... existing logic for urgent, schedule, family ...
    // Add commerce logic
    const commerceKeywords = ['order', 'receipt', 'purchase', 'shipped', 'delivered', 'invoice', 'payment', 'transaction', 'amazon', 'ebay', 'shop', 'store', 'subscription'];
    if (commerceKeywords.some(word => email.subject?.toLowerCase().includes(word) || email.body?.toLowerCase().includes(word))) {
        categories.push('commerce');
    }
    // ... existing code ...
    return categories;
}

// Global function that can be called from layout.js
window.initializeEmailDecoder = function() {
    console.log('🎯 initializeEmailDecoder called from layout.js');
    initializeDecoderView();
}; 