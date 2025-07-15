// 🔥 HOMEOPS DECODER - Premium Email Intelligence Engine
// Apple/Superhuman aesthetic with purple gradient branding

console.log('🚀 HomeOps Decoder loaded - Premium UI v2.0');
console.log("🚀 NEW CODE LOADED: Google fallback CTA and Explore button!");

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

  // Demo: Trigger flight search and commerce recommendations on dashboard load
  fetchFlightResults({ origin: 'JFK', destination: 'LAX', date: new Date().toISOString().split('T')[0] });
  fetchCommerceRecommendations({ userId: getCurrentUserId(), interests: ['travel', 'clothing', 'electronics'] });

  // Check initial state instead of just Gmail connection
  checkInitialState();
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
  const onboardingFlag = localStorage.getItem('decoderOnboardingComplete');
  if (onboardingFlag === 'true') {
    // Onboarding is complete, show the main decoder interface
    console.log('🔍 Onboarding complete, showing main decoder');
    const userId = getCurrentUserId();
    if (userId) {
      loadExistingEmails(userId);
    } else {
      showZeroState();
    }
    return;
  }
  // If onboarding not complete, check Gmail connection first
  console.log('🔍 Onboarding not complete, checking Gmail connection');
  checkGmailConnection();
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
    // Update the CTA button text to be more witty
    const processAgainBtn = document.getElementById('process-again-btn');
    if (processAgainBtn) {
      processAgainBtn.innerHTML = `
        <i data-lucide="play"></i>
        <span>Decode your next batch of emails</span>
      `;
      // Re-initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
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
let showAllEmails = false;

// --- FLIGHT & COMMERCE INTEGRATION ---
let flightResults = [];
let commerceRecommendations = [];

async function fetchFlightResults(query) {
  try {
    const response = await fetch('/api/flight-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    const result = await response.json();
    flightResults = result.flights || [];
    renderFlightResults();
  } catch (error) {
    console.error('❌ Error fetching flight results:', error);
    showError('Failed to fetch flight results');
  }
}

async function fetchCommerceRecommendations(profile) {
  try {
    const response = await fetch('/api/commerce-profile/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    const result = await response.json();
    commerceRecommendations = result.recommendations || [];
    renderCommerceRecommendations();
  } catch (error) {
    console.error('❌ Error fetching commerce recommendations:', error);
    showError('Failed to fetch commerce recommendations');
  }
}

function renderFlightResults() {
  const container = document.getElementById('flight-results-container');
  if (!container) return;
  if (flightResults.length === 0) {
    container.innerHTML = '<div style="color:#64748b;padding:2rem;">No flights found.</div>';
    return;
  }
  container.innerHTML = flightResults.map(flight => `
    <div class="flight-card" style="border-radius:12px;box-shadow:0 2px 8px #e0e7ff;background:#fff;margin-bottom:1rem;padding:1rem 1.5rem;">
      <div style="font-weight:600;font-size:1.1rem;color:#3b82f6;">${flight.airline} ${flight.flightNumber}</div>
      <div style="color:#22223b;">${flight.origin} → ${flight.destination}</div>
      <div style="color:#64748b;">Departure: ${flight.departureTime} | Arrival: ${flight.arrivalTime}</div>
      <div style="margin-top:0.5rem;font-size:1rem;color:#10b981;">Price: ${flight.price}</div>
      <button class="btn-primary" style="margin-top:0.5rem;" onclick="bookFlight('${flight.id}')">Book Flight</button>
    </div>
  `).join('');
}

function renderCommerceRecommendations() {
  const container = document.getElementById('commerce-recommendations-container');
  if (!container) return;
  if (commerceRecommendations.length === 0) {
    container.innerHTML = '<div style="color:#64748b;padding:2rem;">No recommendations found.</div>';
    return;
  }
  container.innerHTML = commerceRecommendations.map(rec => `
    <div class="commerce-card" style="border-radius:12px;box-shadow:0 2px 8px #e0e7ff;background:#fff;margin-bottom:1rem;padding:1rem 1.5rem;">
      <div style="font-weight:600;font-size:1.1rem;color:#f59e0b;">${rec.productName}</div>
      <div style="color:#22223b;">${rec.description}</div>
      <div style="color:#64748b;">Brand: ${rec.brand}</div>
      <div style="margin-top:0.5rem;font-size:1rem;color:#10b981;">Price: ${rec.price}</div>
      <a class="btn-primary" style="margin-top:0.5rem;" href="${rec.url}" target="_blank">View Product</a>
    </div>
  `).join('');
}

// Booking logic for flights
async function bookFlight(flightId) {
  try {
    const response = await fetch('/api/flight-search/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId, userId: getCurrentUserId() })
    });
    const result = await response.json();
    if (result.success) {
      showSuccess('Flight booked successfully!');
    } else {
      showError(result.error || 'Failed to book flight');
    }
  } catch (error) {
    console.error('❌ Error booking flight:', error);
    showError('Error booking flight');
  }
}
function getPriorityValue(priority) {
  if (!priority) return 3;
  switch (priority.toLowerCase()) {
    case 'high': return 0;
    case 'medium': return 1;
    case 'low': return 2;
    default: return 3;
  }
}

function getFilteredSortedEmails() {
  // Deduplicate emails by id, or fallback to subject+sender+date
  const seen = new Set();
  let filtered = [];
  for (const e of decodedEmails) {
    const key = e.id || (e.subject + '|' + e.sender + '|' + e.date);
    if (!seen.has(key)) {
      seen.add(key);
      filtered.push(e);
    }
  }
  // Only include emails with either a summary OR suggested actions (not requiring both)
  filtered = filtered.filter(e => {
    const hasSummary = e.summary && e.summary.trim();
    const hasActions = Array.isArray(e.suggested_actions) && e.suggested_actions.length > 0;
    return hasSummary || hasActions;
  });
  // Filter by currentCategory (unless 'all')
  if (currentCategory && currentCategory !== 'all') {
    filtered = filtered.filter(e => mapCategory(e.category) === currentCategory);
  }
  // Sort by priority, then timestamp (desc)
  filtered.sort((a, b) => {
    const pa = getPriorityValue(a.priority);
    const pb = getPriorityValue(b.priority);
    if (pa !== pb) return pa - pb;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
  // Limit to top 10 unless showAllEmails is true
  if (!showAllEmails) {
    filtered = filtered.slice(0, 10);
  }
  return filtered;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getDecoderSummary(emails) {
  if (!emails.length) return '';
  const counts = { urgent: 0, schedule: 0, family: 0, commerce: 0 };
  emails.forEach(e => {
    const cat = mapCategory(e.category);
    if (counts[cat] !== undefined) counts[cat]++;
  });
  let parts = [];
  if (counts.urgent) parts.push(`${counts.urgent} urgent message${counts.urgent > 1 ? 's' : ''}`);
  if (counts.schedule) parts.push(`${counts.schedule} calendar event${counts.schedule > 1 ? 's' : ''}`);
  if (counts.family) parts.push(`${counts.family} family update${counts.family > 1 ? 's' : ''}`);
  if (counts.commerce) parts.push(`${counts.commerce} purchase update${counts.commerce > 1 ? 's' : ''}`);
  return parts.length ? `You have ${parts.join(', ')}.` : '';
}

function renderEmailCards() {
  console.log('🎨 Rendering email cards...');
  const container = document.getElementById('email-cards-container');
  if (!container) return;
  const emailsToRender = getFilteredSortedEmails();
  console.log('🔍 Emails to render:', emailsToRender);
  // Decoder Summary TL;DR
  const summaryText = getDecoderSummary(emailsToRender);
  let summaryHtml = '';
  if (summaryText) {
    summaryHtml = `<div class="decoder-summary" style="margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; color: #6366f1;">${summaryText}</div>`;
  }
  // Show More toggle - use same filtering logic as getFilteredSortedEmails
  const filteredEmails = decodedEmails.filter(e => {
    const hasSummary = e.summary && e.summary.trim();
    const hasActions = Array.isArray(e.suggested_actions) && e.suggested_actions.length > 0;
    return hasSummary || hasActions;
  });
  let showMoreHtml = '';
  if (!showAllEmails && filteredEmails.length > 10) {
    showMoreHtml = `<div style="text-align:center; margin: 1rem 0;"><button class="btn-primary" onclick="showAllDecoderEmails()">Show More</button></div>`;
  } else if (showAllEmails && filteredEmails.length > 10) {
    showMoreHtml = `<div style="text-align:center; margin: 1rem 0;"><button class="btn-secondary" onclick="showTopDecoderEmails()">Show Top 10 Only</button></div>`;
  }
  
  if (emailsToRender.length === 0) {
    // Check if this is due to filtering or no emails at all
    if (currentCategory && currentCategory !== 'all') {
      // This is a category filter with no results
      const categoryLabel = CATEGORIES[currentCategory]?.label || currentCategory;
      container.innerHTML = summaryHtml + `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <h3>No ${categoryLabel} emails found</h3>
          <p>Try switching to a different category or process more emails.</p>
          <button onclick="switchCategory('all')" class="btn-primary" style="
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
          ">Show All Emails</button>
        </div>
      ` + showMoreHtml;
    } else if (filteredEmails.length === 0) {
      // No emails at all - show zero state
    showZeroState();
    container.innerHTML = summaryHtml + showMoreHtml;
    } else {
      // Some other filtering issue
      container.innerHTML = summaryHtml + `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <h3>No emails match current filters</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ` + showMoreHtml;
    }
    return;
  }
  
  container.innerHTML = summaryHtml + emailsToRender.map(email => createDecoderCard(email)).join('') + showMoreHtml;

  // --- Insert Flight & Commerce Results UI ---
  if (!document.getElementById('flight-results-container')) {
    const flightDiv = document.createElement('div');
    flightDiv.id = 'flight-results-container';
    flightDiv.style.marginTop = '2rem';
    container.parentNode.insertBefore(flightDiv, container.nextSibling);
  }
  if (!document.getElementById('commerce-recommendations-container')) {
    const commerceDiv = document.createElement('div');
    commerceDiv.id = 'commerce-recommendations-container';
    commerceDiv.style.marginTop = '2rem';
    container.parentNode.insertBefore(commerceDiv, container.nextSibling);
  }
  renderFlightResults();
  renderCommerceRecommendations();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  updateCategoryCounts();
}

function isUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}
function isMailto(str) {
  return /^mailto:/i.test(str) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str);
}
function createActionButton(action, email) {
  console.log('🔍 Creating action button:', action, 'for email:', email);
  const actionLower = action.toLowerCase();

  // Expanded commerce keywords
  const commerceKeywords = [
    'shop', 'view offer', 'buy', 'see deal', 'get offer', 'subscribe',
    'track order', 'view receipt', 'see details', 'order details', 'shipment', 'shipping', 'delivery', 'manage subscription', 'unsubscribe'
  ];

  // Smart routing for commerce actions
  if (Array.isArray(email.actionLinks) && email.actionLinks.length > 0) {
    if (commerceKeywords.some(keyword => actionLower.includes(keyword))) {
      // Try to match the most relevant link by keyword
      let matchedLink = email.actionLinks.find(link => {
        const linkLower = link.toLowerCase();
        return commerceKeywords.some(keyword => linkLower.includes(keyword.replace(/ /g, '')));
      });
      if (!matchedLink) matchedLink = email.actionLinks[0];
      return `<a class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" href="${matchedLink}" target="_blank" rel="noopener" onclick="showActionLoading(this)">${action}</a>`;
    }
  }

  // Special handling for add-to-calendar actionLink
  if (action === 'add-to-calendar' && (mapCategory(email.category) === 'schedule' || mapCategory(email.category) === 'calendar')) {
    return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); addToCalendar('${email.id}')">Add to Calendar</button>`;
  }

  // If action is a URL, render as <a>
  if (isUrl(action)) {
    return `<a class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" href="${action}" target="_blank" rel="noopener" onclick="showActionLoading(this)">Open Link</a>`;
  }
  // If action is mailto, render as <a>
  if (isMailto(action)) {
    const mail = action.startsWith('mailto:') ? action : `mailto:${action}`;
    return `<a class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" href="${mail}" onclick="showActionLoading(this)">Reply</a>`;
  }
  if (actionLower.includes('archive') || actionLower.includes('dismiss')) {
    return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); archiveEmail('${email.id}')">Archive</button>`;
  }
  if (actionLower.includes('snooze') || actionLower.includes('remind')) {
    return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); snoozeEmail('${email.id}')">Snooze</button>`;
  }
  if (actionLower.includes('important') || actionLower.includes('mark')) {
    return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); markImportant('${email.id}')">Mark Important</button>`;
  }
  if (actionLower.includes('reply') || actionLower.includes('respond')) {
    return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); replyToEmail('${email.id}')">Reply</button>`;
  }
  // Default action button with generic handler
  const safeAction = action.replace(/'/g, "\\'");
  return `<button class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); handleGenericAction('${safeAction}', '${email.id}')">${action}</button>`;
}

