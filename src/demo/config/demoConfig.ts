// Demo account configuration for investor presentations
export const DEMO_CONFIG = {
  // Demo account credentials
  DEMO_EMAIL: 'demo@homeops.ai',
  DEMO_ACCOUNT_ID: 'demo-account-2024',

  // Demo user profile data
  DEMO_PROFILE: {
    userName: 'Sarah Thompson',
    timezone: 'America/Chicago', // Central Time
    familyMembers: [
      {
        name: 'Michael Thompson',
        relationship: 'spouse' as const,
        age: 38
      },
      {
        name: 'Emma Thompson',
        relationship: 'child' as const,
        age: 12,
        grade: '7th Grade'
      },
      {
        name: 'Jake Thompson',
        relationship: 'child' as const,
        age: 8,
        grade: '3rd Grade'
      }
    ],
    schools: ['Westwood Middle School', 'Oak Hill Elementary'],
    activities: ['Soccer', 'Piano', 'Swimming', 'Chess Club'],
    emailDomains: ['@westwood.edu', '@oakhill.edu', '@austinisd.org'],
    importantPlaces: ['Westwood Fields', 'Miller Music Studio', 'Community Center', 'Oak Hill School']
  },

  // Demo onboarding data - pre-populated form data
  DEMO_ONBOARDING_DATA: {
    step1: {
      userName: 'Sarah Thompson',
      timezone: 'America/Chicago'
    },
    step2: {
      familyMembers: [
        {
          name: 'Michael Thompson',
          relationship: 'spouse',
          age: 38
        },
        {
          name: 'Emma Thompson',
          relationship: 'child',
          age: 12,
          grade: '7th Grade'
        },
        {
          name: 'Jake Thompson',
          relationship: 'child',
          age: 8,
          grade: '3rd Grade'
        }
      ]
    },
    step3: {
      schools: ['Westwood Middle School', 'Oak Hill Elementary'],
      activities: ['Soccer', 'Piano', 'Swimming', 'Chess Club'],
      emailDomains: ['@westwood.edu', '@oakhill.edu', '@austinisd.org'],
      importantPlaces: ['Westwood Fields', 'Miller Music Studio', 'Community Center', 'Oak Hill School']
    }
  },

  // Scripted demo conversations
  DEMO_CONVERSATIONS: [
    {
      id: 'schedule-check',
      userMessage: "What's on Emma's schedule this week?",
      assistantResponse: `Here's Emma's schedule for this week:

**Monday**: Piano lesson at 4:30 PM at Miller Music Studio
**Wednesday**: Soccer practice at 6:00 PM at Westwood Fields
**Friday**: Chess club after school (3:30-4:30 PM)
**Saturday**: Soccer game at 10:00 AM vs. Central Tigers

I also noticed from your recent emails that there's a parent-teacher conference signup for Emma's math class - would you like me to help you schedule that?`,
      keywords: ['schedule', 'emma', 'week', 'calendar', 'what\'s on']
    },
    {
      id: 'email-intelligence',
      userMessage: "Any important emails I should know about?",
      assistantResponse: `Yes! Here are the priority items from your recent emails:

🚨 **Urgent**: Jake's field trip permission slip due by Friday (from Mrs. Rodriguez)
💰 **Bill Due**: Piano lesson payment due tomorrow ($120)
📅 **Event**: Emma's soccer team potluck this Saturday - you signed up to bring drinks
🏥 **Reminder**: Jake's dentist appointment next Tuesday at 2 PM

I also filtered out 23 promotional emails and found 2 important school announcements about upcoming events.`,
      keywords: ['email', 'important', 'priority', 'urgent', 'bills']
    },
    {
      id: 'weekend-planning',
      userMessage: "Help me plan this weekend",
      assistantResponse: `Based on your family's schedule and recent email activity:

**Saturday**:
- 10:00 AM: Emma's soccer game (30 min drive)
- 12:00 PM: Soccer team potluck (you're bringing drinks)
- 3:00 PM: Free time - Jake mentioned wanting to practice chess

**Sunday**:
- Morning: Piano practice for Emma (recital next month)
- Afternoon: Jake has a birthday party invitation from his classmate Alex

**Smart suggestions**:
- 🛒 Add drinks for potluck to shopping list
- ⏰ Set reminder to prep Jake's chess tournament application (deadline next week)
- 📧 Emma's science project partners need group meeting coordination`,
      keywords: ['weekend', 'plan', 'saturday', 'sunday', 'schedule']
    },
    {
      id: 'homework-stress',
      userMessage: "Emma says she has too much homework and activities",
      assistantResponse: `I've analyzed Emma's schedule and recent school communications. Here's what I found:

**Current weekly commitment**: 8 hours activities + 2-3 hours homework daily

**Recent patterns from emails**:
- Math teacher mentioned Emma seems rushed in class
- Piano teacher suggested reducing to every other week during busy school periods
- Soccer coach email about optional weekend practices

**Suggestions**:
1. **Immediate**: Skip optional Saturday soccer practices this month
2. **Consider**: Switch piano to bi-weekly during school semester
3. **Academic**: Schedule that math teacher conference - Emma might need extra support

Would you like me to help you email Emma's piano teacher about schedule adjustments?`,
      keywords: ['homework', 'too much', 'stressed', 'activities', 'emma', 'busy']
    },
    {
      id: 'bills-due',
      userMessage: "What bills do I need to pay?",
      assistantResponse: `Here are your upcoming payments:

**Due This Week**:
- Piano lessons: $120 (due tomorrow)
- Soccer registration: $85 (due Friday)
- Jake's school lunch account: $45 (running low)

**Due Next Week**:
- Emma's chess club membership: $35
- Dental cleaning copay: $25

**Smart insights**:
- You can save $15/month by switching to annual piano lesson payments
- Soccer has a sibling discount available for Jake next season
- School lunch auto-reload is available to avoid running low`,
      keywords: ['bills', 'pay', 'payment', 'money', 'due', 'cost']
    }
  ],

  // Default fallback responses
  FALLBACK_RESPONSES: [
    "That's a great question! In the full version, I'd analyze your family's data to provide a personalized answer. This is our demo mode showing core capabilities.",
    "I'd love to help with that! The complete platform has access to your emails and calendar to give you specific insights. This demo shows our key features.",
    "Great point! The full system learns your family's patterns over time. This demonstration highlights our main functionality."
  ]
};

// Helper function to check if user is in demo mode
export const isDemoMode = (userEmail: string | null | undefined): boolean => {
  return userEmail === DEMO_CONFIG.DEMO_EMAIL;
};

// Helper function to find matching demo response
export const findDemoResponse = (userInput: string): string | null => {
  const input = userInput.toLowerCase();

  for (const conversation of DEMO_CONFIG.DEMO_CONVERSATIONS) {
    const hasKeyword = conversation.keywords.some(keyword =>
      input.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      return conversation.assistantResponse;
    }
  }

  return null;
};

// Get random fallback response
export const getDemoFallback = (): string => {
  const responses = DEMO_CONFIG.FALLBACK_RESPONSES;
  return responses[Math.floor(Math.random() * responses.length)];
};