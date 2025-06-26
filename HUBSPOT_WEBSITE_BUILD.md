# Complete HubSpot Website Build for HomeOps

## Overview
This guide will help you create a complete HomeOps website in HubSpot with all necessary pages for Google OAuth verification and a professional online presence.

## Website Structure

### 1. Homepage (Main Landing Page)
**URL:** `https://homeops.ai`
**Purpose:** Main entry point, explains the product, includes privacy policy links

### 2. Privacy Policy Page
**URL:** `https://homeops.ai/privacy-policy-homeops.ai`
**Status:** ✅ Already exists and is perfect

### 3. Terms of Service Page
**URL:** `https://homeops.ai/terms-of-service`
**Purpose:** Required for Google OAuth verification

### 4. Product Page
**URL:** `https://homeops.ai/product`
**Purpose:** Detailed product information and features

### 5. About Page
**URL:** `https://homeops.ai/about`
**Purpose:** Company information and team

### 6. Contact Page
**URL:** `https://homeops.ai/contact`
**Purpose:** Contact information and support

---

## Page 1: Homepage

### Page Settings
- **Page Name:** HomeOps - The Operating System for Modern Family Life
- **URL:** `https://homeops.ai`
- **Meta Title:** HomeOps - The Operating System for Modern Family Life
- **Meta Description:** HomeOps gives high-performing families a shared operating system — one that organizes the chaos, reduces the mental load, and helps you run home life with clarity and confidence.

### Content Structure

#### Hero Section
```html
<section class="hero-section">
    <div class="container">
        <div class="hero-content">
            <h1>The Operating System for Modern Family Life</h1>
            <p class="hero-subtitle">HomeOps gives high-performing families a shared operating system — one that organizes the chaos, reduces the mental load, and helps you run home life with clarity and confidence.</p>
            <div class="hero-buttons">
                <a href="https://app.homeops.ai" class="cta-button primary">Get Started</a>
                <a href="/product" class="cta-button secondary">Learn More</a>
            </div>
        </div>
        <div class="hero-image">
            <!-- Add a screenshot or mockup of your app dashboard -->
        </div>
    </div>
</section>
```

#### Features Section
```html
<section class="features-section">
    <div class="container">
        <h2>How HomeOps Works</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📧</div>
                <h3>Connect your inbox</h3>
                <p>No forms. No setup. Just link your Gmail and let HomeOps do the rest. It quietly scans for what matters — like upcoming appointments, delivery alerts, RSVPs, and anything else you're probably forgetting.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>A Dashboard for Real Life</h3>
                <p>Not a task app. Not a calendar. HomeOps pulls everything that matters from your inbox — appointments, RSVPs, reminders, errands, reorders — and turns it into a clean, personalized feed.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <h3>Let the Agent Act</h3>
                <p>HomeOps doesn't just organize your life — it moves it forward. Need to RSVP? Confirm an appointment? Reorder something you're low on? Just tap, and it's handled.</p>
            </div>
        </div>
    </div>
</section>
```

#### Social Proof Section
```html
<section class="social-proof-section">
    <div class="container">
        <h2>Trusted by leading companies</h2>
        <div class="logos-grid">
            <!-- Add company logos here -->
        </div>
    </div>
</section>
```

#### Footer
```html
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h4>HomeOps</h4>
                <p>The Operating System for Modern Family Life</p>
            </div>
            <div class="footer-section">
                <h4>Product</h4>
                <ul>
                    <li><a href="/product">Features</a></li>
                    <li><a href="/pricing">Pricing</a></li>
                    <li><a href="https://app.homeops.ai">Get Started</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Company</h4>
                <ul>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                    <li><a href="/careers">Careers</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Legal</h4>
                <ul>
                    <li><a href="/privacy-policy-homeops.ai">Privacy Policy</a></li>
                    <li><a href="/terms-of-service">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 HomeOps. All rights reserved.</p>
        </div>
    </div>
</footer>
```

---

