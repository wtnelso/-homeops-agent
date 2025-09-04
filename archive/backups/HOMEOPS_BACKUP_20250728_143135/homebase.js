// HomeOps Email Decoder Engine - Premium UI Refactor
(function() {
  const LUCIDE_ICON_URL = 'https://unpkg.com/lucide-static@0.303.0/icons/';
  const COLUMN_CONFIG = [
    {
      key: 'urgent',
      title: 'Urgent & Actionable',
      icon: 'alert-triangle',
      filter: email => email.priority === 'High' || email.priority === 'Urgent' || email.category === 'Delivery',
    },
    {
      key: 'schedule',
      title: 'Appointments & Schedule',
      icon: 'calendar-days',
      filter: email => (email.dates && email.dates.length) || email.category === 'School',
    },
    {
      key: 'context',
      title: 'Family & Context',
      icon: 'users',
      filter: email => !((email.priority === 'High' || email.priority === 'Urgent' || email.category === 'Delivery') || ((email.dates && email.dates.length) || email.category === 'School')),
    },
  ];

  function icon(name, cls = '') {
    return `<img src="${LUCIDE_ICON_URL}${name}.svg" class="lucide ${cls}" alt="${name}" loading="lazy" />`;
  }

  function tagChip(tag) {
    return `<span class="decoder-tag">${icon(tagToIcon(tag), 'lucide-tag')} ${tag}</span>`;
  }
  function tagToIcon(tag) {
    const map = {
      School: 'graduation-cap',
      Event: 'calendar-days',
      Kids: 'baby',
      Amazon: 'package',
      Delivery: 'truck',
      Doctor: 'stethoscope',
      Health: 'heart-pulse',
      Shopping: 'shopping-bag',
      Soccer: 'football',
      RSVP: 'mail',
      Calendar: 'calendar-plus',
      Family: 'users',
      Context: 'users',
    };
    return map[tag] || 'tag';
  }
  function priorityIcon(priority) {
    if (!priority) return '';
    const map = {
      Urgent: 'alert-triangle',
      High: 'arrow-up-circle',
      Medium: 'minus-circle',
      Low: 'arrow-down-circle',
    };
    return icon(map[priority] || 'info', 'lucide-priority');
  }

  function renderCard(email) {
    return `<div class="decoder-card">
      <div class="decoder-card-header">
        ${priorityIcon(email.priority)}
        <span class="decoder-card-sender">${email.sender}</span>
      </div>
      <div class="decoder-card-subject">${email.subject}</div>
      <div class="decoder-card-summary">${email.summary}</div>
      <div class="decoder-card-tags">
        ${(email.tags || []).map(tagChip).join('')}
      </div>
      <div class="decoder-card-actions">
        ${(email.actions || []).map(action => `<button class="decoder-action-btn" onclick="console.log('Action:', '${action}', '${email.id}')">${action}</button>`).join('')}
      </div>
      <div class="decoder-card-footer">
        <div class="decoder-feedback">
          <button class="decoder-feedback-btn" title="Helpful" onclick="console.log('Feedback: up', '${email.id}')">${icon('thumbs-up')}</button>
          <button class="decoder-feedback-btn" title="Not relevant" onclick="console.log('Feedback: down', '${email.id}')">${icon('thumbs-down')}</button>
        </div>
        <div class="decoder-card-dates">
          ${(email.dates || []).map(d => `<span>${icon('calendar', 'lucide-date')}<span>${d.label}: ${d.date}</span></span>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderDashboard(emails) {
    return `<div class="decoder-dashboard">
      ${COLUMN_CONFIG.map(col => `
        <div class="decoder-col">
          <div class="decoder-col-header">${icon(col.icon)} ${col.title}</div>
          ${emails.filter(col.filter).map(renderCard).join('') || '<div style="color:#cbd5e1;font-size:1rem;padding:1.5rem 0 0 0;">No emails in this category.</div>'}
        </div>
      `).join('')}
    </div>`;
  }

  async function loadEmails() {
    try {
      const res = await fetch('/mock/emails.json');
      return await res.json();
    } catch (e) {
      return [];
    }
  }

  async function init(container) {
    const emails = await loadEmails();
    container.innerHTML = renderDashboard(emails);
  }

  // Attach to window for dashboard integration
  window.HomeBaseComponent = { init };

  // Auto-init if container exists
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('homebase-container');
    if (container) window.HomeBaseComponent.init(container);
  });
})();
