# HubSpot Integration Guide for HomeOps

## Google OAuth Verification Fixes

### 1. Privacy Policy Link (FIXED)
Your existing privacy policy at https://homeops.ai/privacy-policy-homeops.ai is excellent and meets Google's requirements.

### 2. HubSpot Landing Pages Setup

#### A. Privacy Policy Page (Already exists)
- URL: https://homeops.ai/privacy-policy-homeops.ai
- Status: ✅ Complete and compliant
- Content: Covers Gmail data access, Limited Use requirements, user rights

#### B. Terms of Service Page (Need to create)
Create a new HubSpot landing page:

**Page Settings:**
- URL: `https://homeops.ai/terms-of-service`
- Title: "Terms of Service - HomeOps"
- Meta Description: "Terms of Service for HomeOps - The Operating System for Modern Family Life"

**Content Structure:**
```html
<h1>Terms of Service</h1>
<p>Last updated: January 2025</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using HomeOps ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Description of Service</h2>
<p>HomeOps is an AI-powered family management platform that helps organize and manage family life by processing email data, managing calendars, and providing intelligent assistance for daily tasks and appointments.</p>

<h2>3. Data Access and Permissions</h2>
<p>Our Service requires access to your Gmail account to provide email processing and calendar management features. By using our Service, you:</p>
<ul>
    <li>Grant us permission to access your Gmail data</li>
    <li>Understand that we will process your emails to extract relevant information</li>
    <li>Consent to the creation and management of calendar events based on email content</li>
    <li>Can revoke these permissions at any time through your Google account settings</li>
</ul>

<h2>4. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us:</p>
<ul>
    <li>Email: legal@homeops.ai</li>
    <li>Support: support@homeops.ai</li>
</ul>
```

#### C. Homepage Updates (Critical for Google OAuth)
Update your main homepage to include:

**Footer Section:**
```html
<footer class="footer">
    <div class="footer-links">
        <a href="/privacy-policy-homeops.ai">Privacy Policy</a>
        <a href="/terms-of-service">Terms of Service</a>
        <a href="mailto:support@homeops.ai">Contact Us</a>
    </div>
    <p>&copy; 2025 HomeOps. All rights reserved.</p>
</footer>
```

**Hero Section (if not already present):**
```html
<section class="hero">
    <h1>The Operating System for Modern Family Life</h1>
    <p>HomeOps gives high-performing families a shared operating system — one that organizes the chaos, reduces the mental load, and helps you run home life with clarity and confidence.</p>
    <a href="https://app.homeops.ai" class="cta-button">Get Started</a>
</section>
```

### 3. Google Cloud Console Updates

#### A. OAuth App Configuration
Update your Google Cloud Console OAuth app with:

**Homepage URL:**
```
https://homeops.ai
```

**Privacy Policy URL:**
```
https://homeops.ai/privacy-policy-homeops.ai
```

**Terms of Service URL:**
```
https://homeops.ai/terms-of-service
```

#### B. Authorized Domains
Add these domains to your OAuth app:
- `homeops.ai`
- `app.homeops.ai` (if your app is hosted separately)

### 4. Demo Video Requirements

Create a 3-minute demo video showing:

**Part 1: OAuth Flow (30 seconds)**
- User clicks "Connect Gmail" 
- Google consent screen appears
- User grants permissions
- Success confirmation

**Part 2: App Functionality (2.5 minutes)**
- Dashboard overview
- Email processing demonstration
- Calendar event creation from emails
- Chat agent interaction
- Family task management
- Email decoder engine

### 5. HubSpot Page Templates

