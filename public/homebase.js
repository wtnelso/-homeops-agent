import React, { useState } from 'react';
import './style.css';
import blueLogo from './logo-blue.png'; // Place your blue logo in public/ as logo-blue.png

const sampleDecodedEmails = [
  {
    id: 1,
    type: 'family-signal',
    title: 'Family Signal',
    date: '2024-10-12T08:00:00Z',
    content: (
      <>
        <div>Picture Day – Oct 15 at 9 AM</div>
        <div>
          <span style={{ color: '#2563eb' }}>Location:</span> Woods Academy &nbsp;|
          <span style={{ color: '#2563eb' }}> Action:</span> <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>Send in photo form</a>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="form-btn" style={{ background: '#e0f2fe', color: '#2563eb', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 500 }}>Form attached</button>
        </div>
      </>
    ),
    helpful: null,
  },
  {
    id: 2,
    type: 'smart-deal',
    title: 'Smart Deal',
    date: '2024-10-10T15:30:00Z',
    content: (
      <>
        <div>You've bought Honest Co. 4x this year</div>
        <div>Today: <b>15% off sitewide + free shipping</b></div>
        <div style={{ marginTop: 8 }}>
          <button className="deal-btn" style={{ background: '#fbbf24', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 500 }}>Reorder Diapers</button>
        </div>
      </>
    ),
    helpful: null,
  },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HomeBase() {
  const [emails, setEmails] = useState(sampleDecodedEmails);

  const handleFeedback = (id, value) => {
    setEmails(emails.map(e => e.id === id ? { ...e, helpful: value } : e));
    // TODO: send feedback to backend
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img src={blueLogo} alt="HomeOps Logo" className="sidebar-logo" />
        </div>
        <nav className="nav">
          <button className="nav-item active"><i className="lucide lucide-home"></i></button>
          <button className="nav-item"><i className="lucide lucide-calendar"></i></button>
          <button className="nav-item"><i className="lucide lucide-message-circle"></i></button>
        </nav>
      </div>
      {/* Main Content */}
      <div className="main-content" style={{ background: '#f5f6fa', minHeight: '100vh' }}>
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <a href="/" className="top-bar-logo-link">
              <img src={blueLogo} alt="HomeOps Logo" className="top-bar-logo" />
            </a>
            <span className="brand-name">HomeOps</span>
          </div>
          <div className="user-menu">
            <span className="user-email">oliverhbaron@gmail.com</span>
            <button className="logout-btn">Logout</button>
          </div>
        </div>
        {/* Main Section */}
        <div style={{ padding: '2rem 2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span role="img" aria-label="decoder" style={{ fontSize: 28 }}>🧠</span> Email Decoder Engine
          </h2>
          <div style={{ color: '#444', fontSize: 18, marginBottom: 24, maxWidth: 600 }}>
            A new way to interact with email for high-performing modern families and professionals.<br />
            Connect your Gmail to surface only what matters—school alerts, doctor updates, smart deals, and more.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button className="gmail-connect-btn" style={{ fontWeight: 600, fontSize: 16 }}>
              <i className="lucide lucide-mail" style={{ marginRight: 8 }}></i> Connect Gmail
            </button>
            <span style={{ color: '#888', fontSize: 15 }}>Connect your Gmail to start decoding emails</span>
          </div>
          {/* Decoded Cards */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
            {emails.map(email => (
              <div
                key={email.id}
                className={email.type === 'family-signal' ? 'family-signal-card example-card' : 'smart-deal-card example-card'}
                style={{ minWidth: 320, maxWidth: 360, flex: 1, position: 'relative', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="decoded-email-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <i className={email.type === 'family-signal' ? 'lucide lucide-users signal-icon' : 'lucide lucide-shopping-cart deal-icon'}></i>
                  <span style={{ fontWeight: 600, fontSize: 18 }}>{email.title}</span>
                  <span style={{ marginLeft: 'auto', color: '#888', fontSize: 13 }}>Received: {formatDate(email.date)}</span>
                </div>
                <div className="decoded-email-content" style={{ fontSize: 16, marginBottom: 16 }}>{email.content}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#888', fontSize: 14 }}>Was this helpful?</span>
                  <button
                    className="feedback-btn"
                    style={{ background: email.helpful === true ? '#2563eb' : '#e5e7eb', color: email.helpful === true ? '#fff' : '#222', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}
                    onClick={() => handleFeedback(email.id, true)}
                  >👍</button>
                  <button
                    className="feedback-btn"
                    style={{ background: email.helpful === false ? '#ef4444' : '#e5e7eb', color: email.helpful === false ? '#fff' : '#222', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}
                    onClick={() => handleFeedback(email.id, false)}
                  >👎</button>
                </div>
              </div>
            ))}
          </div>
          {/* How it works */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
              <i className="lucide lucide-info" style={{ color: '#2563eb', fontSize: 22 }}></i> How it works
            </h3>
            <ul style={{ color: '#444', fontSize: 16, margin: 0, paddingLeft: 24 }}>
              <li>Connect your Gmail account securely</li>
              <li>HomeOps decodes your emails and surfaces only what matters</li>
              <li>See school alerts, doctor updates, smart deals, and more—no inbox clutter</li>
              <li>Give feedback to help the engine get smarter for you</li>
            </ul>
          </div>
          {/* This Week */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
              <i className="lucide lucide-calendar" style={{ color: '#2563eb', fontSize: 22 }}></i> This Week
            </h3>
            <div style={{ color: '#444', fontSize: 16, marginBottom: 8 }}>A summary of your calendar and key tasks.</div>
            <div style={{ color: '#888', fontSize: 15 }}>Your weekly summary will appear here…</div>
          </div>
        </div>
      </div>
    </div>
  );
}
