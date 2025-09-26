// Pricing Page JavaScript - HomeOps.AI
// Handles billing toggle, plan interactions, and analytics

class PricingController {
    constructor() {
        this.isAnnual = false;
        this.plans = {
            free: { monthly: 0, annual: 0 },
            individual: { monthly: 15, annual: 150 },
            couple: { monthly: 25, annual: 250 },
            household: { monthly: 40, annual: 400 }
        };
        
        this.init();
    }

    init() {
        this.setupBillingToggle();
        this.setupPlanCTAs();
        this.setupFAQ();
        this.setupScrollEffects();
        this.trackPageView();
    }

    // Billing Toggle (Monthly vs Annual)
    setupBillingToggle() {
        const toggle = document.getElementById('billing-toggle');
        const monthlyLabel = document.getElementById('monthly-label');
        const annualLabel = document.getElementById('annual-label');

        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.isAnnual = !this.isAnnual;
            
            // Update toggle UI
            toggle.classList.toggle('active', this.isAnnual);
            toggle.setAttribute('aria-checked', this.isAnnual);
            
            // Update label styles
            monthlyLabel.classList.toggle('active', !this.isAnnual);
            annualLabel.classList.toggle('active', this.isAnnual);
            
            // Update pricing display
            this.updatePricingDisplay();
            
            // Track toggle event
            this.trackEvent('billing_toggle', { plan_type: this.isAnnual ? 'annual' : 'monthly' });
        });
    }

    // Update pricing display based on billing period
    updatePricingDisplay() {
        const priceAmounts = document.querySelectorAll('.price-amount[data-monthly]');
        const pricePeriods = document.querySelectorAll('.price-period[data-monthly]');
        const annualSavings = document.querySelectorAll('.annual-savings');

        priceAmounts.forEach(element => {
            const monthlyPrice = parseInt(element.dataset.monthly);
            const annualPrice = parseInt(element.dataset.annual);
            
            if (this.isAnnual && annualPrice) {
                element.textContent = annualPrice;
            } else {
                element.textContent = monthlyPrice;
            }
        });

        pricePeriods.forEach(element => {
            element.textContent = this.isAnnual ? element.dataset.annual : element.dataset.monthly;
        });

        // Show/hide annual savings
        annualSavings.forEach(element => {
            element.style.display = this.isAnnual ? 'block' : 'none';
        });

        // Animate the change
        this.animatePriceChange();
    }

    // Animate price changes
    animatePriceChange() {
        const pricingCards = document.querySelectorAll('.pricing-card');
        pricingCards.forEach(card => {
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    }

    // Plan CTA button handling
    setupPlanCTAs() {
        const ctaButtons = document.querySelectorAll('.plan-cta[data-plan]');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const planType = button.dataset.plan;
                this.handlePlanSelection(planType, button);
            });
        });
    }

    // Handle plan selection
    handlePlanSelection(planType, buttonElement) {
        // Add loading state
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i data-lucide="loader-2" class="cta-arrow animate-spin"></i> Loading...';
        
        // Track plan selection
        this.trackEvent('plan_selected', {
            plan_type: planType,
            billing_period: this.isAnnual ? 'annual' : 'monthly',
            price: this.plans[planType] ? this.plans[planType][this.isAnnual ? 'annual' : 'monthly'] : 0
        });

        // Simulate API call delay for better UX
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            
            // Redirect to appropriate flow
            if (planType === 'starter') {
                window.location.href = '/onboarding?plan=starter';
            } else {
                window.location.href = `/onboarding?plan=${planType}&billing=${this.isAnnual ? 'annual' : 'monthly'}`;
            }
        }, 800);
    }

    // FAQ accordion functionality
    setupFAQ() {
        const faqItems = document.querySelectorAll('.faq-question');
        
        faqItems.forEach(question => {
            question.addEventListener('click', () => {
                const isExpanded = question.getAttribute('aria-expanded') === 'true';
                const answer = question.nextElementSibling;
                
                // Close all other FAQs
                faqItems.forEach(otherQuestion => {
                    if (otherQuestion !== question) {
                        otherQuestion.setAttribute('aria-expanded', 'false');
                        otherQuestion.nextElementSibling.classList.remove('open');
                    }
                });
                
                // Toggle current FAQ
                question.setAttribute('aria-expanded', !isExpanded);
                answer.classList.toggle('open', !isExpanded);
                
                // Track FAQ interaction
                this.trackEvent('faq_interaction', {
                    question: question.textContent.trim(),
                    action: !isExpanded ? 'opened' : 'closed'
                });
            });
        });
    }

    // Scroll effects and animations
    setupScrollEffects() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Special animation for pricing cards
                    if (entry.target.classList.contains('pricing-card')) {
                        const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                        setTimeout(() => {
                            entry.target.style.transform = 'translateY(0) scale(1)';
                        }, delay);
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.pricing-card, .faq-item, .comparison-table-container');
        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });

        // Navigation background on scroll
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.nav');
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(15, 15, 35, 0.99)';
                nav.style.borderBottomColor = 'rgba(99, 102, 241, 0.3)';
            } else {
                nav.style.background = 'rgba(15, 15, 35, 0.98)';
                nav.style.borderBottomColor = 'rgba(99, 102, 241, 0.2)';
            }
        });
    }

    // Analytics and tracking
    trackPageView() {
        this.trackEvent('pricing_page_view', {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }

    trackEvent(eventName, properties = {}) {
        // Track to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📊 Analytics Event:', eventName, properties);
        }

        // Send to actual analytics in production
        try {
            // Example: Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, properties);
            }

            // Example: Custom analytics endpoint
            if (window.location.hostname !== 'localhost') {
                fetch('/api/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: eventName,
                        properties: {
                            ...properties,
                            timestamp: new Date().toISOString(),
                            page: 'pricing'
                        }
                    })
                }).catch(error => {
                    console.error('Analytics error:', error);
                });
            }
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    // Utility method to get current plan selection
    getCurrentPlanInfo(planType) {
        const plan = this.plans[planType];
        if (!plan) return null;

        return {
            name: planType,
            price: plan[this.isAnnual ? 'annual' : 'monthly'],
            billing: this.isAnnual ? 'annual' : 'monthly',
            savings: this.isAnnual && plan.monthly > 0 ? 
                (plan.monthly * 12 - plan.annual) : 0
        };
    }
}

// Enhanced mobile menu functionality
class MobileMenu {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.toggleMenu();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            const nav = document.querySelector('.nav');
            if (!nav.contains(e.target) && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        const navLinks = document.querySelector('.nav-links');
        
        if (this.isOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    }

    openMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = 'flex';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.flexDirection = 'column';
        navLinks.style.background = 'rgba(15, 15, 35, 0.98)';
        navLinks.style.backdropFilter = 'blur(12px)';
        navLinks.style.padding = '20px';
        navLinks.style.borderTop = '1px solid rgba(99, 102, 241, 0.2)';
        navLinks.style.gap = '16px';
    }

    closeMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = 'none';
        this.isOpen = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize pricing controller
    window.pricingController = new PricingController();
    
    // Initialize mobile menu
    window.mobileMenu = new MobileMenu();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Add smooth scrolling for anchor links
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
});

// Export for potential external usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PricingController, MobileMenu };
}