// Enhanced Add to Calendar with modal for event details
window.addToCalendar = function(emailId) {
  // Find the email data
  const email = decodedEmails.find(e => e.id === emailId);
  if (!email) {
    console.error('Email not found for calendar injection:', emailId);
    return;
  }

  // Extract event details from email
  const eventDetails = email.eventDetails || {};
  const defaultTitle = email.subject || email.summary || 'New Event';
  const defaultDate = email.timestamp ? new Date(email.timestamp) : new Date();
  
  // Show the calendar injection modal
  showCalendarInjectionModal({
    emailId: emailId,
    title: eventDetails.title || defaultTitle,
    date: eventDetails.date || defaultDate.toISOString().split('T')[0],
    time: eventDetails.time || defaultDate.toTimeString().slice(0, 5),
    location: eventDetails.location || '',
    description: eventDetails.description || email.summary || '',
    allDay: false
  });
};

// Calendar Injection Modal
function showCalendarInjectionModal(eventData) {
  const modalHTML = `
    <div id="calendar-injection-modal" class="calendar-injection-overlay">
      <div class="calendar-injection-modal">
        <div class="calendar-injection-header">
          <h2><i data-lucide="calendar-plus"></i> Add to Calendar</h2>
          <button class="calendar-injection-close" onclick="closeCalendarInjectionModal()">×</button>
        </div>
        <div class="calendar-injection-content">
          <form id="calendar-injection-form">
            <div class="form-group">
              <label for="event-title">Event Title</label>
              <input type="text" id="event-title" value="${eventData.title}" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="event-date">Date</label>
                <input type="date" id="event-date" value="${eventData.date}" required>
              </div>
              <div class="form-group">
                <label for="event-time">Time</label>
                <input type="time" id="event-time" value="${eventData.time}">
              </div>
            </div>
            
            <div class="form-group">
              <label for="event-location">Location</label>
              <input type="text" id="event-location" value="${eventData.location}" placeholder="Optional">
            </div>
            
            <div class="form-group">
              <label for="event-description">Description</label>
              <textarea id="event-description" rows="3" placeholder="Optional">${eventData.description}</textarea>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" id="event-all-day" ${eventData.allDay ? 'checked' : ''}>
                <span class="checkmark"></span>
                All day event
              </label>
            </div>
            
            <div class="calendar-injection-actions">
              <button type="button" class="btn-secondary" onclick="closeCalendarInjectionModal()">Cancel</button>
              <button type="submit" class="btn-primary">
                <i data-lucide="calendar-plus"></i>
                Add to Calendar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  document.getElementById('calendar-injection-modal').addEventListener('click', function(e) {
    if (e.target.id === 'calendar-injection-modal') {
      closeCalendarInjectionModal();
    }
  });
  
  // Handle form submission
  document.getElementById('calendar-injection-form').addEventListener('submit', function(e) {
    e.preventDefault();
    submitCalendarEvent(eventData.emailId);
  });
  
  // Add escape key listener
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeCalendarInjectionModal();
    }
  });
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function closeCalendarInjectionModal() {
  const modal = document.getElementById('calendar-injection-modal');
  if (modal) {
    modal.remove();
  }
}

async function submitCalendarEvent(emailId) {
  const form = document.getElementById('calendar-injection-form');
  const formData = new FormData(form);
  
  const title = formData.get('event-title') || document.getElementById('event-title').value;
  const date = formData.get('event-date') || document.getElementById('event-date').value;
  const time = formData.get('event-time') || document.getElementById('event-time').value;
  const location = formData.get('event-location') || document.getElementById('event-location').value;
  const description = formData.get('event-description') || document.getElementById('event-description').value;
  const allDay = document.getElementById('event-all-day').checked;
  
  // Combine date and time
  let startDateTime = date;
  if (!allDay && time) {
    startDateTime = `${date}T${time}`;
  }
  
  // Create event data
  const eventData = {
    user_id: getCurrentUserId(),
    title: title,
    start: startDateTime,
    allDay: allDay,
    location: location || null,
    description: description || null
  };
  
  // Add end time if not all day
  if (!allDay && time) {
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    eventData.end = endDate.toISOString();
  }
  
  try {
    const response = await fetch('/api/add-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('Event added to your calendar!');
      closeCalendarInjectionModal();
      
      // Refresh calendar if it's loaded
      if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
        window.calendar.refetchEvents();
      }
      
      // Optionally switch to calendar view
      if (typeof activateView === 'function') {
        activateView('calendar');
      }
    } else if (result.duplicate) {
      showSuccess('Event already exists in your calendar!');
      closeCalendarInjectionModal();
    } else {
      showError('Failed to add event to calendar');
    }
  } catch (error) {
    console.error('Error adding event:', error);
    showError('Error adding event to calendar');
  }
}

// Make functions globally available
window.closeCalendarInjectionModal = closeCalendarInjectionModal;

// Only show the witty decode button for processing emails
function renderDecodeButtonOnly() {
  const controls = document.getElementById('dashboard-controls');
  if (controls) {
    controls.innerHTML = `<button id="process-btn" class="btn-gradient-purple" style="font-size:1.1rem;padding:1rem 2.5rem;border-radius:14px;font-weight:700;background:linear-gradient(90deg,#764ba2 0%,#667eea 100%);color:#fff;box-shadow:0 4px 16px #764ba2aa;letter-spacing:-0.01em;display:flex;align-items:center;gap:0.7rem;">
      <span style="font-size:1.5rem;">📬</span> Get your next 20 emails (and a dash of magic)
    </button>`;
    document.getElementById('process-btn').addEventListener('click', processEmails);
  }
  // Hide refresh and other controls if present
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.style.display = 'none';
  const processAgainBtn = document.getElementById('process-again-btn');
  if (processAgainBtn) processAgainBtn.style.display = 'none';
}

// Call this on decoder/dashboard load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(renderDecodeButtonOnly, 0);
} else {
  window.addEventListener('DOMContentLoaded', renderDecodeButtonOnly);
}

function createDecoderCard(email) {
  console.log('🔍 Creating decoder card for email:', email);
  const categoryKey = mapCategory(email.category);
  const category = CATEGORIES[categoryKey] || CATEGORIES.urgent;
  let dateString = 'Unknown Date';
  if (email.timestamp && !isNaN(email.timestamp)) {
    const formatted = formatTime(email.timestamp);
    if (formatted !== 'Invalid Date') dateString = formatted;
  }
  // Feedback (grading) UI
  const feedbackHtml = `<div class="decoder-feedback" style="margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
    <button class="btn-feedback" title="This was helpful" onclick="giveDecoderFeedback('${email.id}', 'positive', this)">👍</button>
    <button class="btn-feedback" title="This was not helpful" onclick="giveDecoderFeedback('${email.id}', 'negative', this)">👎</button>
  </div>`;
  // Show preview image for commerce emails
  let previewImageHtml = '';
  if (categoryKey === 'commerce') {
    if (email.previewImage) {
      previewImageHtml = `<div class="commerce-preview-img-wrapper" style="width:100%;text-align:center;margin-bottom:0.75rem;"><img src="${email.previewImage}" alt="Preview" class="commerce-preview-img" style="max-width:220px;max-height:120px;border-radius:10px;box-shadow:0 2px 8px #e0e7ff;object-fit:contain;transition:transform 0.2s;" loading="lazy"></div>`;
    } else {
      // Fallback icon
      previewImageHtml = `<div class="commerce-preview-img-wrapper" style="width:100%;text-align:center;margin-bottom:0.75rem;"><i data-lucide="shopping-bag" style="font-size:2.5rem;color:#f59e42;"></i></div>`;
    }
  }
  // Add archive button
  const archiveBtn = `<button class="btn-secondary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative;" onclick="showActionLoading(this); archiveEmail('${email.id}')">Archive</button>`;

  // --- SMART CTA LOGIC ---
  let actionBtnHtml = '';
  const uniqueLinks = Array.isArray(email.actionLinks) ? [...new Set(email.actionLinks)] : [];
  if (uniqueLinks.length && typeof uniqueLinks[0] === 'string' && uniqueLinks[0].startsWith('google-fallback:')) {
    const googleUrl = uniqueLinks[0].replace('google-fallback:', '');
    actionBtnHtml = `<a class="btn-google-fallback action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative; pointer-events: auto; z-index: 1; display: inline-flex; align-items: center; gap: 0.5rem;" href="${googleUrl}" target="_blank" rel="noopener" onclick="showActionLoading(this)" title="This link was found via Google Search"><i data-lucide='search'></i>Explore</a>`;
  } else if (uniqueLinks.length && isValidUrl(uniqueLinks[0])) {
    const label = (email.suggested_actions && email.suggested_actions.length) ? email.suggested_actions[0] : 'Open Link';
    actionBtnHtml = `<a class="btn-primary action-btn-loading" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; position: relative; pointer-events: auto; z-index: 1;" href="${uniqueLinks[0]}" target="_blank" rel="noopener" onclick="showActionLoading(this)">${label}</a>`;
  } else if (email.suggested_actions && email.suggested_actions.length) {
    actionBtnHtml = `<button class="btn-primary" style="padding: 0.5rem 1.1rem; font-size: 0.98rem; border-radius: 8px; opacity:0.7; cursor:not-allowed; pointer-events: none;" disabled title="No link available">${email.suggested_actions[0]}</button>`;
  }

  console.log('[DecoderCard Email Object]', email);

  return `
    <div class="decoder-card" data-email-id="${email.id}" style="border-radius: 14px; box-shadow: 0 2px 8px #e0e7ff; background: #fff; margin-bottom: 1.5rem; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; transition: all 0.3s ease;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="category-badge" style="background: ${category.color}; color: #fff; border-radius: 8px; padding: 0.25rem 0.75rem; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="${category.icon}"></i> ${category.label}</span>
        <span style="color: #64748b; font-size: 0.95rem; margin-left: auto;">${dateString}</span>
      </div>
      ${previewImageHtml}
      <div class="decoder-summary-text" style="font-size: 1.08rem; color: #22223b; font-weight: 500; line-height: 1.5;">${email.summary}</div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${actionBtnHtml}
        ${archiveBtn}
      </div>
      ${feedbackHtml}
    </div>
  `;
}

