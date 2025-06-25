// Backend API configuration
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'  // Local development
  : 'https://homeops-agent.onrender.com';  // Production backend

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  return response.json();
} 