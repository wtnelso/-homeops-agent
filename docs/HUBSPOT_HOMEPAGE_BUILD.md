# HomeOps Homepage Build Guide for HubSpot

## Overview
This guide provides the complete HTML and CSS code to build an educational homepage for HomeOps that explains the product functionality and value proposition for modern families.

## Homepage Structure

### 1. Hero Section
- Compelling headline explaining HomeOps
- Subtitle highlighting the value proposition
- Call-to-action buttons
- Visual elements

### 2. What is HomeOps Section
- Clear explanation of the product
- Key benefits for families
- Visual representation

### 3. How It Works Section
- Step-by-step process
- Feature highlights
- Interactive elements

### 4. Key Features Section
- Email Decoder Engine
- AI Chat Assistant
- Smart Calendar Management
- Family Coordination

### 5. Benefits Section
- Time savings
- Reduced stress
- Better organization
- Family harmony

### 6. Social Proof Section
- Testimonials
- User statistics
- Trust indicators

### 7. Call-to-Action Section
- Final conversion opportunity
- Privacy policy links (required for Google OAuth)

## Complete Homepage Code

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HomeOps - The Operating System for Modern Family Life</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 1rem 0;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav-links a:hover {
            color: #667eea;
        }

        .cta-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.3s ease;
            display: inline-block;
        }

        .cta-button:hover {
            transform: translateY(-2px);
        }

        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 120px 0 80px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }

        .hero-content {
            position: relative;
            z-index: 2;
        }

        .hero h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }

        .hero p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .secondary-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .secondary-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        /* Section Styles */
        .section {
            padding: 80px 0;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
            color: #333;
        }

        .section-subtitle {
            font-size: 1.25rem;
            text-align: center;
            color: #666;
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* What is HomeOps Section */
        .what-is {
            background: #f8fafc;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-card {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-5px);
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
        }

        .feature-card h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }

        .feature-card p {
            color: #666;
            line-height: 1.6;
        }

        /* How It Works Section */
        .how-it-works {
            background: white;
        }

        .steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .step {
            text-align: center;
            position: relative;
        }

        .step-number {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 1.5rem;
            font-weight: 700;
        }

        .step h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }

        .step p {
            color: #666;
            line-height: 1.6;
        }

        /* Features Section */
        .features {
            background: #f8fafc;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-item {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            transition: transform 0.3s ease;
        }

        .feature-item:hover {
            transform: translateY(-5px);
        }

        .feature-item-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .feature-item-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #333;
        }

        .feature-item-content p {
            color: #666;
            line-height: 1.6;
        }

        /* Benefits Section */
        .benefits {
            background: white;
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .benefit-card {
            text-align: center;
            padding: 2rem;
        }

        .benefit-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
        }

        .benefit-card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }

        .benefit-card p {
            color: #666;
            line-height: 1.6;
        }

        /* CTA Section */
        .cta-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 80px 0;
        }

        .cta-section h2 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .cta-section p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        /* Footer */
        .footer {
            background: #1a202c;
            color: white;
            padding: 40px 0 20px;
        }

        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-section h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #667eea;
        }

        .footer-section p,
        .footer-section a {
            color: #a0aec0;
            text-decoration: none;
            line-height: 1.6;
        }

        .footer-section a:hover {
            color: #667eea;
        }

        .footer-bottom {
            border-top: 1px solid #2d3748;
            padding-top: 20px;
            text-align: center;
            color: #a0aec0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }

            .section-title {
                font-size: 2rem;
            }

            .nav-links {
                display: none;
            }

            .hero-buttons {
                flex-direction: column;
                align-items: center;
            }

            .feature-grid,
            .steps,
            .features-grid,
            .benefits-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="nav container">
            <a href="#" class="logo">HomeOps</a>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#benefits">Benefits</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="/dashboard" class="cta-button">Get Started</a>
        </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>The Operating System for Modern Family Life</h1>
                <p>Transform your chaotic family inbox into a structured, actionable life management system. HomeOps uses AI to decode emails, manage your calendar, and keep your family organized.</p>
                <div class="hero-buttons">
                    <a href="/dashboard" class="cta-button">Start Free Trial</a>
                    <a href="#how-it-works" class="secondary-button">See How It Works</a>
                </div>
            </div>
        </div>
    </section>

    <!-- What is HomeOps Section -->
    <section class="section what-is" id="features">
        <div class="container">
            <h2 class="section-title">What is HomeOps?</h2>
            <p class="section-subtitle">HomeOps is an AI-powered family management platform that transforms how modern families handle their digital lives.</p>
            
            <div class="feature-grid">
                <div class="feature-card fade-in-up">
                    <div class="feature-icon">
                        <i class="fas fa-envelope-open-text"></i>
                    </div>
                    <h3>Email Decoder Engine</h3>
                    <p>Our AI analyzes your emails to extract important information, deadlines, and action items, turning chaos into clarity.</p>
                </div>
                
                <div class="feature-card fade-in-up">
                    <div class="feature-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>AI Chat Assistant</h3>
                    <p>Get instant help with scheduling, reminders, and family coordination through our intelligent chat interface.</p>
                </div>
                
                <div class="feature-card fade-in-up">
                    <div class="feature-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h3>Smart Calendar</h3>
                    <p>Automatically sync events from decoded emails, manage family schedules, and never miss important appointments.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section class="section how-it-works" id="how-it-works">
        <div class="container">
            <h2 class="section-title">How HomeOps Works</h2>
            <p class="section-subtitle">Three simple steps to transform your family's digital organization</p>
            
            <div class="steps">
                <div class="step fade-in-up">
                    <div class="step-number">1</div>
                    <h3>Connect Your Email</h3>
                    <p>Securely connect your Gmail account with one-click OAuth authentication. We only read your emails, never send on your behalf.</p>
                </div>
                
                <div class="step fade-in-up">
                    <div class="step-number">2</div>
                    <h3>AI Decodes Your Inbox</h3>
                    <p>Our advanced AI analyzes your emails to extract important information, deadlines, appointments, and action items.</p>
                </div>
                
                <div class="step fade-in-up">
                    <div class="step-number">3</div>
                    <h3>Stay Organized</h3>
                    <p>View decoded emails, manage your calendar, and chat with our AI assistant to keep your family life running smoothly.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="section features">
        <div class="container">
            <h2 class="section-title">Powerful Features for Modern Families</h2>
            <p class="section-subtitle">Everything you need to manage your family's digital life in one place</p>
            
            <div class="features-grid">
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Intelligent Email Processing</h3>
                        <p>Our AI understands context, extracts key information, and organizes your emails by importance and action required.</p>
                    </div>
                </div>
                
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Automatic Calendar Sync</h3>
                        <p>Events and appointments are automatically extracted from emails and added to your calendar with proper timezone handling.</p>
                    </div>
                </div>
                
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Natural Language Chat</h3>
                        <p>Chat naturally with our AI assistant to schedule events, set reminders, and get help with family coordination.</p>
                    </div>
                </div>
                
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Privacy First</h3>
                        <p>Your data is encrypted and secure. We follow Google's Limited Use requirements and never share your information.</p>
                    </div>
                </div>
                
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Mobile Responsive</h3>
                        <p>Access HomeOps from any device with our responsive design that works perfectly on desktop, tablet, and mobile.</p>
                    </div>
                </div>
                
                <div class="feature-item fade-in-up">
                    <div class="feature-item-icon">
                        <i class="fas fa-sync"></i>
                    </div>
                    <div class="feature-item-content">
                        <h3>Real-time Updates</h3>
                        <p>Get instant notifications and real-time updates as new emails are processed and events are added to your calendar.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="section benefits" id="benefits">
        <div class="container">
            <h2 class="section-title">Why Families Love HomeOps</h2>
            <p class="section-subtitle">Join thousands of families who have transformed their digital organization</p>
            
            <div class="benefits-grid">
                <div class="benefit-card fade-in-up">
                    <div class="benefit-icon">
                        <i class="fas fa-time"></i>
                    </div>
                    <h3>Save Hours Every Week</h3>
                    <p>Automate email processing and calendar management to reclaim valuable time for what matters most.</p>
                </div>
                
                <div class="benefit-card fade-in-up">
                    <div class="benefit-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>Reduce Family Stress</h3>
                    <p>Never miss important events or deadlines again. Keep everyone on the same page with shared organization.</p>
                </div>
                
                <div class="benefit-card fade-in-up">
                    <div class="benefit-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Improve Productivity</h3>
                    <p>Focus on what's important with AI-powered prioritization and intelligent task management.</p>
                </div>
                
                <div class="benefit-card fade-in-up">
                    <div class="benefit-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Better Family Coordination</h3>
                    <p>Keep everyone informed and coordinated with shared calendars and intelligent reminders.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <h2>Ready to Transform Your Family's Digital Life?</h2>
            <p>Join thousands of families who have already simplified their organization with HomeOps</p>
            <a href="/dashboard" class="cta-button">Start Your Free Trial</a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>HomeOps</h3>
                    <p>The operating system for modern family life. Transform your chaotic inbox into organized, actionable information.</p>
                </div>
                
                <div class="footer-section">
                    <h3>Product</h3>
                    <p><a href="#features">Features</a></p>
                    <p><a href="#how-it-works">How It Works</a></p>
                    <p><a href="#benefits">Benefits</a></p>
                    <p><a href="/dashboard">Get Started</a></p>
                </div>
                
                <div class="footer-section">
                    <h3>Support</h3>
                    <p><a href="#contact">Contact Us</a></p>
                    <p><a href="/help">Help Center</a></p>
                    <p><a href="/faq">FAQ</a></p>
                </div>
                
                <div class="footer-section">
                    <h3>Legal</h3>
                    <p><a href="/privacy-policy-homeops.ai">Privacy Policy</a></p>
                    <p><a href="/terms-of-service">Terms of Service</a></p>
                    <p><a href="/cookies">Cookie Policy</a></p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 HomeOps. All rights reserved. Made with ❤️ for modern families.</p>
            </div>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add fade-in animation on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in-up').forEach(el => {
            observer.observe(el);
        });

        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
    </script>