window.showAllDecoderEmails = function() {
  showAllEmails = true;
  renderEmailCards();
};
window.showTopDecoderEmails = function() {
  showAllEmails = false;
  renderEmailCards();
};

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
  currentCategory = category;
  renderEmailCards();
}

function updateCategoryCounts() {
  // Use same filtering logic as getFilteredSortedEmails
  const filteredEmails = decodedEmails.filter(e => {
    const hasSummary = e.summary && e.summary.trim();
    const hasActions = Array.isArray(e.suggested_actions) && e.suggested_actions.length > 0;
    return hasSummary || hasActions;
  });
  
  const counts = {
    all: filteredEmails.length,
    urgent: filteredEmails.filter(e => mapCategory(e.category) === 'urgent').length,
    schedule: filteredEmails.filter(e => mapCategory(e.category) === 'schedule').length,
    family: filteredEmails.filter(e => mapCategory(e.category) === 'family').length,
    commerce: filteredEmails.filter(e => mapCategory(e.category) === 'commerce').length,
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
    console.log('🔍 Processing emails for user:', userId);
    
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
        console.error('❌ Email processing failed:', result.error);
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
  
  // Remove the email from the display
  const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
  if (emailCard) {
    emailCard.style.opacity = '0.5';
    emailCard.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (emailCard.parentNode) {
        emailCard.parentNode.removeChild(emailCard);
      }
    }, 300);
  }
  
  // Remove from decodedEmails array
  decodedEmails = decodedEmails.filter(email => email.id !== emailId);
  
  showSuccess('Email archived');
  
  // Re-render to update counts
  updateCategoryCounts();
}

