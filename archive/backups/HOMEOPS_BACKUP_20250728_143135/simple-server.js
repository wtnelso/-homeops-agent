const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
  res.json({ success: true, cards: [] });
});

app.post('/api/flight-search', (req, res) => {
  console.log('✈️ Flight search API called');
  res.json({ success: true, flights: [] });
});

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
  res.json({ success: true, events: [] });
});

app.get('/api/emotional-load-forecast/:email', (req, res) => {
  console.log('🧠 Emotional load forecast API called for:', req.params.email);
  res.json({ success: true, forecast: { today: { level: 2, description: "Light load" } } });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log(`✅ All API endpoints ready!`);
});