## Page 2: Terms of Service

### Page Settings
- **Page Name:** Terms of Service - HomeOps
- **URL:** `https://homeops.ai/terms-of-service`
- **Meta Title:** Terms of Service - HomeOps
- **Meta Description:** Terms of Service for HomeOps - The Operating System for Modern Family Life

### Content
```html
<div class="legal-page">
    <div class="container">
        <h1>Terms of Service</h1>
        <p class="last-updated">Last updated: January 2025</p>
        
        <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using HomeOps ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        </section>
        
        <section>
            <h2>2. Description of Service</h2>
            <p>HomeOps is an AI-powered family management platform that helps organize and manage family life by processing email data, managing calendars, and providing intelligent assistance for daily tasks and appointments.</p>
        </section>
        
        <section>
            <h2>3. User Accounts</h2>
            <p>To use our Service, you must:</p>
            <ul>
                <li>Be at least 18 years old or have parental consent</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
            </ul>
        </section>
        
        <section>
            <h2>4. Data Access and Permissions</h2>
            <p>Our Service requires access to your Gmail account to provide email processing and calendar management features. By using our Service, you:</p>
            <ul>
                <li>Grant us permission to access your Gmail data</li>
                <li>Understand that we will process your emails to extract relevant information</li>
                <li>Consent to the creation and management of calendar events based on email content</li>
                <li>Can revoke these permissions at any time through your Google account settings</li>
            </ul>
        </section>
        
        <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the Service</li>
            </ul>
        </section>
        
        <section>
            <h2>6. Privacy and Data Protection</h2>
            <p>Your privacy is important to us. Our collection and use of your personal information is governed by our <a href="/privacy-policy-homeops.ai">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
        </section>
        
        <section>
            <h2>7. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <ul>
                <li>Email: legal@homeops.ai</li>
                <li>Support: support@homeops.ai</li>
            </ul>
        </section>
    </div>
</div>
```

---

## Page 3: Product Page

### Page Settings
- **Page Name:** Product - HomeOps
- **URL:** `https://homeops.ai/product`
- **Meta Title:** Product - HomeOps | AI-Powered Family Management
- **Meta Description:** Discover how HomeOps transforms email chaos into organized family life with AI-powered email processing and smart calendar management.

### Content
```html
<div class="product-page">
    <section class="product-hero">
        <div class="container">
            <h1>Your Personal AI Operating System</h1>
            <p>Transform your inbox into an organized, actionable family management system.</p>
            <a href="https://app.homeops.ai" class="cta-button">Start Free Trial</a>
        </div>
    </section>
    
    <section class="product-features">
        <div class="container">
            <h2>Key Features</h2>
            <div class="features-grid">
                <div class="feature">
                    <h3>📧 Email Decoder Engine</h3>
                    <p>AI-powered email processing that extracts appointments, RSVPs, delivery alerts, and more from your inbox.</p>
                </div>
                <div class="feature">
                    <h3>📅 Smart Calendar Integration</h3>
                    <p>Automatically creates calendar events from email content with proper timezone handling.</p>
                </div>
                <div class="feature">
                    <h3>🤖 AI Chat Assistant</h3>
                    <p>Natural language interface for managing tasks, scheduling, and getting family insights.</p>
                </div>
                <div class="feature">
                    <h3>👨‍👩‍👧‍👦 Family Coordination</h3>
                    <p>Shared dashboard for family members to stay synchronized on schedules and tasks.</p>
                </div>
            </div>
        </div>
    </section>
    
    <section class="how-it-works">
        <div class="container">
            <h2>How It Works</h2>
            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <h3>Connect Gmail</h3>
                    <p>Securely link your Gmail account with one-click OAuth authentication.</p>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <h3>AI Processing</h3>
                    <p>Our AI scans your emails to identify important family-related information.</p>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <h3>Organized Dashboard</h3>
                    <p>View all your family's tasks, appointments, and reminders in one clean interface.</p>
                </div>
            </div>
        </div>
    </section>
</div>
```

