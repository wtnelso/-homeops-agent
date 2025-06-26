// Initialize Firebase by fetching config from server
async function initializeFirebase() {
  try {
    const response = await apiCall('/api/firebase-config');
    
    // Initialize Firebase
    firebase.initializeApp(response);
    return firebase.auth();
  } catch (error) {
    console.error('Failed to initialize Firebase from API:', error);
    console.log('Using fallback Firebase config');
    
    // Fallback Firebase config for homeops-web project
    const fallbackConfig = {
      apiKey: "AIzaSyBxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx",
      authDomain: "homeops-web.firebaseapp.com",
      projectId: "homeops-web",
      storageBucket: "homeops-web.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };
    
    // Initialize Firebase with fallback config
    firebase.initializeApp(fallbackConfig);
    return firebase.auth();
  }
}

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  // Show loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'authLoading';
  loadingDiv.style = 'text-align:center;padding:50px;';
  loadingDiv.innerHTML = '<h2>Loading...</h2>';
  document.body.appendChild(loadingDiv);

  // Hide forms initially
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const toggleToSignUp = document.getElementById('toggleToSignUp');
  const toggleToSignIn = document.getElementById('toggleToSignIn');
  const signInError = document.getElementById('signInError');
  const signUpError = document.getElementById('signUpError');
  if (signInForm) signInForm.style.display = 'none';
  if (signUpForm) signUpForm.style.display = 'none';
  if (toggleToSignUp) toggleToSignUp.style.display = 'none';
  if (toggleToSignIn) toggleToSignIn.style.display = 'none';

  // Initialize Firebase and set up auth
  let auth;
  initializeFirebase().then(authInstance => {
    auth = authInstance;
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        window.location.href = '/dashboard.html';
      } else {
        // Not signed in, show forms
        if (loadingDiv) loadingDiv.remove();
        if (signInForm) signInForm.style.display = 'block';
        if (toggleToSignUp) toggleToSignUp.style.display = 'inline';
        setupFormHandlers();
      }
    });
  }).catch(error => {
    console.error('Firebase initialization failed:', error);
    if (loadingDiv) loadingDiv.innerHTML = '<h2>Service Unavailable</h2><p>Unable to initialize authentication service.</p>';
  });

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
      setLoading(signInForm, true);
      const email = document.getElementById('signInEmail').value;
      const password = document.getElementById('signInPassword').value;
      try {
        signInError.textContent = '';
        await auth.signInWithEmailAndPassword(email, password);
        // Redirect will happen automatically via onAuthStateChanged
      } catch (error) {
        setLoading(signInForm, false);
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
      setLoading(signUpForm, true);
      const email = document.getElementById('signUpEmail').value;
      const password = document.getElementById('signUpPassword').value;
      try {
        signUpError.textContent = '';
        await auth.createUserWithEmailAndPassword(email, password);
        // Redirect will happen automatically via onAuthStateChanged
      } catch (error) {
        setLoading(signUpForm, false);
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
    // Reset loading state on error
    signInError.addEventListener('DOMSubtreeModified', () => setLoading(signInForm, false));
    signUpError.addEventListener('DOMSubtreeModified', () => setLoading(signUpForm, false));
  }
}); 