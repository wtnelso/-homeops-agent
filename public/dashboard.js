// Email Decoder Engine - Clear Onboarding Flow
const userId = "user_123"; // 🔐 Replace with dynamic user ID later

// Global state
let decodedEmails = [];
let isProcessing = false;

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

// Wait for Firebase auth to be ready and get userId
function waitForUserId() {
    return new Promise((resolve) => {
        if (window.userId) return resolve(window.userId);
        const check = () => {
            if (window.userId) {
                resolve(window.userId);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
}

async function initializeDecoderView() {
    const dashboardView = document.getElementById('dashboard-view');
    dashboardView.innerHTML = '';
    let userId = await waitForUserId();
    try {
        const res = await fetch(`/api/gmail/status?user_id=${encodeURIComponent(userId)}`);
        const data = await res.json();
        if (data.connected) {
            // Gmail is connected, show decoder/process UI
            showDecoderReadyUI();
        } else {
            // Not connected, show onboarding
            showOnboardingFlow();
        }
    } catch (err) {
        console.error('Failed to check Gmail status:', err);
        showOnboardingFlow();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Email Decoder Engine Initialized');
    initializeDecoderView();
    setupEventListeners();
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

async function connectGmail() {
    try {
        // Show processing step
        nextStep();
        
        // Redirect to Gmail OAuth
        window.location.href = '/auth/google';
    } catch (error) {
        console.error('❌ Error connecting Gmail:', error);
        showErrorMessage('Failed to connect Gmail. Please try again.');
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
    
    // Categorize emails
    const urgentEmails = decodedEmails.filter(email => email.decoded.priority === 'high');
    const appointmentEmails = decodedEmails.filter(email => 
        email.decoded.category === 'healthcare' || 
        email.decoded.category === 'rsvp' ||
        email.decoded.category === 'deadline'
    );
    const familyEmails = decodedEmails.filter(email => 
        email.decoded.type === 'family_signal' ||
        email.decoded.category === 'school' ||
        email.decoded.category === 'logistics'
    );
    
    // Render each category
    renderEmailColumn('urgentCards', urgentEmails, 'urgent');
    renderEmailColumn('appointmentCards', appointmentEmails, 'action');
    renderEmailColumn('familyCards', familyEmails, 'info');
    
    // Show the real content
    document.querySelector('.demo-container').style.display = 'block';
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
    card.innerHTML = `
        <div class="priority-badge priority-${email.decoded.priority}">${email.decoded.priority.toUpperCase()} PRIORITY</div>
        <div class="email-sender">${email.from}</div>
        <div class="email-subject">${email.subject}</div>
        <div class="email-preview">${email.decoded.summary}</div>
        <div class="action-buttons">
            <button class="action-btn primary" onclick="handleEmailAction('${email.id}', 'primary')">${getPrimaryAction(email.decoded)}</button>
            <button class="action-btn secondary" onclick="handleEmailAction('${email.id}', 'secondary')">More Info</button>
        </div>
    `;
    
    return card;
}

function getPrimaryAction(decoded) {
    switch (decoded.category) {
        case 'healthcare': return 'Confirm';
        case 'rsvp': return 'RSVP';
        case 'deadline': return 'Mark Done';
        case 'purchase': return 'View Order';
        case 'reorder_nudge': return 'Reorder';
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
    // Hide the real content and show demo
    document.querySelector('.demo-container').style.display = 'none';
    
    // Show demo decoded emails
    const demoEmails = [
        {
            id: 'demo1',
            from: 'Dr. Sarah Chen - Pediatrician',
            subject: 'Appointment Confirmation: Tomorrow 2:30 PM',
            decoded: {
                type: 'family_signal',
                category: 'healthcare',
                priority: 'high',
                summary: 'Your child\'s annual checkup is confirmed for tomorrow at 2:30 PM. Please arrive 15 minutes early.',
                action_required: 'Confirm appointment and prepare paperwork'
            }
        },
        {
            id: 'demo2',
            from: 'Amazon Prime',
            subject: 'Your order #123-4567890-1234567 has shipped',
            decoded: {
                type: 'smart_deal',
                category: 'purchase',
                priority: 'medium',
                summary: 'Your order containing "Organic Baby Formula" will arrive tomorrow between 2-6 PM.',
                action_required: 'Track package and prepare for delivery'
            }
        },
        {
            id: 'demo3',
            from: 'Jessica Martinez - School Principal',
            subject: 'Parent-Teacher Conference: This Friday',
            decoded: {
                type: 'family_signal',
                category: 'school',
                priority: 'high',
                summary: 'Reminder: Your parent-teacher conference is scheduled for this Friday at 3:00 PM.',
                action_required: 'RSVP and prepare questions'
            }
        },
        {
            id: 'demo4',
            from: 'Golf Club Pro Shop',
            subject: 'Tee Time Confirmation: Saturday 9:00 AM',
            decoded: {
                type: 'other',
                category: 'logistics',
                priority: 'medium',
                summary: 'Your tee time for Saturday morning is confirmed. Please arrive 30 minutes early.',
                action_required: 'Add to calendar and prepare equipment'
            }
        },
        {
            id: 'demo5',
            from: 'Mom & Dad',
            subject: 'Weekend Visit - This Saturday',
            decoded: {
                type: 'family_signal',
                category: 'logistics',
                priority: 'medium',
                summary: 'Hi honey! We\'re planning to visit this Saturday around 2 PM. Can\'t wait to see the kids!',
                action_required: 'Reply and prepare for visit'
            }
        }
    ];
    
    // Create demo container
    const demoContainer = document.createElement('div');
    demoContainer.className = 'demo-mode-container';
    demoContainer.style.cssText = `
        padding: 2rem;
        background: white;
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        margin: 2rem;
    `;
    
    demoContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <h2 style="color: #1e293b; margin-bottom: 0.5rem;">📧 Email Decoder Demo</h2>
            <p style="color: #64748b; margin-bottom: 2rem;">Here's how HomeOps would organize your emails:</p>
            <button onclick="connectGmail()" class="connect-btn pulse" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            ">Connect Gmail to Start</button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
            <div style="background: #fef2f2; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #dc2626;">
                <h3 style="color: #dc2626; margin-bottom: 1rem;">⚡ Urgent & Actionable</h3>
                ${demoEmails.filter(e => e.decoded.priority === 'high').map(email => `
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-weight: 600; color: #dc2626; font-size: 0.875rem;">HIGH PRIORITY</div>
                        <div style="font-weight: 600; margin: 0.5rem 0;">${email.from}</div>
                        <div style="color: #374151; margin-bottom: 0.5rem;">${email.subject}</div>
                        <div style="color: #6b7280; font-size: 0.875rem;">${email.decoded.summary}</div>
                    </div>
                `).join('')}
            </div>
            
            <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #2563eb;">
                <h3 style="color: #2563eb; margin-bottom: 1rem;">📅 Appointments & Schedule</h3>
                ${demoEmails.filter(e => e.decoded.category === 'healthcare' || e.decoded.category === 'school').map(email => `
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-weight: 600; color: #2563eb; font-size: 0.875rem;">MEDIUM PRIORITY</div>
                        <div style="font-weight: 600; margin: 0.5rem 0;">${email.from}</div>
                        <div style="color: #374151; margin-bottom: 0.5rem;">${email.subject}</div>
                        <div style="color: #6b7280; font-size: 0.875rem;">${email.decoded.summary}</div>
                    </div>
                `).join('')}
            </div>
            
            <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #16a34a;">
                <h3 style="color: #16a34a; margin-bottom: 1rem;">👨‍👩‍👧‍👦 Family & Context</h3>
                ${demoEmails.filter(e => e.decoded.type === 'family_signal').map(email => `
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-weight: 600; color: #16a34a; font-size: 0.875rem;">MEDIUM PRIORITY</div>
                        <div style="font-weight: 600; margin: 0.5rem 0;">${email.from}</div>
                        <div style="color: #374151; margin-bottom: 0.5rem;">${email.subject}</div>
                        <div style="color: #6b7280; font-size: 0.875rem;">${email.decoded.summary}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('dashboard-view').appendChild(demoContainer);
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
    const containers = ['urgentCards', 'appointmentCards', 'familyCards'];
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

// Add a simple decoder/process UI for when Gmail is connected
function showDecoderReadyUI() {
    const dashboardView = document.getElementById('dashboard-view');
    dashboardView.innerHTML = `
        <div class="decoder-ready-container" style="max-width:700px;margin:0 auto;padding:2rem;text-align:center;">
            <div style="font-size:3rem;margin-bottom:1rem;">🧠</div>
            <h2 style="color:#1e293b;margin-bottom:0.5rem;">Gmail Connected!</h2>
            <p style="color:#64748b;font-size:1.1rem;margin-bottom:2rem;">You're ready to decode your inbox. Click below to process your emails.</p>
            <button id="process-emails-btn" class="process-btn" style="margin-bottom:1.5rem;">
                <span class="process-text">Process Emails</span>
            </button>
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