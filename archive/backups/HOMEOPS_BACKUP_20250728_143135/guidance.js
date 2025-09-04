const express = require('express');
const router = express.Router();

// LIFE INTELLIGENCE FRAMEWORKS DATABASE
const frameworks = {
  relationship: {
    'gottman_method': {
      name: "Gottman Method",
      description: "Research-backed approach to relationship dynamics",
      application: "Focus on building love maps, nurturing fondness, and managing conflict constructively"
    },
    'attachment_theory': {
      name: "Attachment Theory",
      description: "Understanding emotional bonds and security needs",
      application: "Identify attachment style and communicate needs clearly"
    },
    'nonviolent_communication': {
      name: "Nonviolent Communication",
      description: "Marshall Rosenberg's framework for compassionate communication",
      application: "Express observations, feelings, needs, and requests without judgment"
    }
  },
  stress_anxiety: {
    'cognitive_behavioral': {
      name: "CBT Triangle",
      description: "Understanding the connection between thoughts, feelings, and behaviors",
      application: "Identify thought patterns, challenge cognitive distortions, and create behavioral changes"
    },
    'window_of_tolerance': {
      name: "Window of Tolerance",
      description: "Dan Siegel's concept of optimal arousal zones",
      application: "Recognize when you're in hyper/hypoarousal and use grounding techniques"
    },
    'polyvagal_theory': {
      name: "Polyvagal Theory",
      description: "Stephen Porges' framework for nervous system regulation",
      application: "Use breathwork and body awareness to activate the parasympathetic nervous system"
    }
  },
  overwhelm: {
    'energy_management': {
      name: "Energy Management Framework",
      description: "Tony Schwartz's approach to sustainable performance",
      application: "Focus on renewal cycles instead of time management - physical, emotional, mental, spiritual energy"
    },
    'decision_fatigue': {
      name: "Decision Fatigue Protocol",
      description: "Barack Obama's approach to cognitive load reduction",
      application: "Reduce micro-decisions through systems, automate choices, batch similar decisions"
    },
    '5_second_rule': {
      name: "Mel Robbins 5-Second Rule",
      description: "Interrupt hesitation patterns and take immediate action",
      application: "Count 5-4-3-2-1 and take one small action before your brain talks you out of it"
    }
  },
  career: {
    'ikigai': {
      name: "Ikigai Framework",
      description: "Japanese concept of life purpose intersection",
      application: "Find overlap between what you love, what you're good at, what the world needs, and what you can be paid for"
    },
    'strengths_finder': {
      name: "CliftonStrengths",
      description: "Gallup's strengths-based development approach",
      application: "Identify and amplify your top 5 strengths instead of fixing weaknesses"
    },
    'zone_of_genius': {
      name: "Zone of Genius",
      description: "Gay Hendricks' framework for upper limit problems",
      application: "Move from zone of competence to zone of excellence to zone of genius"
    }
  },
  parenting: {
    'connection_before_correction': {
      name: "Connection Before Correction",
      description: "Dr. Daniel Siegel's approach to discipline",
      application: "Address the emotional need first, then the behavioral issue"
    },
    'positive_discipline': {
      name: "Positive Discipline",
      description: "Jane Nelsen's framework for respectful parenting",
      application: "Kind and firm boundaries that teach life skills without punishment"
    },
    'conscious_parenting': {
      name: "Conscious Parenting",
      description: "Dr. Shefali Tsabary's awareness-based approach",
      application: "Parent from consciousness rather than conditioning, seeing children as teachers"
    }
  }
};

// USER PERSONA LEARNING ENGINE
const userProfiles = new Map(); // In production, this would be a database

function updateUserProfile(userId, insights) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      communication_style: 'direct',
      overwhelm_triggers: [],
      successful_frameworks: [],
      blockers: [],
      interaction_count: 0
    });
  }
  
  const profile = userProfiles.get(userId);
  profile.interaction_count++;
  
  // Update profile with new insights
  if (insights.overwhelm_triggers) {
    profile.overwhelm_triggers.push(...insights.overwhelm_triggers);
  }
  if (insights.blockers) {
    profile.blockers.push(...insights.blockers);
  }
  if (insights.communication_style) {
    profile.communication_style = insights.communication_style;
  }
  
  userProfiles.set(userId, profile);
  return profile;
}

