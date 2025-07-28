const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// Simple test endpoint to see what we're returning
app.get('/api/test-calibration', (req, res) => {
  try {
    // Load mock data
    const mockDataPath = path.join(__dirname, 'mock', 'emails.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    // Get first email for testing
    const firstEmail = mockData.emails[0];
    
    // Test the icon mapping function
    function getLucideIcon(category) {
      const lucideIcons = {
        'School': 'users',
        'Medical': 'heart-pulse', 
        'Shopping': 'shopping-cart',
        'Work': 'briefcase',
        'Professional': 'briefcase',
        'Family': 'users',
        'Sports': 'users',
        'Entertainment': 'users',
        'family': 'users',
        'work': 'briefcase',
        'social': 'heart-pulse',
        'commerce': 'shopping-cart',
        'general': 'mail'
      };
      return lucideIcons[category] || 'mail';
    }
    
    // Test the score calculation
    function calculateMentalLoadScore(category, priority, summary) {
      const categoryScores = {
        'school': 75,
        'medical': 85,
        'shopping': 60,
        'work': 70,
        'family': 80
      };
      
      const priorityMultiplier = {
        'high': 1.2,
        'medium': 1.0,
        'low': 0.8
      };
      
      const baseScore = categoryScores[category.toLowerCase()] || 50;
      const multiplier = priorityMultiplier[priority.toLowerCase()] || 1.0;
      
      return Math.min(100, Math.round(baseScore * multiplier));
    }
    
    const testIcon = getLucideIcon(firstEmail.category);
    const testScore = calculateMentalLoadScore(firstEmail.category, firstEmail.priority, firstEmail.summary);
    
    const result = {
      success: true,
      originalCategory: firstEmail.category,
      originalPriority: firstEmail.priority,
      mappedIcon: testIcon,
      calculatedScore: testScore,
      testEmail: {
        id: firstEmail.id,
        brandIcon: testIcon,
        score: testScore,
        emailType: firstEmail.category,
        subject: firstEmail.subject,
        from: firstEmail.source
      }
    };
    
    console.log('🧪 Test result:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running at http://localhost:${PORT}`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test-calibration`);
});