---

## Page 4: About Page

### Page Settings
- **Page Name:** About - HomeOps
- **URL:** `https://homeops.ai/about`
- **Meta Title:** About HomeOps | The Operating System for Modern Family Life
- **Meta Description:** Learn about HomeOps and our mission to help high-performing families organize their lives with AI-powered family management.

### Content
```html
<div class="about-page">
    <section class="about-hero">
        <div class="container">
            <h1>About HomeOps</h1>
            <p class="mission">We're building the operating system for modern family life.</p>
        </div>
    </section>
    
    <section class="our-story">
        <div class="container">
            <h2>Our Story</h2>
            <p>HomeOps was born from a simple observation: modern families are drowning in email chaos. Between school updates, doctor appointments, delivery confirmations, and social invitations, the average family receives hundreds of emails each week that require attention.</p>
            <p>We believe that families deserve better than spending their precious time digging through inboxes and manually organizing their lives. That's why we built HomeOps — an AI-powered system that transforms email chaos into organized, actionable family management.</p>
        </div>
    </section>
    
    <section class="our-mission">
        <div class="container">
            <h2>Our Mission</h2>
            <p>To give high-performing families the tools they need to run their homes with clarity and confidence, so they can spend less time managing life and more time living it.</p>
        </div>
    </section>
    
    <section class="our-values">
        <div class="container">
            <h2>Our Values</h2>
            <div class="values-grid">
                <div class="value">
                    <h3>Family First</h3>
                    <p>Everything we build is designed to strengthen family bonds and reduce stress.</p>
                </div>
                <div class="value">
                    <h3>Privacy by Design</h3>
                    <p>We believe your family's data should be private, secure, and under your control.</p>
                </div>
                <div class="value">
                    <h3>AI for Good</h3>
                    <p>We use artificial intelligence to solve real family problems, not just for the sake of technology.</p>
                </div>
            </div>
        </div>
    </section>
</div>
```

---

## Page 5: Contact Page

### Page Settings
- **Page Name:** Contact - HomeOps
- **URL:** `https://homeops.ai/contact`
- **Meta Title:** Contact HomeOps | Get Support
- **Meta Description:** Get in touch with the HomeOps team for support, questions, or feedback.

### Content
```html
<div class="contact-page">
    <section class="contact-hero">
        <div class="container">
            <h1>Get in Touch</h1>
            <p>We'd love to hear from you. Here's how to reach us.</p>
        </div>
    </section>
    
    <section class="contact-methods">
        <div class="container">
            <div class="contact-grid">
                <div class="contact-method">
                    <h3>📧 Email Support</h3>
                    <p>For general questions and support:</p>
                    <a href="mailto:support@homeops.ai">support@homeops.ai</a>
                </div>
                <div class="contact-method">
                    <h3>⚖️ Legal Inquiries</h3>
                    <p>For legal and privacy questions:</p>
                    <a href="mailto:legal@homeops.ai">legal@homeops.ai</a>
                </div>
                <div class="contact-method">
                    <h3>🤝 Partnerships</h3>
                    <p>For business partnerships:</p>
                    <a href="mailto:partnerships@homeops.ai">partnerships@homeops.ai</a>
                </div>
            </div>
        </div>
    </section>
    
    <section class="contact-form">
        <div class="container">
            <h2>Send us a Message</h2>
            <!-- Add HubSpot contact form here -->
            <div class="hubspot-form">
                <!-- HubSpot will generate the form code -->
            </div>
        </div>
    </section>
</div>
```

---

## CSS Styling for All Pages

Add this CSS to your HubSpot theme:

