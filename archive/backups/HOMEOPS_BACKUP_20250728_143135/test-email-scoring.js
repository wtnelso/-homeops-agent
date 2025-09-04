#!/usr/bin/env node

// 🧪 Email Scoring System Test Suite
// This script demonstrates the intelligent filtering in action

console.log('🧠 Testing HomeOps Email Scoring System\n');

// Sample emails for testing the scoring algorithm
const testEmails = [
  {
    subject: 'Field trip permission slip - Due Friday',
    snippet: 'Please sign and return the permission slip for the science museum field trip next week.',
    from: 'teacher@lincoln-elementary.edu'
  },
  {
    subject: 'Golf league practice canceled - Weather',
    snippet: 'Due to rain, tonight\'s golf practice at Oak Hill is canceled. See you Thursday!',
    from: 'captain@oakhill-golf.com'
  },
  {
    subject: 'Your Amazon order has shipped',
    snippet: 'Order #123-456-789 containing kids shoes has been shipped and will arrive Tuesday.',
    from: 'ship-confirm@amazon.com'
  },
  {
    subject: 'Re: Soccer carpool this weekend',
    snippet: 'I can pick up Tommy and Sarah for Saturday\'s game. What time should I be there?',
    from: 'mom@gmail.com'
  },
  {
    subject: 'URGENT: Limited time offer - 50% off!',
    snippet: 'Don\'t miss out! This exclusive deal expires in 24 hours. Act now before it\'s gone forever!',
    from: 'noreply@marketing-blast.com'
  },
  {
    subject: 'Weekly newsletter - Home improvement tips',
    snippet: 'This week\'s digest includes 10 ways to improve your curb appeal and save money.',
    from: 'newsletter@homeimprovement.com'
  },
  {
    subject: 'Parent-teacher conference reminder',
    snippet: 'Your scheduled conference is tomorrow at 3:30 PM. Please bring Emma\'s reading folder.',
    from: 'office@jefferson-middle.edu'
  },
  {
    subject: 'Dentist appointment confirmation',
    snippet: 'Appointment confirmed for John Baron on Jan 30th at 2:00 PM for routine cleaning.',
    from: 'appointments@smiledental.com'
  }
];

// Import the scoring function (simplified version for testing)
function scoreEmail(email) {
  let score = 0;
  
  const subject = email.subject?.toLowerCase() || '';
  const snippet = email.snippet?.toLowerCase() || '';
  const sender = email.from?.toLowerCase() || '';
  const content = `${subject} ${snippet}`;
  
  console.log(`📊 Scoring: "${email.subject}"`);
  console.log(`   From: ${email.from}`);
  
  // 🏫 Family / School / Camps (Highest Priority)
  if (content.match(/school|pta|classroom|field trip|camp|tuition|signup|parent|teacher|student|homework|grades|conference/i)) {
    score += 10;
    console.log(`   +10 Family/School detected`);
  }
  
  // ⛳ Club / Community (High Priority)
  if (content.match(/golf|club|league|practice|team|volunteer|community|meeting|event|tournament|registration/i)) {
    score += 8;
    console.log(`   +8 Club/Community detected`);
  }
  
  // 🛒 Purchases / Confirmed Orders
  if (content.match(/order confirmed|shipped|tracking|receipt|purchase|delivery|your order/i)) {
    score += 6;
    console.log(`   +6 Order confirmation detected`);
  }
  
  // 👤 Personal (non-corporate) senders
  const domain = sender.split('@')[1] || '';
  const isPersonal = !domain.includes('.com') || 
                    domain.includes('gmail.') || 
                    domain.includes('yahoo.') || 
                    domain.includes('hotmail.') ||
                    !sender.includes('noreply') && !sender.includes('no-reply');
  
  if (isPersonal && !content.match(/unsubscribe|marketing|promotion/i)) {
    score += 7;
    console.log(`   +7 Personal sender detected`);
  }
  
  // 💰 Finance / Admin / Medical (Important but not urgent)
  if (content.match(/copay|insurance|invoice|bill|statement|payment|account|balance|medical|appointment|doctor|dentist/i)) {
    score += 5;
    console.log(`   +5 Finance/Medical detected`);
  }
  
  // 📅 Calendar Events (Smart signals)
  if (content.match(/calendar|meeting|appointment|schedule|rsvp|save the date|reminder/i)) {
    score += 4;
    console.log(`   +4 Calendar event detected`);
  }
  
  // 🎯 High manipulation score penalty
  const manipulationKeywords = content.match(/urgent|limited time|act now|expires|don't miss|final notice|last chance/gi) || [];
  if (manipulationKeywords.length >= 2) {
    score -= 4;
    console.log(`   -4 High manipulation detected (${manipulationKeywords.length} keywords)`);
  }
  
  // 🚫 Noise / No-reply filtering (Heavy penalty)
  if (sender.includes('noreply') || 
      sender.includes('no-reply') || 
      sender.includes('mailchimp') ||
      sender.includes('constantcontact') ||
      content.match(/unsubscribe|marketing blast|newsletter|promotional/i)) {
    score -= 3;
    console.log(`   -3 Noise/No-reply detected`);
  }
  
  // 📧 Newsletter/Promotional penalty
  if (content.match(/newsletter|weekly digest|marketing|promotion|deal|sale|% off|discount/i)) {
    score -= 2;
    console.log(`   -2 Newsletter/Promotional detected`);
  }
  
  const finalScore = Math.max(0, score);
  console.log(`   🎯 Final Score: ${finalScore}\n`);
  return finalScore;
}

// Run the scoring test
console.log('═══════════════════════════════════════════════════════════\n');

const scoredEmails = testEmails
  .map(email => ({ ...email, score: scoreEmail(email) }))
  .sort((a, b) => b.score - a.score);

console.log('═══════════════════════════════════════════════════════════');
console.log('🏆 FINAL RESULTS - Ranked by Intelligence Score\n');

scoredEmails.forEach((email, index) => {
  const priority = email.score >= 8 ? '🔴 HIGH' : email.score >= 6 ? '🟡 MEDIUM' : '🟢 LOW';
  const willShow = email.score >= 6 ? '✅ SHOWS IN CALIBRATION' : '❌ FILTERED OUT';
  
  console.log(`${index + 1}. Score: ${email.score} | ${priority} | ${willShow}`);
  console.log(`   "${email.subject}"`);
  console.log(`   From: ${email.from}\n`);
});

const highValueEmails = scoredEmails.filter(email => email.score >= 6);
console.log(`📊 Summary: ${highValueEmails.length}/${testEmails.length} emails would be shown to user`);
console.log(`🎯 Filtering efficiency: ${Math.round((1 - highValueEmails.length/testEmails.length) * 100)}% noise reduction`);
