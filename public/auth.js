// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyDx_ygwnomCIM-1kqY6GJBjYkHy5UaR_g8',
    authDomain: 'homeops-web.firebaseapp.com',
    projectId: 'homeops-web',
    storageBucket: 'homeops-web.firebasestorage.app',
    messagingSenderId: '620328376664',
    appId: '1:620328376664:web:e1aa715f26f4a2f143ad2d',
    measurementId: 'G-Q4924PYF55'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM elements
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const googleSigninBtn = document.getElementById('google-signin');
const googleSignupBtn = document.getElementById('google-signup');

// Tab switching functionality
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        authForms.forEach(form => form.classList.remove('active'));
        if (targetTab === 'signin') {
            signinForm.classList.add('active');
        } else {
            signupForm.classList.add('active');
        }
    });
});

// Form submission handlers
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    await signInWithEmail(email, password);
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    await signUpWithEmail(name, email, password);
});

// Google authentication
googleSigninBtn.addEventListener('click', () => signInWithGoogle());
googleSignupBtn.addEventListener('click', () => signInWithGoogle());

// Email/Password Sign In
async function signInWithEmail(email, password) {
    const btn = signinForm.querySelector('.auth-btn.primary');
    setLoading(btn, true);
    
    try {
        clearErrors();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Signed in successfully:', userCredential.user.email);
        redirectToDashboard();
    } catch (error) {
        console.error('Sign in error:', error);
        showError('signin-email', getErrorMessage(error.code));
    } finally {
        setLoading(btn, false);
    }
}

// Email/Password Sign Up
async function signUpWithEmail(name, email, password) {
    const btn = signupForm.querySelector('.auth-btn.primary');
    setLoading(btn, true);
    
    try {
        clearErrors();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update user profile with display name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        console.log('Account created successfully:', userCredential.user.email);
        redirectToDashboard();
    } catch (error) {
        console.error('Sign up error:', error);
        showError('signup-email', getErrorMessage(error.code));
    } finally {
        setLoading(btn, false);
    }
}

// Google Sign In
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    
    try {
        clearErrors();
        const result = await auth.signInWithPopup(provider);
        console.log('Google sign in successful:', result.user.email);
        redirectToDashboard();
    } catch (error) {
        console.error('Google sign in error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed the popup, no need to show error
            return;
        }
        showError('signin-email', getErrorMessage(error.code));
    }
}

// Utility functions
function setLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message') || createErrorElement(formGroup);
    
    formGroup.classList.add('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function createErrorElement(formGroup) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    formGroup.appendChild(errorElement);
    return errorElement;
}

function clearErrors() {
    document.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

function redirectToDashboard() {
    // Store authentication state
    localStorage.setItem('homeops_authenticated', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
}

// Check if user is already signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is already signed in:', user.email);
        redirectToDashboard();
    }
});

// Add some nice animations
document.addEventListener('DOMContentLoaded', () => {
    const authCard = document.querySelector('.auth-card');
    authCard.style.opacity = '0';
    authCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        authCard.style.transition = 'all 0.6s ease-out';
        authCard.style.opacity = '1';
        authCard.style.transform = 'translateY(0)';
    }, 100);
}); 