async function snoozeEmail(emailId) {
  console.log(`📧 Snoozing email: ${emailId}`);
  
  // Add visual feedback
  const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
  if (emailCard) {
    emailCard.style.opacity = '0.7';
    emailCard.style.transform = 'scale(0.98)';
    setTimeout(() => {
      emailCard.style.opacity = '1';
      emailCard.style.transform = 'scale(1)';
    }, 200);
  }
  
  showSuccess('Email snoozed for later');
}

async function markImportant(emailId) {
  console.log(`📧 Marking email as important: ${emailId}`);
  
  // Add visual feedback
  const emailCard = document.querySelector(`[data-email-id="${emailId}"]`);
  if (emailCard) {
    emailCard.style.border = '2px solid #ef4444';
    emailCard.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
    setTimeout(() => {
      emailCard.style.border = '';
      emailCard.style.boxShadow = '';
    }, 1000);
  }
  
  showSuccess('Email marked as important');
}

async function replyToEmail(emailId) {
  console.log(`📧 Replying to email: ${emailId}`);
  
  // Find the email to get sender info
  const email = decodedEmails.find(e => e.id === emailId);
  if (email && email.sender) {
    // Try to extract email address from sender
    const emailMatch = email.sender.match(/<(.+?)>/);
    const emailAddress = emailMatch ? emailMatch[1] : email.sender;
    
    // Open default mail client
    window.open(`mailto:${emailAddress}?subject=Re: ${email.subject || ''}`);
  }
  
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
  
  // Mark onboarding as complete in localStorage
  localStorage.setItem('decoderOnboardingComplete', 'true');
  
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
  // Get user email from Firebase Auth if available
  if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    const userEmail = firebase.auth().currentUser.email;
    if (userEmail) {
      console.log('🔍 Using authenticated user email:', userEmail);
      return userEmail;
    }
  }
  
  // Fallback: try to get from session storage
  const storedEmail = sessionStorage.getItem('user_email');
  if (storedEmail) {
    console.log('🔍 Using stored user email:', storedEmail);
    return storedEmail;
  }
  
  // Final fallback: prompt user for email
  const userEmail = prompt('Please enter your email address:');
  if (userEmail) {
    sessionStorage.setItem('user_email', userEmail);
    console.log('🔍 Using prompted user email:', userEmail);
    return userEmail;
  }
  
  // Last resort fallback
  console.warn('⚠️ No user email found, using test_user as fallback');
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
  console.log(`✅ ${message}`);
  
  // Create a toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
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
    console.log('🔍 Checking Gmail connection for user:', userId);
    
    // Check if we just connected Gmail (from URL parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const gmailConnected = urlParams.get('gmail_connected');
    const step = urlParams.get('step');
    const view = urlParams.get('view');
    
    if (gmailConnected === 'true' && step === 'processing') {
      console.log('🎯 Gmail just connected, moving to processing step');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      showOnboardingState();
      showWizardStep(2); // Show processing step
      return;
    }
    
    // Check session storage as fallback
    const gmailStep = sessionStorage.getItem('gmail_step');
    if (gmailStep === 'processing') {
      console.log('🎯 Gmail just connected (from session), moving to processing step');
      sessionStorage.removeItem('gmail_step');
      showOnboardingState();
      showWizardStep(2); // Show processing step
      return;
    }
    
    // Show loading state while checking
    showLoadingState();
    
    const response = await fetch(`/api/gmail/status?user_id=${userId}`);
    console.log('🔍 Gmail status response:', response.status);
    
    if (response.ok) {
      const { connected } = await response.json();
      console.log('🔍 Gmail connected status:', connected);
      
      if (!connected) {
        // Check if user has already started onboarding (has any onboarding state)
        const hasOnboardingState = sessionStorage.getItem('gmail_step') || 
                                  localStorage.getItem('decoderOnboardingComplete') === 'true' ||
                                  document.querySelector('.wizard-step[style*="display: block"]');
        
        if (hasOnboardingState) {
          // User has some onboarding state, show step 2 (processing) instead of step 1
          console.log('🔍 User has onboarding state, showing processing step');
          showOnboardingState();
          showWizardStep(2);
        } else {
          // First time user, show step 1: Gmail connection
          console.log('🔍 First time user, showing Gmail connection step');
        showOnboardingState();
        showWizardStep(1);
        }
      } else {
        // Gmail is connected, check if we have processed emails
        console.log('🔍 Gmail connected, checking for existing emails');
        loadExistingEmails(userId);
      }
    } else {
      // If we can't check status, check if user has onboarding state
      const hasOnboardingState = sessionStorage.getItem('gmail_step') || 
                                localStorage.getItem('decoderOnboardingComplete') === 'true';
      
      if (hasOnboardingState) {
        console.log('🔍 User has onboarding state, showing processing step');
        showOnboardingState();
        showWizardStep(2);
      } else {
        console.log('🔍 First time user, showing Gmail connection step');
      showOnboardingState();
      showWizardStep(1);
      }
    }
  } catch (error) {
    console.error('❌ Error checking Gmail connection:', error);
    // Check if user has onboarding state
    const hasOnboardingState = sessionStorage.getItem('gmail_step') || 
                              localStorage.getItem('decoderOnboardingComplete') === 'true';
    
    if (hasOnboardingState) {
      showOnboardingState();
      showWizardStep(2);
    } else {
    showOnboardingState();
    showWizardStep(1);
    }
  }
}

