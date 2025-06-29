// Email Decoder Engine - Clear Onboarding Flow
// User ID is now dynamically retrieved from Firebase Auth

// Global state
let decodedEmails = [];
let isProcessing = false;
let onboardingStep = 1;
let onboardingFeedback = [];

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
    
    // Update progress if on step 2
    if (step === 2) {
        updateOnboardingProgress();
    }
}

function setupOnboardingEventListeners() {
    // Gmail connect button
    const connectBtn = document.getElementById('connect-gmail-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectGmail);
    }
    
    // Category buttons for sample emails
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', handleCategorySelection);
    });
    
    // Start decoding button
    const startBtn = document.getElementById('start-decoding-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startDecoding);
    }
}

async function connectGmail() {
    console.log('🔗 Connecting Gmail...');
    
    try {
        const userId = await waitForUserId();
        const response = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const data = await response.json();
        
        if (data.auth_url) {
            window.location.href = data.auth_url;
        } else {
            console.error('❌ No auth URL received');
            showErrorMessage('Failed to start Gmail connection');
        }
    } catch (error) {
        console.error('❌ Error connecting Gmail:', error);
        showErrorMessage('Failed to connect Gmail');
    }
}

function handleCategorySelection(event) {
    const btn = event.target;
    const emailCard = btn.closest('.sample-email-card');
    const emailId = emailCard.dataset.emailId;
    const category = btn.dataset.category;
    
    // Remove selected class from all buttons in this email
    const allBtns = emailCard.querySelectorAll('.category-btn');
    allBtns.forEach(b => b.classList.remove('selected'));
    
    // Add selected class to clicked button
    btn.classList.add('selected');
    
    // Mark email as categorized
    emailCard.classList.add('categorized');
    
    // Store feedback
    onboardingFeedback[emailId] = category;
    
    // Update progress
    updateOnboardingProgress();
    
    // Check if all emails are categorized
    if (Object.keys(onboardingFeedback).length === 3) {
        setTimeout(() => {
            showOnboardingStep(3);
        }, 1000);
    }
}

function updateOnboardingProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    const categorized = Object.keys(onboardingFeedback).length;
    const total = 3;
    const percentage = (categorized / total) * 100;
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${categorized} of ${total} emails categorized`;
    }
}

function startDecoding() {
    console.log('🚀 Starting decoding...');
    
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
    
    // Initialize the decoder
    showDecoderReadyUI();
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
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Email Decoder Engine Initialized');
    try {
        initializeDecoderView();
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
    if (isProcessing) return;
    
    isProcessing = true;
    updateProcessingUI(true);
    
    try {
        console.log('🔍 Processing emails through AI decoder...');
        
        const response = await fetch('/api/email-decoder/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            decodedEmails = data.emails || [];
            renderDecodedEmails();
            updateStats(data.summary);
            showSuccessMessage(`Processed ${decodedEmails.length} emails!`);
        } else {
            if (data.error === 'Gmail not connected') {
                showGmailConnectionPrompt();
            } else {
                throw new Error(data.error || 'Failed to process emails');
            }
        }
    } catch (error) {
        console.error('❌ Error processing emails:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showErrorMessage('Unable to connect to server. Please check your connection and try again.');
        } else {
            showErrorMessage('Failed to process emails. Please try again.');
        }
    } finally {
        isProcessing = false;
        updateProcessingUI(false);
    }
}

function showGmailConnectionPrompt() {
    const modal = document.createElement('div');
    modal.className = 'gmail-connection-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 2rem;
            border-radius: 16px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
            <h3 style="margin: 0 0 1rem; color: #1e293b;">Connect Gmail First</h3>
            <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.5;">
                To process your emails, you need to connect your Gmail account first. 
                This allows HomeOps to securely access and decode your emails.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="this.closest('.gmail-connection-modal').remove()" style="
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Cancel</button>
                <button onclick="connectGmail()" style="
                    padding: 0.75rem 1.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Connect Gmail</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function renderDecodedEmails() {
    if (decodedEmails.length === 0) {
        showDemoMode();
        return;
    }
    
    // Clear existing content
    clearColumns();
    
    // Categorize emails into the 4 columns
    const urgentEmails = decodedEmails.filter(email => email.decoded.priority === 'high');
    const appointmentEmails = decodedEmails.filter(email => 
        email.decoded.category === 'healthcare' || 
        email.decoded.category === 'rsvp' ||
        email.decoded.category === 'deadline' ||
        email.decoded.category === 'school'
    );
    const familyEmails = decodedEmails.filter(email => 
        email.decoded.type === 'family_signal' ||
        email.decoded.category === 'logistics' ||
        email.decoded.category === 'school'
    );
    const commerceEmails = decodedEmails.filter(email => 
        email.decoded.category === 'purchase' ||
        email.decoded.category === 'promotion' ||
        email.decoded.category === 'brand_opportunity' ||
        email.decoded.category === 'reorder_nudge'
    );
    
    // Render each category
    renderEmailColumn('urgentCards', urgentEmails, 'urgent');
    renderEmailColumn('appointmentCards', appointmentEmails, 'action');
    renderEmailColumn('familyCards', familyEmails, 'info');
    renderEmailColumn('commerceCards', commerceEmails, 'commerce');
    
    // Show success message
    showSuccessMessage(`Processed ${decodedEmails.length} emails!`);
}

function renderEmailColumn(containerId, emails, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    emails.forEach(email => {
        const emailCard = createEmailCard(email, type);
        container.appendChild(emailCard);
    });
}

function createEmailCard(email, type) {
    const card = document.createElement('div');
    card.className = `email-item ${type}`;
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border-left: 4px solid ${getTypeColor(type)};
        transition: all 0.2s ease;
        cursor: pointer;
    `;
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div style="font-weight: 600; color: #374151; font-size: 0.9rem;">${email.from}</div>
            <div style="
                background: ${getPriorityColor(email.decoded.priority)};
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            ">${email.decoded.priority} Priority</div>
        </div>
        <div style="font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; font-size: 1rem;">${email.subject}</div>
        <div style="color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">${email.decoded.summary}</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="action-btn primary" onclick="handleEmailAction('${email.id}', 'primary')" style="
                background: ${getTypeColor(type)};
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            ">${getPrimaryAction(email.decoded)}</button>
            <button class="action-btn secondary" onclick="handleEmailAction('${email.id}', 'secondary')" style="
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">More Info</button>
        </div>
    `;
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    });
    
    return card;
}

function getTypeColor(type) {
    const colors = {
        urgent: '#ef4444',
        action: '#3b82f6',
        info: '#22c55e',
        commerce: '#f59e42'
    };
    return colors[type] || '#6b7280';
}

function getPriorityColor(priority) {
    const colors = {
        high: '#ef4444',
        medium: '#f59e42',
        low: '#10b981'
    };
    return colors[priority] || '#6b7280';
}

function getPrimaryAction(decoded) {
    switch (decoded.category) {
        case 'healthcare': return 'Confirm';
        case 'rsvp': return 'RSVP';
        case 'deadline': return 'Mark Done';
        case 'purchase': return 'View Order';
        case 'promotion': return 'View Deal';
        case 'brand_opportunity': return 'View Offer';
        case 'reorder_nudge': return 'Reorder';
        case 'school': return 'View Details';
        case 'logistics': return 'Track';
        default: return 'View';
    }
}

function updateStats(summary) {
    const stats = {
        total: summary?.total || decodedEmails.length,
        urgent: summary?.byPriority?.high || 0,
        appointments: summary?.byCategory?.healthcare || 0
    };
    
    // Update stat numbers with animation
    animateStat('stat-number', 0, stats.total);
    animateStat('stat-number', 1, stats.urgent);
    animateStat('stat-number', 2, stats.appointments);
}

function animateStat(selector, index, targetValue) {
    const statElements = document.querySelectorAll(selector);
    if (statElements[index]) {
        const element = statElements[index];
        const currentValue = parseInt(element.textContent) || 0;
        animateNumber(element, currentValue, targetValue, 1000);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (difference * progress));
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function showDemoMode() {
    const dashboardView = document.getElementById('dashboard-view');
    dashboardView.innerHTML = `
        <div class="demo-container" style="max-width:1400px;margin:0 auto;padding:2rem;">
            <div style="text-align:center;margin-bottom:3rem;">
                <h2 style="color:#1e293b;margin-bottom:0.5rem;">📧 Email Decoder Demo</h2>
                <p style="color:#64748b;margin-bottom:2rem;">Here's how HomeOps would organize your emails:</p>
                <button onclick="connectGmail()" class="connect-btn pulse" style="
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    transition: all 0.2s;
                ">Connect Gmail to Start</button>
            </div>
            
            <!-- 4-Column Demo Layout -->
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
                    <div id="urgentCards" class="decoder-cards">
                        <div class="email-item urgent" style="
                            background: white;
                            border-radius: 12px;
                            padding: 1.5rem;
                            margin-bottom: 1rem;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            border-left: 4px solid #ef4444;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; color: #374151; font-size: 0.9rem;">Dr. Sarah Chen - Pediatrician</div>
                                <div style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">High Priority</div>
                            </div>
                            <div style="font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; font-size: 1rem;">Appointment Confirmation: Tomorrow 2:30 PM</div>
                            <div style="color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">Your child's annual checkup is confirmed for tomorrow at 2:30 PM. Please arrive 15 minutes early.</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Confirm</button>
                                <button style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer;">More Info</button>
                            </div>
                        </div>
                    </div>
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
                    <div id="appointmentCards" class="decoder-cards">
                        <div class="email-item action" style="
                            background: white;
                            border-radius: 12px;
                            padding: 1.5rem;
                            margin-bottom: 1rem;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            border-left: 4px solid #3b82f6;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; color: #374151; font-size: 0.9rem;">Jessica Martinez - School Principal</div>
                                <div style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">High Priority</div>
                            </div>
                            <div style="font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; font-size: 1rem;">Parent-Teacher Conference: This Friday</div>
                            <div style="color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">Reminder: Your parent-teacher conference is scheduled for this Friday at 3:00 PM.</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">RSVP</button>
                                <button style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer;">More Info</button>
                            </div>
                        </div>
                    </div>
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
                    <div id="familyCards" class="decoder-cards">
                        <div class="email-item info" style="
                            background: white;
                            border-radius: 12px;
                            padding: 1.5rem;
                            margin-bottom: 1rem;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            border-left: 4px solid #22c55e;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; color: #374151; font-size: 0.9rem;">Soccer League Coordinator</div>
                                <div style="background: #f59e42; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Medium Priority</div>
                            </div>
                            <div style="font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; font-size: 1rem;">Weekend Game Schedule Update</div>
                            <div style="color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">Due to weather, this Saturday's soccer game has been moved to Sunday at 10 AM.</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button style="background: #22c55e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">View Details</button>
                                <button style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer;">More Info</button>
                            </div>
                        </div>
                    </div>
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
                    <div id="commerceCards" class="decoder-cards">
                        <div class="email-item commerce" style="
                            background: white;
                            border-radius: 12px;
                            padding: 1.5rem;
                            margin-bottom: 1rem;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            border-left: 4px solid #f59e42;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; color: #374151; font-size: 0.9rem;">Amazon Prime</div>
                                <div style="background: #f59e42; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Medium Priority</div>
                            </div>
                            <div style="font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; font-size: 1rem;">Your order #123-4567890-1234567 has shipped</div>
                            <div style="color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">Your order containing "Organic Baby Formula" will arrive tomorrow between 2-6 PM.</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button style="background: #f59e42; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">View Order</button>
                                <button style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer;">More Info</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleEmailAction(emailId, actionType) {
    const email = decodedEmails.find(e => e.id === emailId);
    if (!email) return;
    
    // Add click animation
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
    
    // Show feedback
    const originalText = button.textContent;
    button.textContent = '✓ Done';
    button.style.background = '#10b981';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
    
    console.log(`Action ${actionType} performed on email:`, email.subject);
}