// ENHANCED USER PROFILE WITH EMAIL INSIGHTS
function createEnhancedUserProfile(userId, emailData) {
  return {
    // Current tracking
    communication_style: 'direct',
    overwhelm_triggers: [],
    successful_frameworks: [],
    blockers: [],
    interaction_count: 0,
    
    // NEW: Email-derived insights
    email_patterns: {
      peak_stress_times: emailData.stressIndicators || [],
      family_commitments: emailData.familyCommitments || [],
      work_pressure_points: emailData.workPressure || [],
      social_obligations: emailData.socialLoad || []
    },
    
    // NEW: Commerce behavior insights  
    spending_triggers: {
      emotional_purchases: emailData.emotionalSpending || [],
      stress_shopping_patterns: emailData.stressSpending || [],
      family_pressure_buys: emailData.familySpending || []
    },
    
    // NEW: Communication style from emails
    relationship_dynamics: {
      family_tone: emailData.familyTone || 'neutral',
      work_communication: emailData.workTone || 'professional',
      conflict_patterns: emailData.conflictIndicators || []
    }
  };
}

// CALENDAR INTELLIGENCE FOR LIFE COACHING
function analyzeCalendarPatterns(calendarData) {
  return {
    schedule_pressure: {
      back_to_back_meetings: calendarData.consecutiveMeetings || 0,
      early_late_conflicts: calendarData.scheduleConflicts || [],
      travel_stress: calendarData.travelDays || 0
    },
    
    family_time_analysis: {
      family_blocked_time: calendarData.familyTime || 0,
      individual_time: calendarData.personalTime || 0,
      date_nights: calendarData.coupleTime || 0
    },
    
    energy_depletion_signals: {
      meeting_overload_days: calendarData.heavyDays || [],
      context_switching: calendarData.taskSwitching || 0,
      buffer_time: calendarData.breaks || 0
    }
  };
}

// CALENDAR-INFORMED COACHING
function enhanceCoachingWithCalendar(framework, calendarInsights) {
  if (framework.name === "Energy Management Framework") {
    return {
      ...framework,
      personalized_application: `Your calendar shows ${calendarInsights.schedule_pressure.back_to_back_meetings} back-to-back meetings this week. Let's focus on micro-recovery between meetings and protecting your evening energy.`,
      specific_recommendations: [
        "Block 5-minute buffers between meetings for breathing",
        "Identify your 2 highest-energy hours and protect them",
        "Schedule 'energy renewal' blocks like you would important meetings"
      ]
    };
  }
  
  if (framework.name === "Gottman Method") {
    return {
      ...framework,
      personalized_application: `Your calendar shows only ${calendarInsights.family_time_analysis.date_nights} dedicated couple time this month. The Gottman research emphasizes regular connection rituals.`,
      specific_recommendations: [
        "Schedule weekly 20-minute 'stress-reducing conversations'",
        "Add a recurring 'appreciation moment' to your calendar",
        "Block family time as non-negotiable as work meetings"
      ]
    };
  }
  
  return framework;
}

// INTELLIGENT FRAMEWORK SELECTION
function selectOptimalFramework(message, userProfile) {
  const msg = message.toLowerCase();
  
  // Relationship issues
  if (msg.includes('wife') || msg.includes('husband') || msg.includes('partner') || 
      msg.includes('relationship') || msg.includes('marriage') || msg.includes('resent')) {
    return frameworks.relationship.gottman_method;
  }
  
  // Stress and anxiety
  if (msg.includes('anxious') || msg.includes('stress') || msg.includes('worry') || 
      msg.includes('panic') || msg.includes('nervous')) {
    return frameworks.stress_anxiety.cognitive_behavioral;
  }
  
  // Overwhelm
  if (msg.includes('overwhelm') || msg.includes('too much') || msg.includes('can\'t handle') || 
      msg.includes('exhausted') || msg.includes('burned out')) {
    return frameworks.overwhelm.energy_management;
  }
  
  // Career issues  
  if (msg.includes('career') || msg.includes('job') || msg.includes('work') || 
      msg.includes('promotion') || msg.includes('purpose')) {
    return frameworks.career.ikigai;
  }
  
  // Parenting
  if (msg.includes('kid') || msg.includes('child') || msg.includes('parenting') || 
      msg.includes('teen') || msg.includes('family')) {
    return frameworks.parenting.connection_before_correction;
  }
  
  // Default to CBT for general emotional issues
  return frameworks.stress_anxiety.cognitive_behavioral;
}

