// Backend API configuration - now everything runs on the same domain
const BACKEND_URL = window.location.origin;  // Use the same domain

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  // Ensure /api/ prefix for firebase-config
  if (endpoint === '/firebase-config') endpoint = '/api/firebase-config';
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