function updateProcessingUI(processing) {
    const connectBtn = document.querySelector('.connect-btn');
    const processBtn = document.getElementById('process-emails-btn');
    
    if (connectBtn) {
        if (processing) {
            connectBtn.textContent = '🔄 Processing...';
            connectBtn.disabled = true;
        } else {
            connectBtn.textContent = 'Get Started with HomeOps';
            connectBtn.disabled = false;
        }
    }
    
    if (processBtn) {
        if (processing) {
            processBtn.disabled = true;
            processBtn.classList.add('processing');
            processBtn.querySelector('.process-text').textContent = 'Processing...';
        } else {
            processBtn.disabled = false;
            processBtn.classList.remove('processing');
            processBtn.querySelector('.process-text').textContent = 'Process Emails';
        }
    }
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function clearColumns() {
    const containers = ['urgentCards', 'appointmentCards', 'familyCards', 'commerceCards'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
        }
    });
}

function setupEventListeners() {
    // Process emails button (the one without onclick)
    const processEmailsBtn = document.querySelector('#gmail-connected #process-emails-btn');
    if (processEmailsBtn) {
        processEmailsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            processEmails();
        });
    }
    
    // Add hover effects to email items
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.email-item')) {
            const item = e.target.closest('.email-item');
            item.style.transform = 'translateY(-4px)';
            item.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.15)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.email-item')) {
            const item = e.target.closest('.email-item');
            item.style.transform = 'translateY(0)';
            item.style.boxShadow = '';
        }
    });
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
                    <div id="urgentCards" class="decoder-cards"></div>
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
                    <div id="appointmentCards" class="decoder-cards"></div>
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
                    <div id="familyCards" class="decoder-cards"></div>
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
                    <div id="commerceCards" class="decoder-cards"></div>
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