// ENHANCED FRAMEWORK SELECTION WITH EMAIL CONTEXT
function selectOptimalFrameworkWithContext(message, userProfile, emailContext) {
  const msg = message.toLowerCase();
  
  // Use email context to enhance framework selection
  if (msg.includes('overwhelm') && emailContext?.workEmails > 50) {
    // High email volume suggests energy management + email boundaries
    return {
      primary: frameworks.overwhelm.energy_management,
      secondary: frameworks.overwhelm.decision_fatigue,
      context: `Your email analysis shows ${emailContext.workEmails} work emails this week`
    };
  }
  
  if (msg.includes('relationship') && emailContext?.familyConflict) {
    return {
      primary: frameworks.relationship.gottman_method,
      context: `Your recent email patterns suggest family coordination stress`
    };
  }
  
  // Continue with existing logic...
  return selectOptimalFramework(message, userProfile);
}

// CHAT HISTORY INTELLIGENCE
const chatHistory = new Map(); // In production: database

function analyzeChatPatterns(userId) {
  const userChats = chatHistory.get(userId) || [];
  
  return {
    recurring_themes: {
      most_common_struggles: extractCommonTopics(userChats),
      improvement_areas: identifyGrowthPatterns(userChats),
      successful_strategies: findWhatWorked(userChats)
    },
    
    coaching_effectiveness: {
      framework_success_rate: measureFrameworkSuccess(userChats),
      preferred_communication_style: detectPreferredTone(userChats),
      follow_through_patterns: trackActionCompletion(userChats)
    },
    
    life_context_evolution: {
      stress_level_trends: trackStressProgression(userChats),
      relationship_mentions: trackRelationshipHealth(userChats),
      career_satisfaction: trackCareerMentions(userChats)
    }
  };
}

// PERSONALIZED COACHING BASED ON HISTORY
function createPersonalizedCoaching(message, userProfile, emailContext, calendarContext, chatHistory) {
  const chatInsights = analyzeChatPatterns(userProfile.userId);
  
  // If user has asked about relationship issues 3+ times, escalate framework
  if (chatInsights.recurring_themes.most_common_struggles.includes('relationship') && 
      chatInsights.recurring_themes.most_common_struggles.relationship.count >= 3) {
    
    return {
      escalation_notice: true,
      message: "I notice this is the third time we're working on relationship dynamics. Let's try a deeper approach.",
      recommended_framework: frameworks.relationship.attachment_theory,
      suggested_action: "Consider couples therapy or a relationship workshop - you've outgrown basic frameworks"
    };
  }
  
  // If energy management has worked before, reference it
  if (chatInsights.coaching_effectiveness.framework_success_rate['energy_management'] > 0.8) {
    return {
      reference_success: `Remember how well the energy management approach worked for you last month? Let's apply that same principle here.`,
      build_on_strength: true
    };
  }
  
  return null; // No special personalization needed
}

// MASTER INTEGRATION FUNCTION
async function generateAdvancedLifeIntelligence(message, userId) {
  try {
    // 1. Get all data sources
    const userProfile = getUserProfile(userId);
    const emailInsights = await getEmailIntelligence(userId);
    const calendarData = await getCalendarAnalysis(userId);
    const chatHistory = getChatHistory(userId);
    
    // 2. Analyze patterns across all sources
    const crossPlatformInsights = {
      stress_correlation: correlateEmailCalendarStress(emailInsights, calendarData),
      family_dynamics: correlateEmailChatFamily(emailInsights, chatHistory),
      energy_patterns: correlateCalendarChatEnergy(calendarData, chatHistory),
      growth_trajectory: analyzeProgressOverTime(chatHistory, userProfile)
    };
    
    // 3. Select framework with full context
    const enhancedFramework = selectOptimalFrameworkWithContext(
      message, 
      userProfile, 
      {
        email: emailInsights,
        calendar: calendarData,
        chat: chatHistory,
        insights: crossPlatformInsights
      }
    );
    
    // 4. Generate hyper-personalized coaching
    const personalizedCoaching = await generateCoachingWithFullContext({
      message,
      framework: enhancedFramework,
      user_profile: userProfile,
      data_insights: crossPlatformInsights,
      success_patterns: chatHistory.successful_strategies
    });
    
    return personalizedCoaching;
    
  } catch (error) {
    console.error('Advanced Life Intelligence error:', error);
    // Fallback to basic coaching
    return generateBasicLifeIntelligence(message, userId);
  }
}

