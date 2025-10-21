#!/usr/bin/env node

import fetch from 'node-fetch';

// Test email data that simulates an inbound email with family content
const testEmailData = {
  from: 'teacher@elementary.school.edu',
  to: 'turnernelson1-659959@inbound.homeops.ai',
  subject: 'Reminder: Emma\'s Field Trip Permission Slip Due Tomorrow',
  text: `Dear Parents,

This is a friendly reminder that Emma Thompson's permission slip for the Science Museum field trip is due tomorrow (Friday). Please make sure to:

1. Sign the permission slip
2. Include $15 for lunch
3. Pack a water bottle and comfortable walking shoes

The trip is on Monday, October 23rd from 9 AM to 3 PM. Students should arrive at school by 8:30 AM.

If you have any questions, please contact me at teacher@elementary.school.edu or call the school office at (555) 123-4567.

Thank you!
Mrs. Johnson
3rd Grade Teacher
Lincoln Elementary School`,
  html: `<p>Dear Parents,</p>
<p>This is a friendly reminder that <strong>Emma Thompson's</strong> permission slip for the Science Museum field trip is due tomorrow (Friday).</p>
<p>Please make sure to:</p>
<ol>
<li>Sign the permission slip</li>
<li>Include $15 for lunch</li>
<li>Pack a water bottle and comfortable walking shoes</li>
</ol>
<p>The trip is on Monday, October 23rd from 9 AM to 3 PM. Students should arrive at school by 8:30 AM.</p>
<p>If you have any questions, please contact me at teacher@elementary.school.edu or call the school office at (555) 123-4567.</p>
<p>Thank you!</p>
<p>Mrs. Johnson<br>
3rd Grade Teacher<br>
Lincoln Elementary School</p>`,
  date: new Date().toISOString(),
  messageId: `<CABcdefg${Date.now()}@mail.gmail.com>`
};

async function testInboundEmail() {
  try {
    console.log('🧪 Testing inbound email processing with AI analysis...');
    console.log('📧 Sending test email:', testEmailData.subject);

    const response = await fetch('http://127.0.0.1:10000/inbound-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData)
    });

    const result = await response.json();

    console.log('\n📊 Response Status:', response.status);
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Test passed! Email processed successfully');
      console.log('🔄 Job ID:', result.jobId);
      console.log('📝 Job Status:', result.status);
    } else {
      console.log('\n❌ Test failed!');
      console.log('🚨 Error:', result.error);
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

// Run the test
testInboundEmail();