```css
/* Global Styles */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #ff6b6b;
    --text-color: #333;
    --light-gray: #f8f9fa;
    --border-color: #e9ecef;
}

* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Hero Section */
.hero-section {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    padding: 80px 0;
    text-align: center;
}

.hero-content h1 {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 20px;
}

.hero-subtitle {
    font-size: 1.5rem;
    margin-bottom: 40px;
    opacity: 0.9;
}

.hero-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

/* CTA Buttons */
.cta-button {
    padding: 15px 30px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.cta-button.primary {
    background: var(--accent-color);
    color: white;
}

.cta-button.secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

/* Features Section */
.features-section {
    padding: 80px 0;
    background: var(--light-gray);
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
    margin-top: 40px;
}

.feature-card {
    background: white;
    padding: 40px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    text-align: center;
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: var(--text-color);
}

/* Footer */
.footer {
    background: #333;
    color: white;
    padding: 60px 0 20px;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-bottom: 40px;
}

.footer-section h4 {
    margin-bottom: 20px;
    color: var(--accent-color);
}

.footer-section ul {
    list-style: none;
    padding: 0;
}

.footer-section ul li {
    margin-bottom: 10px;
}

.footer-section ul li a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section ul li a:hover {
    color: white;
}

.footer-bottom {
    border-top: 1px solid #555;
    padding-top: 20px;
    text-align: center;
}

/* Legal Pages */
.legal-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 60px 20px;
}

.legal-page h1 {
    color: var(--primary-color);
    text-align: center;
    margin-bottom: 10px;
}

.last-updated {
    text-align: center;
    color: #666;
    margin-bottom: 40px;
}

.legal-page section {
    margin-bottom: 40px;
}

.legal-page h2 {
    color: var(--text-color);
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: 10px;
    margin-bottom: 20px;
}

.legal-page ul {
    margin-left: 20px;
}

.legal-page li {
    margin-bottom: 8px;
}

/* Product Page */
.product-hero {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    padding: 80px 0;
    text-align: center;
}

.product-features {
    padding: 80px 0;
}

.steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-top: 40px;
}

.step {
    text-align: center;
    padding: 30px;
}

.step-number {
    width: 60px;
    height: 60px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 auto 20px;
}

/* About Page */
.about-hero {
    background: var(--light-gray);
    padding: 80px 0;
    text-align: center;
}

.mission {
    font-size: 1.5rem;
    color: var(--primary-color);
    font-weight: 600;
}

.our-story, .our-mission, .our-values {
    padding: 60px 0;
}

.values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
    margin-top: 40px;
}

.value {
    text-align: center;
    padding: 30px;
}

/* Contact Page */
.contact-hero {
    background: var(--light-gray);
    padding: 80px 0;
    text-align: center;
}

.contact-methods {
    padding: 60px 0;
}

.contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
}

.contact-method {
    text-align: center;
    padding: 30px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.contact-method a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
}

.contact-form {
    padding: 60px 0;
    background: var(--light-gray);
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .hero-subtitle {
        font-size: 1.2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
    }
}
```

---

## Implementation Steps

### 1. Create Pages in HubSpot
1. Go to your HubSpot dashboard
2. Navigate to Marketing → Website → Landing Pages
3. Create each page using the content provided above

### 2. Set Up Navigation
1. Go to Marketing → Website → Navigation
2. Create a main navigation menu with:
   - Home
   - Product
   - About
   - Contact

### 3. Add Footer Links
1. Go to Marketing → Website → Footer
2. Add links to:
   - Privacy Policy
   - Terms of Service
   - Contact

### 4. Update Google Cloud Console
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Update the following URLs:
   - Homepage URL: `https://homeops.ai`
   - Privacy Policy URL: `https://homeops.ai/privacy-policy-homeops.ai`
   - Terms of Service URL: `https://homeops.ai/terms-of-service`

### 5. Test Everything
1. Test all links work correctly
2. Verify mobile responsiveness
3. Check that privacy policy and terms links are visible
4. Test contact forms

### 6. Submit for Google OAuth Verification
1. Create demo video showing OAuth flow and app functionality
2. Submit verification request with all required URLs
3. Include clear explanation of how your app uses Gmail data

This complete website setup will meet all Google OAuth requirements and provide a professional online presence for HomeOps. 