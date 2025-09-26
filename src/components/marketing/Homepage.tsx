import React, { useEffect, useRef } from 'react';
import { ArrowRight, BrainCircuit, Zap, Target, CalendarCheck, ShieldCheck, TrendingUp } from 'lucide-react';
import Header from '../shared/Header';
import './Homepage.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

const Homepage: React.FC = () => {
  const featureCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    // Animate features on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe feature cards
    featureCardsRef.current.forEach(card => {
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
      }
    });

    // Cleanup
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6" />,
      title: "Email Intelligence Engine",
      description: "Advanced AI instantly decodes your family's email stream, identifying what needs action versus what can wait—no more inbox overwhelm."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Priority Scoring",
      description: "Every email gets an intelligent priority score based on urgency, importance, and your family's unique patterns and preferences."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Task Extraction",
      description: "Automatically surfaces deadlines, appointments, and action items from school communications, activities, and household logistics."
    },
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      title: "Unified Family Command Center",
      description: "One dashboard showing your family's real priorities: upcoming deadlines, important communications, and what actually needs your time."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "Read-only Gmail access, zero data storage of personal content, and complete transparency about what we access and why."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Gets Smarter Over Time",
      description: "Our AI learns your family's unique patterns—which schools matter, what activities to prioritize, and who sends truly important messages."
    }
  ];

  return (
    <div className="homepage">
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="hero">
        <div className="announcement">Mental Load Operating System</div>

        <h1 className="hero-title">
          The family operations platform that thinks ahead
        </h1>

        <p className="hero-subtitle">
          HomeOps transforms your family's communication chaos into an intelligent system. We analyze every email, extract what matters, and present clear priorities—turning mental load into mental clarity.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a href="/signup" className="hero-cta">
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <h2 className="section-title">Built for High Performing Families</h2>
          <p className="section-subtitle">
            Every feature designed to reduce mental load and increase family efficiency through intelligent automation.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => (featureCardsRef.current[index] = el)}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <h2>Stop drowning in family logistics</h2>
        <p>
          Transform your family's email chaos into clear priorities and actionable insights.
          Join families who've reclaimed their time and mental energy with HomeOps.AI.
        </p>
        <a href="/signup" className="hero-cta">Start Your Free Trial</a>
      </section>
    </div>
  );
};

export default Homepage;