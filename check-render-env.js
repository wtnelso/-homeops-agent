// Simple script to check Render environment variables
console.log('🔍 Checking Render environment variables...');
console.log('GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('GMAIL_REDIRECT_URI:', process.env.GMAIL_REDIRECT_URI || 'NOT SET');

if (process.env.GMAIL_CLIENT_ID) {
  console.log('Current Gmail Client ID:', process.env.GMAIL_CLIENT_ID);
}

if (process.env.GMAIL_REDIRECT_URI) {
  console.log('Current Redirect URI:', process.env.GMAIL_REDIRECT_URI);
}

console.log('\n📋 To fix the OAuth issue:');
console.log('1. Go to https://dashboard.render.com');
console.log('2. Select your homeops-agent service');
console.log('3. Go to Environment tab');
console.log('4. Update GMAIL_CLIENT_ID to: 242818294886-jujpis5fu57kmn8djcng0um75v0ivm76.apps.googleusercontent.com');
console.log('5. Set GMAIL_REDIRECT_URI to: https://homeops-agent.onrender.com/auth/google/callback');
console.log('6. Redeploy the service'); 