// Example of what this would produce:
/*
USER: "I'm feeling overwhelmed with everything"

ENHANCED RESPONSE:
{
  "analysis": "Based on your email patterns (47 unread school emails this week) and calendar (6 back-to-back meetings yesterday), I can see why you're overwhelmed. This matches the pattern from our conversation 3 weeks ago.",
  
  "framework_explanation": "Energy Management Framework worked well for you before (remember the micro-recovery strategy?). But now I'm adding Polyvagal regulation because your calendar shows no buffer time for nervous system reset.",
  
  "next_step": "Today: Add 5-minute 'reset breaks' between your 2-4pm meetings. Use the breathing technique that helped you last month.",
  
  "reframe": "Your overwhelm isn't weakness - it's data. Your nervous system is telling you the current pace isn't sustainable.",
  
  "personalized_insights": {
    "pattern_recognition": "This overwhelm peaks every 3rd week when school emails spike above 30",
    "what_worked_before": "Micro-recovery breaks reduced your stress 73% last time",
    "family_context": "Emma's soccer schedule conflicts with your meeting-heavy days",
    "energy_optimization": "Your best thinking happens 9-11am but you've scheduled admin work then"
  }
}
*/

router.post('/', async (req, res) => {
  const { message, userId = 'anonymous' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Hardcode API key temporarily to bypass environment issues (same as commerce)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Get or create user profile
    const userProfile = userProfiles.get(userId) || {
      communication_style: 'direct',
      overwhelm_triggers: [],
      successful_frameworks: [],
      blockers: [],
      interaction_count: 0
    };

    // Select optimal framework for this situation
    const selectedFramework = selectOptimalFramework(message, userProfile);

    // Build sophisticated system prompt
    const systemPrompt = `You are HomeOps — the premier Life Intelligence coach for high-performing parents and professionals. You specialize in evidence-based frameworks that create lasting change.

USER PROFILE:
- Communication style: ${userProfile.communication_style}
- Interaction count: ${userProfile.interaction_count}
- Previous triggers: ${userProfile.overwhelm_triggers.join(', ') || 'None identified yet'}
- Known blockers: ${userProfile.blockers.join(', ') || 'None identified yet'}

SELECTED FRAMEWORK FOR THIS SESSION:
${selectedFramework.name}: ${selectedFramework.description}
Application: ${selectedFramework.application}

INSTRUCTIONS:
1. Provide empathetic understanding WITHOUT toxic positivity
2. Apply the selected framework specifically to their situation  
3. Give ONE clear, actionable next step they can take today
4. Offer a perspective reframe that shifts how they see the situation
5. Be direct, warm, and evidence-based (like Mel Robbins + Dr. Gottman + Andrew Huberman)

Respond in this JSON structure:
{
  "analysis": "Empathetic understanding of their situation - be specific, not generic",
  "framework_explanation": "How this specific framework applies to their exact situation",
  "next_step": "One concrete action they can take in the next 24 hours",
  "reframe": "A perspective shift that helps them see their situation differently",
  "user_insights": {
    "overwhelm_triggers": ["specific trigger you notice"],
    "blockers": ["main thing holding them back"],
    "communication_style": "direct/gentle/analytical based on their message tone"
  }
}`;

    // Life guidance response using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content || '{}';

    try {
      // Parse the structured response
      const parsedResponse = JSON.parse(rawResponse);
      
      // Update user profile with new insights
      if (parsedResponse.user_insights) {
        updateUserProfile(userId, parsedResponse.user_insights);
      }

      res.json({
        success: true,
        type: 'life_intelligence',
        framework_used: selectedFramework.name,
        analysis: parsedResponse.analysis,
        framework_explanation: parsedResponse.framework_explanation, 
        next_step: parsedResponse.next_step,
        reframe: parsedResponse.reframe,
        user_insights: parsedResponse.user_insights,
        user_profile: {
          interaction_count: userProfile.interaction_count,
          communication_style: userProfile.communication_style,
          learning_progress: `${userProfile.successful_frameworks.length} frameworks mastered`
        }
      });

    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse Life Intelligence JSON:', parseError);
      res.json({
        success: true,
        type: 'life_intelligence_fallback',
        guidance: rawResponse,
        framework_used: selectedFramework.name
      });
    }

  } catch (error) {
    console.error('Life Intelligence error:', error);
    res.status(500).json({ 
      error: 'Life guidance service temporarily unavailable',
      fallback: 'Try rephrasing your question or check back in a moment.'
    });
  }
});

module.exports = router;
