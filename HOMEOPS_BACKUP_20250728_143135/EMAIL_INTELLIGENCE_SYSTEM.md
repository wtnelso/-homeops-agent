# 📧 HomeOps Email Intelligence System

## Overview
The Email Intelligence System is a comprehensive email decoder that integrates with your HomeOps chat agent to provide smart categorization, summarization, and actionable intelligence from your inbox.

## Architecture

### Core Categories
- **📧 Commerce Inbox** - Deals, offers, loyalty programs (with manipulation detection)
- **👨‍👩‍👧‍👦 Family/School** - Important family communications, school events, deadlines
- **💼 Work** - Professional emails requiring action
- **🎯 Priority** - Urgent items needing immediate attention
- **🔇 Noise** - Low-value emails filtered out

### Intelligence Features

#### 1. **Signal vs Noise Detection**
- **Manipulation Score**: 1-10 rating of marketing manipulation tactics
- **HomeOps Insight**: Practical, direct guidance in HomeOps tone
- **Priority Level**: LOW | MEDIUM | HIGH | URGENT

#### 2. **Smart Extraction**
- **Key Dates**: Important deadlines and time-sensitive information
- **Action Items**: Specific actions you need to take
- **Calendar Events**: Auto-detected events ready for calendar injection
- **Signal Summary**: One clear sentence of what actually matters

#### 3. **Chat Integration**
Ask your HomeOps agent:
- "Any important emails this week school oriented"
- "Email summary family stuff"
- "What school emails do I need to handle"

## Sample Analysis: School Email

Using your Woods Academy email as an example:

**INPUT:**
```
Subject: 🎨✨ Join Us for the 21st Annual Arts Celebration at The Woods Academy NEXT WEEK! | May 27–30!
From: The Woods Academy
Content: [Full email about Arts Celebration, Finding Nemo Jr. musical, etc.]
```

**OUTPUT:**
```
CATEGORY: FAMILY
SIGNAL_SUMMARY: Arts Celebration week May 27-30 with concert Tuesday 9:30 AM, musical Thursday/Friday, and coffee Friday
KEY_DATES: Tuesday May 27 - Concert at 9:30 AM, Thursday/Friday - Finding Nemo Jr musical, Friday May 23 - Coffee at 8:30 AM
ACTION_ITEMS: Buy tickets for Thursday/Friday musical, attend Friday coffee if interested
CALENDAR_EVENTS: Arts Celebration Concert | May 27 | 9:30 AM
MANIPULATION_SCORE: 2
HOMEOPS_INSIGHT: School celebration week - put the concert on your calendar, decide on musical tickets, coffee is optional
PRIORITY_LEVEL: MEDIUM
```

## API Endpoints

### 1. **Analyze Sample Email** 
`POST /api/analyze-sample-email`
```json
{
  "subject": "Email subject",
  "sender": "sender@email.com", 
  "content": "Email content"
}
```

### 2. **Get Categorized Emails**
`POST /api/categorized-emails`
- Requires Gmail OAuth connection
- Returns emails categorized by intelligence type

### 3. **Weekly Email Summary**
`POST /api/email-weekly-summary`
- Generates HomeOps-style weekly summary
- Integrates with chat agent for natural queries

## Frontend Features

### Email Intelligence Tab
1. **Gmail Connection** - OAuth 2.0 secure connection
2. **Test with Sample** - Try the system with the Woods Academy email
3. **Live Processing** - Analyze your real emails
4. **Calendar Integration** - Add extracted events directly to calendar

### Chat Integration
Ask questions like:
- "Show me important family emails this week"
- "Any school deadlines I'm missing?"
- "Email summary commerce stuff"

The system will:
1. Detect email-related queries
2. Analyze your recent emails
3. Provide intelligent summaries
4. Surface actionable items

## HomeOps Tone & Philosophy

The email intelligence uses the HomeOps voice:
- **Direct, no-fluff communication**
- **Practical over perfect**
- **Surfaces what actually matters**
- **Cuts through marketing manipulation**
- **Focuses on busy parent needs**

### Example HomeOps Insights:
- "School celebration week - put the concert on your calendar, decide on musical tickets, coffee is optional"
- "Sale email with 47% manipulation tactics - skip unless you actually need the product"
- "Work deadline buried in paragraph 3 - action needed by Friday"

## Testing the System

### 1. **Sample Email Test**
Click "🧪 Test with Sample School Email" to see how the system analyzes the Woods Academy Arts Celebration email.

### 2. **Live Gmail Test**
1. Connect your Gmail account
2. Click "Scan & Translate Latest Emails"
3. View categorized results with intelligence

### 3. **Chat Integration Test**
Ask: "Any important emails this week from school?"

## Security & Privacy

- **OAuth 2.0** secure Gmail connection
- **Read-only** email access
- **No email storage** - analysis happens in real-time
- **AI processing** via OpenAI API with privacy protections

## Technical Implementation

### Backend (server.js)
- `emailIntelligence.parseAndCategorizeEmail()` - Main analysis function
- `emailIntelligence.generateWeeklyEmailSummary()` - Chat integration
- Gmail API integration with proper OAuth handling
- Enhanced chat endpoint with email query detection

### Frontend (index.html)
- Email Intelligence UI with categorized display
- Test functionality for sample emails
- Chat integration for natural language queries
- Calendar event extraction and injection

## Next Steps

1. **Test the sample email** to see the intelligence in action
2. **Connect your Gmail** to analyze real emails
3. **Try chat queries** like "email summary school stuff"
4. **Use calendar integration** to add extracted events

The system is designed to cut through email noise and surface what actually needs your attention as a busy parent managing family logistics.