async function loadExistingEmails(userId) {
  try {
    console.log('🔍 Loading existing emails for user:', userId);
    const response = await fetch(`/api/email-decoder/emails?user_id=${userId}`);
    console.log('🔍 Load emails response:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      const rawEmails = result.emails || [];
      console.log('🔍 Found raw emails:', rawEmails.length);
      
      // Transform the email data format to match what the frontend expects
      decodedEmails = rawEmails.map(email => {
        const decodedData = email.decoded || {};
        return {
          id: email.id,
          sender: email.from || 'Unknown Sender',
          subject: email.subject || 'No Subject',
          timestamp: email.date ? new Date(email.date).getTime() : Date.now(),
          date: email.date || '',
          summary: decodedData.summary || '',
          category: decodedData.category || 'Handle Now',
          priority: decodedData.priority || 'Low',
          suggested_actions: decodedData.suggested_actions || [],
          tone: decodedData.tone || 'Routine'
        };
      });
      
      console.log('🔍 Transformed emails:', decodedEmails.length);
      
      if (decodedEmails.length === 0) {
        // Check if onboarding is already complete
        const onboardingComplete = localStorage.getItem('decoderOnboardingComplete') === 'true';
        if (onboardingComplete) {
          // User has completed onboarding but no emails found, show zero state
          console.log('🔍 Onboarding complete but no emails, showing zero state');
          showZeroState();
        } else {
          // No emails found and onboarding not complete, show processing step
          console.log('🔍 No emails found and onboarding not complete, showing processing step');
        showOnboardingState();
        showWizardStep(2); // Show processing step
        }
      } else {
        // Emails found, show the main decoder
        console.log('🔍 Emails found, showing main decoder');
        hideAllStates();
        showEmailCards();
      }
    } else {
      // If we can't load emails, check onboarding status
      const onboardingComplete = localStorage.getItem('decoderOnboardingComplete') === 'true';
      if (onboardingComplete) {
        console.log('🔍 Onboarding complete but can\'t load emails, showing zero state');
        showZeroState();
      } else {
        console.log('🔍 Can\'t load emails and onboarding not complete, showing processing step');
      showOnboardingState();
      showWizardStep(2); // Show processing step
      }
    }
  } catch (error) {
    console.error('❌ Error loading existing emails:', error);
    const onboardingComplete = localStorage.getItem('decoderOnboardingComplete') === 'true';
    if (onboardingComplete) {
      showZeroState();
    } else {
    showOnboardingState();
    showWizardStep(2); // Show processing step
    }
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

// Debug function to check Gmail tokens
async function debugTokens() {
  try {
    const userId = getCurrentUserId();
    console.log('🔍 Debug: Checking tokens for user:', userId);
    
    const response = await fetch(`/api/gmail/debug-tokens?user_id=${userId}`);
    const result = await response.json();
    
    console.log('🔍 Debug result:', result);
    
    if (result.exists) {
      console.log('✅ Tokens found:', result.tokenData);
      alert(`Tokens found!\nAccess Token: ${result.tokenData.hasAccessToken}\nRefresh Token: ${result.tokenData.hasRefreshToken}\nExpired: ${result.tokenData.isExpired}`);
    } else {
      console.log('❌ No tokens found');
      console.log('Total tokens in DB:', result.totalTokensInDB);
      console.log('Token IDs:', result.tokenIds);
      alert(`No tokens found for ${userId}\nTotal tokens in DB: ${result.totalTokensInDB}\nToken IDs: ${result.tokenIds.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Debug error:', error);
    alert(`Debug error: ${error.message}`);
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
window.debugTokens = debugTokens;
window.addToCalendar = addToCalendar;

// Generic action handler for actions that don't have specific handlers
window.handleGenericAction = function(action, emailId) {
  console.log('🔍 Handling generic action:', action, 'for email:', emailId);
  showSuccess(`Action "${action}" completed for email ${emailId}`);
};

// Global function to initialize decoder when dashboard view is activated
window.initializeDashboardDecoder = function() {
  console.log('🎯 Dashboard view activated, initializing decoder...');
  
  // Check if we already have emails loaded and should preserve state
  if (decodedEmails.length > 0) {
    console.log('🔍 Emails already loaded, preserving current state');
    hideAllStates();
    showEmailCards();
    return;
  }
  
  setTimeout(() => {
    initializeDecoder();
    setupEventListeners();
    checkInitialState();
    addInsightsSections(); // Add insights and recommendations sections
  }, 100); // Small delay to ensure DOM is ready
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
  console.log('🎓 Training completed, transitioning to full decoder...');
  // Hide training mode
  const trainingMode = document.getElementById('training-mode');
  if (trainingMode) {
    trainingMode.style.display = 'none';
  }
  // Mark onboarding as complete in localStorage
  localStorage.setItem('decoderOnboardingComplete', 'true');
  console.log('✅ Set decoderOnboardingComplete in localStorage');
  // Show the full decoder with the 4 categories
  showEmailCards();
}

function finishOnboarding() {
  console.log('🎉 Onboarding finished - showing main decoder');
  // Mark onboarding as complete in localStorage
  localStorage.setItem('decoderOnboardingComplete', 'true');
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
  // After successful connection, advance to personalization step
  setTimeout(() => {
    showWizardStep(2);
  }, 2000); // Give time for connection to complete
};

// Save personalization data and continue to next step
window.savePersonalizationAndContinue = function() {
  console.log('💾 Saving personalization data...');
  
  // Collect all the keyword inputs
  const personalizationData = {
    school_keywords: document.getElementById('school-keywords')?.value || '',
    family_keywords: document.getElementById('family-keywords')?.value || '',
    healthcare_keywords: document.getElementById('healthcare-keywords')?.value || '',
    work_keywords: document.getElementById('work-keywords')?.value || '',
    business_keywords: document.getElementById('business-keywords')?.value || '',
    shopping_keywords: document.getElementById('shopping-keywords')?.value || '',
    services_keywords: document.getElementById('services-keywords')?.value || '',
    user_id: getCurrentUserId(),
    timestamp: new Date().toISOString()
  };
  
  console.log('💾 Personalization data:', personalizationData);
  
  // Save to localStorage for immediate use
  localStorage.setItem('userPersonalization', JSON.stringify(personalizationData));
  
  // Save to backend for persistence
  fetch('/api/user-preferences/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(personalizationData)
  }).then(response => {
    if (response.ok) {
      console.log('✅ Personalization data saved successfully');
    } else {
      console.error('❌ Failed to save personalization data');
    }
  }).catch(error => {
    console.error('❌ Error saving personalization data:', error);
  });
  
  // Continue to next step (email processing)
  showWizardStep(3);
};

// Load personalization data when step 2 is shown
function loadPersonalizationData() {
  const savedData = localStorage.getItem('userPersonalization');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      if (data.school_keywords) document.getElementById('school-keywords').value = data.school_keywords;
      if (data.family_keywords) document.getElementById('family-keywords').value = data.family_keywords;
      if (data.healthcare_keywords) document.getElementById('healthcare-keywords').value = data.healthcare_keywords;
      if (data.work_keywords) document.getElementById('work-keywords').value = data.work_keywords;
      if (data.business_keywords) document.getElementById('business-keywords').value = data.business_keywords;
      if (data.shopping_keywords) document.getElementById('shopping-keywords').value = data.shopping_keywords;
      if (data.services_keywords) document.getElementById('services-keywords').value = data.services_keywords;
    } catch (error) {
      console.error('❌ Error loading personalization data:', error);
    }
  }
}

// Update the showWizardStep function to load personalization data when step 2 is shown
const originalShowWizardStep = window.showWizardStep;
window.showWizardStep = function(stepNumber) {
  // Call the original function
  if (originalShowWizardStep) {
    originalShowWizardStep(stepNumber);
  }
  
  // Load personalization data when step 2 is shown
  if (stepNumber === 2) {
    setTimeout(loadPersonalizationData, 100);
}
};

// 🎯 STATE CONTAINERS */ 

// Category mapping from backend/GPT to frontend keys
function mapCategory(category) {
  switch (category) {
    case 'Commerce Inbox': return 'commerce';
    case 'On the Calendar': return 'schedule';
    case 'Handle Now': return 'urgent';
    case 'Household Signals': return 'family';
    default: return 'urgent';
  }
}

// Feedback handler with intelligent learning
window.giveDecoderFeedback = function(emailId, feedback, btn) {
  // Find the email data to send context
  const email = decodedEmails.find(e => e.id === emailId);
  if (!email) {
    console.error('❌ Email not found for feedback:', emailId);
    return;
  }
  
  // Extract sender domain for better learning
  const senderDomain = email.sender ? email.sender.split('@')[1]?.split('>')[0] : '';
  
  const feedbackData = {
    emailId,
    feedback, // 'positive' or 'negative'
    userId: getCurrentUserId(),
    // Context for intelligent learning
    emailContext: {
      sender: email.sender,
      senderDomain: senderDomain,
      subject: email.subject,
      category: email.category,
      priority: email.priority,
      tone: email.tone,
      summary: email.summary,
      suggestedActions: email.suggested_actions || []
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('🎓 Sending intelligent feedback:', feedbackData);
  
  fetch('/api/decoder-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData)
  }).then(response => {
    if (response.ok) {
      console.log('✅ Feedback sent successfully');
    } else {
      console.error('❌ Failed to send feedback');
    }
  }).catch(error => {
    console.error('❌ Error sending feedback:', error);
  });
  
  // Visual confirmation: fade out buttons and show thank you
  if (btn && btn.parentElement) {
    btn.parentElement.innerHTML = '<span style="color:#22c55e;font-weight:600;">Thanks for your feedback!</span>';
  }
}; // Force deployment - Tue Jul  1 22:06:28 EDT 2025

// Load and display user insights and recommendations
async function loadUserInsights() {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`/api/user-preferences/${userId}`);
    const data = await response.json();
    
    if (data.insights && data.insights.length > 0) {
      displayInsights(data.insights);
    }
    
    // Load recommendations
    const recResponse = await fetch(`/api/user-recommendations/${userId}`);
    const recData = await recResponse.json();
    
    if (recData.recommendations && recData.recommendations.length > 0) {
      displayRecommendations(recData.recommendations);
    }
    
  } catch (error) {
    console.error('❌ Error loading user insights:', error);
  }
}

// Display insights in a dedicated section
function displayInsights(insights) {
  const insightsContainer = document.getElementById('user-insights');
  if (!insightsContainer) return;
  
  const insightsHtml = insights.map(insight => {
    const insightHtml = insight.insights.map(i => `
      <div class="insight-item" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 8px 0; border-radius: 4px;">
        <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">
          ${i.type === 'domain_preference' ? '🌐 Domain Preference' : '📂 Category Preference'}
        </div>
        <div style="color: #374151; font-size: 14px;">${i.message}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          Confidence: ${i.confidence}%
        </div>
      </div>
    `).join('');
    
    return `
      <div class="insight-group" style="margin-bottom: 16px;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          ${new Date(insight.timestamp.toDate()).toLocaleDateString()}
        </div>
        ${insightHtml}
      </div>
    `;
  }).join('');
  
  insightsContainer.innerHTML = insightsHtml;
  insightsContainer.style.display = 'block';
}

// Display recommendations
function displayRecommendations(recommendations) {
  const recContainer = document.getElementById('user-recommendations');
  if (!recContainer) return;
  
  const recHtml = recommendations.map(rec => `
    <div class="recommendation-item" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; margin: 8px 0; border-radius: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #166534; margin-bottom: 4px;">
            ${rec.type === 'unsubscribe_suggestion' ? '🚫 Unsubscribe Suggestion' : 
              rec.type === 'priority_suggestion' ? '⭐ Priority Suggestion' :
              rec.type === 'category_adjustment' ? '⚙️ Category Adjustment' : '💡 Recommendation'}
          </div>
          <div style="color: #374151; font-size: 14px; margin-bottom: 4px;">${rec.message}</div>
          <div style="font-size: 12px; color: #6b7280;">Confidence: ${rec.confidence}%</div>
        </div>
        <button onclick="handleRecommendation('${rec.action}', '${rec.domain || rec.category}')" 
                style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
          ${rec.action === 'unsubscribe' ? 'Unsubscribe' : 
            rec.action === 'prioritize' ? 'Prioritize' : 
            rec.action === 'filter' ? 'Filter' : 'Apply'}
        </button>
      </div>
    </div>
  `).join('');
  
  recContainer.innerHTML = recHtml;
  recContainer.style.display = 'block';
}

// Handle recommendation actions
window.handleRecommendation = function(action, target) {
  console.log('🎯 Handling recommendation:', action, 'for:', target);
  
  switch (action) {
    case 'unsubscribe':
      showSuccess(`Unsubscribe request sent for ${target}. Check your email for confirmation.`);
      break;
    case 'prioritize':
      showSuccess(`${target} emails will now be prioritized in your inbox.`);
      break;
    case 'filter':
      showSuccess(`Filtering settings updated for ${target} emails.`);
      break;
    default:
      showSuccess(`Recommendation applied for ${target}.`);
  }
  
  // TODO: Implement actual actions (unsubscribe, filter, etc.)
};

// Add insights and recommendations sections to the dashboard
function addInsightsSections() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent) return;
  
  // Add insights section
  const insightsSection = document.createElement('div');
  insightsSection.id = 'user-insights';
  insightsSection.style.display = 'none';
  insightsSection.innerHTML = `
    <div style="margin: 20px 0;">
      <h3 style="color: #1f2937; margin-bottom: 12px;">🧠 Your Email Insights</h3>
      <div class="insights-content"></div>
    </div>
  `;
  
  // Add recommendations section
  const recSection = document.createElement('div');
  recSection.id = 'user-recommendations';
  recSection.style.display = 'none';
  recSection.innerHTML = `
    <div style="margin: 20px 0;">
      <h3 style="color: #1f2937; margin-bottom: 12px;">💡 Personalized Recommendations</h3>
      <div class="recommendations-content"></div>
    </div>
  `;
  
  // Insert after the main content
  dashboardContent.appendChild(insightsSection);
  dashboardContent.appendChild(recSection);
  
  // Load insights after a delay to ensure user has given some feedback
  setTimeout(() => {
    loadUserInsights();
  }, 2000);
}

// Add loading state to action buttons
window.showActionLoading = function(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('loading');
  const spinner = document.createElement('span');
  spinner.className = 'action-btn-spinner';
  spinner.style.cssText = 'margin-left:8px;display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top:2px solid #3b82f6;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;';
  btn.appendChild(spinner);
  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (spinner.parentNode) spinner.parentNode.removeChild(spinner);
  }, 1200);
};
