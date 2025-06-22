// Initialize Firebase by fetching config from server
async function initializeFirebase() {
  try {
    const response = await apiCall('/api/firebase-config');
    
    // Initialize Firebase
    firebase.initializeApp(response);
    return firebase.auth();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Initialize Firebase and set up auth
let auth;
initializeFirebase().then(authInstance => {
  auth = authInstance;
  
  // Check if user is already signed in
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, redirect to dashboard
      window.location.href = '/dashboard.html';
    }
  });
  
  // Set up form handlers after Firebase is initialized
  setupFormHandlers();
}).catch(error => {
  console.error('Firebase initialization failed:', error);
  document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Service Unavailable</h2><p>Unable to initialize authentication service.</p></div>';
});

// DOM elements
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const toggleToSignUp = document.getElementById('toggleToSignUp');
const toggleToSignIn = document.getElementById('toggleToSignIn');
const signInError = document.getElementById('signInError');
const signUpError = document.getElementById('signUpError');

function setupFormHandlers() {
  // Toggle between sign in and sign up forms
  toggleToSignUp.addEventListener('click', () => {
    signInForm.style.display = 'none';
    signUpForm.style.display = 'block';
    toggleToSignUp.style.display = 'none';
    toggleToSignIn.style.display = 'inline';
    signInError.textContent = '';
    signUpError.textContent = '';
  });

  toggleToSignIn.addEventListener('click', () => {
    signUpForm.style.display = 'none';
    signInForm.style.display = 'block';
    toggleToSignIn.style.display = 'none';
    toggleToSignUp.style.display = 'inline';
    signInError.textContent = '';
    signUpError.textContent = '';
  });

  // Handle sign in
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    
    try {
      signInError.textContent = '';
      await auth.signInWithEmailAndPassword(email, password);
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error('Sign in error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          signInError.textContent = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          signInError.textContent = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          signInError.textContent = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          signInError.textContent = 'This account has been disabled.';
          break;
        default:
          signInError.textContent = 'An error occurred during sign in.';
      }
    }
  });

  // Handle sign up
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    
    try {
      signUpError.textContent = '';
      await auth.createUserWithEmailAndPassword(email, password);
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error('Sign up error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          signUpError.textContent = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          signUpError.textContent = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          signUpError.textContent = 'Password should be at least 6 characters.';
          break;
        default:
          signUpError.textContent = 'An error occurred during sign up.';
      }
    }
  });

  // Add loading states
  function setLoading(form, loading) {
    const button = form.querySelector('button[type="submit"]');
    if (loading) {
      button.textContent = 'Loading...';
      button.disabled = true;
    } else {
      button.textContent = button.textContent.includes('Sign In') ? 'Sign In' : 'Sign Up';
      button.disabled = false;
    }
  }

  signInForm.addEventListener('submit', () => setLoading(signInForm, true));
  signUpForm.addEventListener('submit', () => setLoading(signUpForm, true));

  // Reset loading state on error
  signInError.addEventListener('DOMSubtreeModified', () => setLoading(signInForm, false));
  signUpError.addEventListener('DOMSubtreeModified', () => setLoading(signUpForm, false));
} 