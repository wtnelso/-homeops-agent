const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve React app instead of old HTML
app.use(express.static('public-react'));

console.log('🔧 Starting HomeOps server...');

// API endpoints
app.post('/api/chat', (req, res) => {
  console.log('💬 Chat API called');
  res.json({ success: true, response: "Chat working locally!" });
});

app.post('/api/commerce-search-enhanced', (req, res) => {
  console.log('🛒 Commerce API called');
  res.json({ success: true, productCategories: [] });
});

app.post('/api/decoder-cards', (req, res) => {
  console.log('📧 Decoder cards API called');
  res.json({ 
    success: true, 
    cards: [
      {
        id: '1',
        subject: 'School Winter Concert - Permission Slip Due',
        snippet: 'Dear Parents, The winter concert is scheduled for December 15th at 7:00 PM in the school auditorium. Please return the attached permission slip by Friday, December 8th.',
        category: 'family',
        insight: '📝 Permission slip required by Friday, December 8th - Concert on December 15th at 7PM',
        sender: 'Lincoln Elementary School',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        subject: 'Amazon Order Delivered',
        snippet: 'Your package has been delivered and left at your front door.',
        category: 'commerce',
        insight: '📦 Package delivered - Check front door for Amazon delivery',
        sender: 'Amazon',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '3',
        subject: 'Weekly Team Meeting',
        snippet: 'Don\'t forget about our weekly team meeting tomorrow at 10 AM via Zoom.',
        category: 'work',
        insight: '💼 Team meeting tomorrow at 10 AM - Join Zoom link',
        sender: 'Sarah Mitchell',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    ]
  });
});

// Removed flight search - not relevant to HomeOps core functionality

app.post('/api/analyze-sample-email', (req, res) => {
  console.log('📋 Email analysis API called');
  res.json({ success: true, analysis: { summary: "Working!" } });
});

app.post('/api/email-feedback', (req, res) => {
  console.log('👍 Email feedback API called');
  res.json({ success: true, message: "Feedback received!" });
});

// Missing endpoints that were causing 404s
app.get('/api/calendar-events/:email', (req, res) => {
  console.log('📅 Calendar events API called for:', req.params.email);
  res.json({ 
    success: true, 
    events: [
      {
        id: '1',
        title: 'Soccer Practice',
        date: 'Today',
        time: '4:00 PM',
        location: 'Community Park',
        type: 'family',
        priority: 'medium'
      },
      {
        id: '2',
        title: 'Parent-Teacher Conference',
        date: 'Tomorrow',
        time: '2:30 PM',
        location: 'Lincoln Elementary',
        type: 'school',
        priority: 'high'
      },
      {
        id: '3',
        title: 'Grocery Shopping',
        date: 'Today',
        time: '6:00 PM',
        location: 'Whole Foods',
        type: 'family',
        priority: 'low'
      }
    ]
  });
});

app.get('/api/emotional-load-forecast/:email', (req, res) => {
  console.log('🧠 Emotional load forecast API called for:', req.params.email);
  res.json({ 
    success: true, 
    forecast: { 
      today: { 
        level: 3, 
        description: "Moderate load",
        factors: [
          "Parent-teacher conference tomorrow",
          "Soccer practice coordination",
          "Permission slip deadline approaching"
        ]
      } 
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve React frontend for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public-react', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log(`✅ All API endpoints ready!`);
});