#### Privacy Policy Template
```html
<!-- HubSpot Module: Privacy Policy -->
<div class="privacy-policy">
    <div class="container">
        <h1>📄 HomeOps.ai Privacy Policy</h1>
        <p><strong>Effective Date:</strong> June 1, 2025</p>
        
        <h2>🔒 Overview</h2>
        <p>HomeOps.ai is a personal productivity assistant that connects to your Gmail account to extract and organize household tasks — such as calendar invites, reminders, RSVPs, order confirmations, and logistics-related information.</p>
        
        <h2>📥 What We Access</h2>
        <p>If you connect your Gmail account, we request access to:</p>
        <ul>
            <li>Your email metadata (subject lines, senders, timestamps)</li>
            <li>Content from emails related to personal logistics</li>
        </ul>
        <p>We <strong>only</strong> use the <code>gmail.readonly</code> scope and do <strong>not</strong> modify, send, or delete emails.</p>
        
        <h2>👤 Contact</h2>
        <p>If you have questions, contact us at: <strong>support@homeops.ai</strong></p>
    </div>
</div>
```

#### Terms of Service Template
```html
<!-- HubSpot Module: Terms of Service -->
<div class="terms-of-service">
    <div class="container">
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> January 2025</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using HomeOps ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2>2. Description of Service</h2>
        <p>HomeOps is an AI-powered family management platform that helps organize and manage family life by processing email data, managing calendars, and providing intelligent assistance for daily tasks and appointments.</p>
        
        <h2>3. Data Access and Permissions</h2>
        <p>Our Service requires access to your Gmail account to provide email processing and calendar management features.</p>
        
        <h2>4. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us:</p>
        <ul>
            <li>Email: legal@homeops.ai</li>
            <li>Support: support@homeops.ai</li>
        </ul>
    </div>
</div>
```

### 6. CSS Styling for HubSpot Pages

Add this CSS to your HubSpot theme:

```css
/* Privacy Policy & Terms of Service Styling */
.privacy-policy,
.terms-of-service {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.privacy-policy h1,
.terms-of-service h1 {
    color: #667eea;
    font-size: 2.5rem;
    margin-bottom: 20px;
    text-align: center;
}

.privacy-policy h2,
.terms-of-service h2 {
    color: #333;
    border-bottom: 2px solid #667eea;
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 20px;
}

.privacy-policy ul,
.terms-of-service ul {
    margin-left: 20px;
    margin-bottom: 20px;
}

.privacy-policy li,
.terms-of-service li {
    margin-bottom: 8px;
}

.privacy-policy code,
.terms-of-service code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

/* Footer Styling */
.footer {
    background: #333;
    color: white;
    padding: 40px 20px;
    text-align: center;
    margin-top: 60px;
}

.footer-links {
    margin-bottom: 20px;
}

.footer-links a {
    color: #ccc;
    text-decoration: none;
    margin: 0 15px;
    transition: color 0.3s ease;
}

.footer-links a:hover {
    color: white;
}

/* CTA Button Styling */
.cta-button {
    background: #ff6b6b;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s ease;
}

.cta-button:hover {
    background: #ff5252;
    transform: translateY(-2px);
    color: white;
    text-decoration: none;
}
```

### 7. Implementation Checklist

- [ ] Create Terms of Service page in HubSpot
- [ ] Update homepage footer with privacy policy links
- [ ] Add proper CSS styling to HubSpot theme
- [ ] Update Google Cloud Console OAuth app URLs
- [ ] Create demo video showing OAuth flow and app functionality
- [ ] Test all links work correctly
- [ ] Submit for Google OAuth verification

### 8. Testing

After implementation, test:
1. Privacy policy link works: https://homeops.ai/privacy-policy-homeops.ai
2. Terms of service link works: https://homeops.ai/terms-of-service
3. Homepage loads correctly with footer links
4. OAuth flow works in your app
5. All pages are mobile-responsive

### 9. Google OAuth Verification Submission

When submitting for verification, include:
- Homepage URL: https://homeops.ai
- Privacy Policy URL: https://homeops.ai/privacy-policy-homeops.ai
- Terms of Service URL: https://homeops.ai/terms-of-service
- Demo video showing OAuth flow and app functionality
- Clear explanation of how your app uses Gmail data

This setup should resolve all the Google OAuth verification issues while maintaining your HubSpot CMS workflow. 