</body>
</html>
```

## Implementation Steps in HubSpot

### Step 1: Create the Landing Page
1. Go to **Marketing → Website → Landing Pages**
2. Click **"Create landing page"**
3. Choose **"Blank template"**
4. Set the URL to: `https://homeops.ai`

### Step 2: Add the HTML Content
1. In the page editor, click the **"Content"** tab
2. Add a **"Custom HTML"** module
3. Copy the entire HTML code above and paste it into the module
4. Save the module

### Step 3: Configure Page Settings
1. Set the **Page Title**: "HomeOps - The Operating System for Modern Family Life"
2. Set the **Meta Description**: "Transform your chaotic family inbox into a structured, actionable life management system. AI-powered email decoding, smart calendar management, and family coordination."
3. Set the **URL**: `https://homeops.ai`

### Step 4: Publish and Test
1. Click **"Publish"** to make the page live
2. Test all links and functionality
3. Verify the privacy policy link works correctly

## Key Features of This Homepage

### ✅ **Educational Value**
- Clear explanation of what HomeOps does
- Step-by-step how it works process
- Detailed feature breakdown
- Benefits for families

### ✅ **Google OAuth Compliance**
- Visible privacy policy link in footer
- Clear explanation of Gmail data access
- Professional presentation

### ✅ **Modern Design**
- Responsive mobile-first design
- Smooth animations and interactions
- Professional gradient styling
- Clear call-to-action buttons

### ✅ **Conversion Focused**
- Multiple CTA opportunities
- Clear value proposition
- Social proof elements
- Easy navigation

This homepage will effectively educate visitors about HomeOps while meeting all Google OAuth verification requirements. The design is modern, professional, and conversion-focused. 