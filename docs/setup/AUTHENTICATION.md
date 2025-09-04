# HomeOps Authentication Flow

## Overview

HomeOps now has a complete authentication system using Firebase Auth with both email/password and Google OAuth support.

## Authentication Flow

### 1. Landing Page (`/`)
- Superhuman-style onboarding page
- "Get Started with HomeOps" button redirects to `/auth`

### 2. Authentication Page (`/auth`)
- Clean, modern login/signup interface
- Tabbed interface to switch between Sign In and Sign Up
- Email/password authentication
- Google OAuth with Gmail scope
- Automatic redirect to dashboard after successful authentication

### 3. Dashboard (`/dashboard`)
- Protected route - requires authentication
- Unauthenticated users are redirected to `/auth`
- Shows user email in header
- Logout functionality

## Features

### Email/Password Authentication
- User registration with full name, email, and password
- User login with email and password
- Password validation (minimum 6 characters)
- Error handling with user-friendly messages

### Google OAuth
- One-click Google sign-in
- Automatically requests Gmail read access
- Seamless integration with existing Gmail OAuth flow

### Security Features
- Firebase Auth handles all authentication securely
- Automatic session management
- Secure token storage
- CSRF protection

### User Experience
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Loading states for all actions
- Clear error messages
- Back navigation to home page

## Development vs Production

### Development Mode
- Localhost access allows fallback to `test_user` for development
- Firebase Auth still works normally
- Gmail OAuth works with localhost redirect URIs

### Production Mode
- Strict authentication required
- No fallback user IDs
- Proper domain-based redirect URIs

## File Structure

```
public/
├── auth.html          # Authentication page
├── auth.css           # Authentication styles
├── auth.js            # Authentication logic
├── index.html         # Landing page
├── dashboard.html     # Protected dashboard
└── dashboard.js       # Dashboard with auth checks
```

## API Endpoints

- `/auth` - Authentication page
- `/dashboard` - Protected dashboard
- `/api/firebase-config` - Firebase configuration
- `/api/gmail/*` - Gmail OAuth endpoints

## Usage

1. **New Users**: Visit `/`, click "Get Started", sign up with email/password or Google
2. **Existing Users**: Visit `/auth` directly or click "Get Started" from landing page
3. **Dashboard Access**: Automatically redirected after successful authentication
4. **Logout**: Click logout button in dashboard header

## Firebase Configuration

The app uses Firebase Auth with the following configuration:
- Project: `homeops-web`
- Authentication methods: Email/Password, Google
- Gmail OAuth scope: `https://www.googleapis.com/auth/gmail.readonly`

## Error Handling

- Network errors with retry suggestions
- Invalid email/password with clear messages
- Account already exists for signup
- Weak password validation
- Popup blocked errors for Google OAuth
- Graceful fallbacks for all error states 