# HomeOps Agent - Claude Code Integration

## Project Overview
HomeOps Agent is a personal AI assistant for home operations management, focusing on email intelligence and family logistics coordination. This is a frontend-focused React application with Supabase backend services.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **UI Components**: Custom components with Lucide React icons, Material-UI elements
- **Hosting**: Vercel (static site hosting + serverless functions)
- **Database**: Supabase (PostgreSQL with real-time features) + Neon DB (AI conversation storage)
- **Authentication**: Supabase Auth with Google OAuth and email/password
- **Storage**: Supabase Storage (for avatar uploads and file storage)
- **AI/Chat**: LangChain + OpenAI GPT-4 + Neon PostgreSQL (serverless functions)
- **State Management**: React Context API (AuthContext)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite (for fast development and optimized builds)

## Key Features
- **User Management**: Authentication, user profiles, account settings
- **Dashboard**: Multi-page dashboard with Home, Calendar, Email, and Settings
- **AI Chat Assistant**: LangChain-powered conversational AI with persistent memory
- **Email Intelligence**: Gmail integration with email analysis and insights
- **Calendar Integration**: Google Calendar API integration
- **File Management**: Avatar upload with image resizing
- **Settings Management**: Account settings, profile management, integrations
- **Onboarding Flow**: Multi-step user onboarding process
- **Responsive Design**: Mobile-first responsive UI

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build locally
npm run preview
```

### Deployment
```bash
# Deploy to Vercel (auto-deploys from main branch)
git add .
git commit -m "Deploy updates"
git push origin main

# Manual Vercel deployment
vercel deploy
```

## Project Structure
```
src/
├── components/          # React components
│   ├── dashboard/      # Dashboard-specific components
│   ├── onboarding/     # Onboarding flow components
│   ├── ui/            # Reusable UI components
│   └── settings/      # Settings page components
├── contexts/          # React Context providers
├── services/          # Business logic and API services
├── config/           # Configuration files and constants
├── lib/              # Library configurations (Supabase)
├── types/            # TypeScript type definitions
└── data/             # Static data and mock data

dist/                 # Built application files (generated)
public/              # Static assets (favicon, etc.)
vercel.json          # Vercel deployment configuration
```

## Environment Variables
```bash
# Application Configuration
VITE_APP_IS_LIVE=TRUE          # Enable/disable live features
VITE_APP_ENV=DEV               # Environment (DEV/STAGING/PROD)
VITE_BYPASS_AUTH=FALSE         # Bypass authentication (dev only)
VITE_BETA_MODE=TRUE            # Enable/disable beta access control

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth Configuration
VITE_GMAIL_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth Redirect Configuration
VITE_REDIRECT_URI_BASE=your-domain-url

# AI Chat System (Vercel Functions)
NEON_DATABASE_URL=postgresql://user:password@host/dbname  # Neon DB for conversations
OPENAI_API_KEY=your-openai-api-key                       # OpenAI for LangChain
OPENAI_MODEL=gpt-4o-mini                                 # Model selection (optional)
OPENAI_TEMPERATURE=0.3                                   # Response creativity (optional)
```

## Database Architecture
### Supabase Tables
- **users**: User profiles, authentication data, preferences
- **accounts**: Account settings, subscription info, household data
- **admin_users**: Simple table storing email addresses of users with admin privileges
- **account_integrations**: OAuth integrations (Gmail, Calendar)
- **integrations**: Available integration definitions
- **subscription_plans**: Available subscription tiers
- **email_records**: Email data and metadata
- **email_insights**: AI-generated email analysis
- **email_sender_patterns**: Email sender analytics

### Neon Database Tables (AI Chat System)
- **conversations**: Chat conversation metadata (user_id, account_id, title, timestamps)
- **messages**: Individual chat messages (conversation_id, role, content, metadata)
- **agent_memory**: Long-term AI context storage (user preferences, family info)

### Key Services
- **UserSessionService**: Manages user authentication and session data
- **DataUpdateService**: Handles secure user/account data updates
- **AdminService**: Handles admin user verification and authorization
- **AvatarUploadService**: Manages file uploads to Supabase Storage
- **EmailAnalysisService**: Email intelligence and processing
- **Gmail/Calendar Services**: OAuth integration services
- **AI Chat Services**: Vercel serverless functions (`/api/chat.js`, `/api/conversations.js`)

## Common Development Tasks
- **Frontend development**: Use `npm run dev` for React development with hot reload
- **Component development**: Create reusable components in `src/components/ui/`
- **Database operations**: Use Supabase client for CRUD operations
- **Authentication**: Implement using Supabase Auth with Google OAuth
- **File uploads**: Use Supabase Storage with RLS policies
- **State management**: Use React Context for global state
- **Styling**: Use Tailwind CSS with custom utility classes
- **Deploy changes**: Push to main branch for automatic Vercel deployment

## Architecture Patterns
- **Component-based architecture** with React functional components
- **Custom hooks** for business logic (useAuth, etc.)
- **Service layer pattern** for API interactions and business logic
- **Context providers** for global state management
- **Route protection** with authentication guards
- **Form handling** with controlled components and validation
- **Error boundaries** and comprehensive error handling
- **TypeScript interfaces** for type safety and API contracts

## Security Features
- **Row Level Security (RLS)** policies in Supabase
- **JWT token validation** for authenticated requests
- **Input sanitization** and XSS protection
- **CSRF protection** through Supabase Auth
- **🔒 Multi-layer file upload security**:
  - **File signature verification**: Validates magic bytes to prevent malicious file uploads
  - **MIME type validation**: Ensures only allowed image types (JPEG, PNG, WebP, GIF)
  - **Extension validation**: Verifies file extension matches declared MIME type
  - **Content validation**: Attempts to load files as images to detect corruption
  - **Size and dimension limits**: Prevents oversized files (1MB max, 2000x2000 pixels max - appropriate for avatars)
- **OAuth 2.0** for third-party integrations

## Development Guidelines
- **Always use TypeScript** for type safety
- **Follow component composition** patterns over inheritance
- **Implement proper error handling** with user-friendly messages
- **Use Tailwind CSS** for consistent styling
- **Maintain responsive design** principles
- **Test authentication flows** thoroughly
- **Validate all user inputs** before processing
- **Use semantic HTML** for accessibility

## Database Schema Notes
- **Users table**: Contains both OAuth and user-provided data
- **Accounts table**: Household-level settings and subscription data
- **Foreign key relationships** maintain data integrity
- **Triggers** handle automatic data population (timestamps, OAuth data)
- **Storage buckets** with RLS for secure file access

## Integration Points
- **Gmail API**: Email fetching and analysis
- **Google Calendar API**: Calendar event management
- **Supabase Auth**: User authentication and session management
- **Supabase Storage**: File upload and management
- **Supabase Realtime**: Live data updates (future enhancement)

## Detailed Implementation Patterns

### When Adding New Components
**Explicit Process:**
1. **Check existing patterns**: Look at `src/components/ui/` for similar components
2. **Follow naming convention**: `ComponentName.tsx` with default export
3. **Use TypeScript interfaces**: Define props interface above component
4. **Implement error boundaries**: Wrap with try-catch for user feedback
5. **Apply Tailwind consistently**: Use existing color/spacing patterns
6. **Test responsive design**: Verify mobile-first approach works

**Example Component Structure:**
```typescript
interface ComponentNameProps {
  prop1: string;
  prop2?: boolean;
  onAction: (data: any) => void;
}

const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 = false, onAction }) => {
  // Implementation here
};

export default ComponentName;
```

### When Modifying Database Schema
**Explicit Process:**
1. **Use Supabase migrations**: Apply changes via `mcp__supabase__apply_migration`
2. **Update TypeScript interfaces**: Modify interfaces in `src/services/userSession.ts`
3. **Update service layer**: Modify queries in relevant service files
4. **Test data flow**: Ensure UI components receive updated data structure
5. **Update CLAUDE.md**: Document new tables/columns in Database Architecture section

**Recent Example:**
- Added `timezone` field to accounts table
- Updated `UserSessionData` interface to include `timezone: string | null`
- Modified `UserSessionService.getUserSessionData()` to return timezone
- Updated `AccountSection` component to use timezone field

### When Adding New Services
**Explicit Process:**
1. **Create in src/services/**: Follow `serviceName.ts` naming pattern
2. **Export class with static methods**: Like `DataUpdateService.updateAccount()`
3. **Include error handling**: Return `{ success: boolean; error?: string }` pattern
4. **Add authentication checks**: Validate JWT tokens for secure operations
5. **Document in CLAUDE.md**: Add to Key Services section

**Service Pattern Template:**
```typescript
export class NewService {
  static async performAction(data: DataType): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      // Perform operation
      // Return success
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### When Implementing Authentication Features
**Explicit Process:**
1. **Use Supabase Auth patterns**: Follow `src/lib/supabase.ts` auth helpers
2. **Update AuthContext**: Modify `src/contexts/AuthContext.tsx` for new auth state
3. **Add route protection**: Use `ProtectedRoute` component wrapper
4. **Handle session expiration**: Implement redirects and user feedback
5. **Test OAuth flows**: Verify Google OAuth integration works

### When Adding UI Components
**Explicit Process:**
1. **Check existing UI library**: Use components from `src/components/ui/`
2. **Follow design system**: Use established Tailwind color scheme:
   - Primary: `blue-600`, `blue-700`
   - Background: `gray-50`, `gray-100`
   - Text: `gray-900`, `gray-700`
   - Borders: `gray-300`, `gray-200`
3. **Implement dark mode**: Use `dark:` prefixes for dark theme support
4. **Ensure accessibility**: Use semantic HTML and ARIA labels
5. **Test responsiveness**: Verify mobile, tablet, desktop layouts

## Development Instructions for Claude
When working on this codebase:

**Before Making Changes:**
1. **State explicit intent**: "I'm about to create a new service for email processing that will..."
2. **Explain the approach**: "This will involve adding a new file, updating interfaces, and..."
3. **Describe expected outcome**: "When complete, users will be able to..."

**During Implementation:**
4. **Follow established patterns** documented above
5. **Use existing TypeScript interfaces** and extend them properly
6. **Implement comprehensive error handling** with user-friendly messages
7. **Test authentication flows** when making auth-related changes
8. **Validate all database operations** with proper error handling

**After Changes:**
9. **Update CLAUDE.md immediately** with new components/services/patterns
10. **Verify TypeScript compilation** passes without errors
11. **Test critical user flows** affected by changes

## Current Development Context & Proposals

### Recent Changes Made (Session History)
1. **Fixed timezone field population issue**:
   - **Problem**: AccountSection wasn't saving timezone data due to missing field in UserSessionService
   - **Solution**: Added `timezone: string | null` to UserSessionData interface and included timezone in account object creation
   - **Impact**: Account settings page now properly loads and saves timezone data

2. **Standardized household_type naming**:
   - **Problem**: Inconsistency between `house_type` (component) and `household_type` (database)
   - **Solution**: Updated AccountSection component and DataUpdateService to consistently use `household_type`
   - **Impact**: Account settings save functionality now works without database schema errors

3. **🔒 Enhanced File Upload Security (MAJOR SECURITY UPDATE)**:
   - **Problem**: Weak file validation vulnerable to malicious uploads - only checked MIME type which can be spoofed
   - **Solution**: Implemented comprehensive multi-layer file validation system:
     - **File signature verification**: Validates magic bytes to detect actual file type
     - **MIME type validation**: Ensures declared type matches allowed image types
     - **Extension validation**: Verifies file extension matches MIME type  
     - **Content validation**: Attempts to load file as image to detect corruption/malicious content
     - **Size and dimension limits**: Prevents oversized files (1MB max, 2000x2000 pixels max)
   - **User Experience**: Replaced intrusive browser alerts with elegant toast notifications
   - **New Files**: `src/services/fileValidation.ts` - comprehensive security service
   - **Impact**: Prevents malicious file uploads, improves security posture, better UX

4. **📝 Account Name Feature (UX ENHANCEMENT)**:
   - **Problem**: Accounts lacked personalization - no way for users to customize their account identity
   - **Solution**: Added customizable Account Name field with smart defaults:
     - **Database**: Added `account_name` column to accounts table
     - **Smart Defaults**: Auto-generates "{User's Name}'s Family Dashboard" on signup
     - **Configuration**: Account name pattern stored in constants for easy maintenance
     - **User Control**: Users can customize account name in Settings > Account page
   - **UI Changes**: Removed subscription fields from account page, added Account Name as prominent field
   - **Files Modified**: UserSessionService, DataUpdateService, AccountSection, onboarding flow
   - **Impact**: More personalized user experience, better account identity

5. **🎨 Account Settings UI Layout Improvements (UX ENHANCEMENT)**:
   - **Problem**: Account settings layout was not optimally organized for user workflow
   - **Solution**: Reorganized AccountSection layout for better user experience:
     - **Account Active toggle**: Moved to top row for prominence (most important setting)
     - **Account Name & House Type**: Combined into half-column layout on same row (related settings)
     - **Timezone**: Moved to left side of next row for better visual balance
     - **Dynamic sidebar branding**: Added dynamic account name display under HomeOps logo in sidebar
   - **Technical Implementation**: 
     - Used CSS Grid with responsive `grid-cols-1 md:grid-cols-2` layout
     - Maintained proper spacing with `space-y-6` container structure
     - Added fallback to "Family Dashboard" for account name display
   - **Files Modified**: `AccountSection.tsx`, `DashboardLayout.tsx`
   - **Impact**: More intuitive settings layout, better visual hierarchy, personalized sidebar branding

6. **🛡️ Admin Panel System (FOUNDER ACCESS)**:
   - **Problem**: Need secure administrative access for app founders to manage platform and users
   - **Solution**: Implemented simple yet secure admin panel system:
     - **Simple admin table**: `admin_users` table stores only email addresses of authorized admins
     - **Route protection**: `/admin` route protected by `AdminRoute` component with authentication + authorization
     - **Admin verification**: `AdminService` checks if authenticated user's email exists in admin table
     - **Admin panel UI**: Comprehensive dashboard showing system stats, admin user list, and quick actions
     - **Access control**: Auto-redirects non-authenticated users to login, shows access denied for non-admins
   - **Technical Implementation**:
     - Created `admin_users` table with simple email-based authorization
     - Built `AdminService` for admin status verification
     - Implemented `AdminRoute` wrapper component for route protection
     - Created full-featured `AdminPage` component with responsive design
     - Added `/admin` route to React Router with proper protection
   - **Security Features**:
     - RLS policies on admin_users table
     - Authentication required before admin check
     - Graceful handling of unauthorized access attempts
     - No admin functions exposed to non-admin users
   - **Files Created**: `AdminService.ts`, `AdminRoute.tsx`, `AdminPage.tsx`
   - **Files Modified**: `routes.ts`, `App.tsx`
   - **Impact**: Secure founder access to platform administration, foundation for future admin features

7. **🚪 Beta Access Control System (USER GATING)**:
   - **Problem**: Need to control who can access the app during beta phase while allowing authentication
   - **Solution**: Implemented post-authentication beta access control:
     - **Beta users table**: `beta_users` table stores email addresses with beta access
     - **Environment toggle**: `VITE_BETA_MODE=TRUE/FALSE` to enable/disable beta restrictions
     - **Post-auth gating**: Users can authenticate but are blocked if email not in beta_users table
     - **Admin bypass**: Admin users automatically have beta access regardless of beta_users table
     - **Professional UX**: Clean "Beta Access Required" page with user's email and sign out option
   - **Technical Implementation**:
     - Created `beta_users` table with email-based access control
     - Built `BetaGate` component that wraps entire application
     - Added `VITE_BETA_MODE` environment variable for easy on/off control
     - Integrated beta access checking into AdminService
     - Professional access denied UI with clear messaging
   - **Beta Mode Control**:
     - **`VITE_BETA_MODE=TRUE`**: Beta access required, only emails in beta_users table can access app
     - **`VITE_BETA_MODE=FALSE`**: Open access, all authenticated users can access app
     - **Admin override**: Admins always have access regardless of beta mode setting
   - **User Experience**:
     - Authentication succeeds for all valid users
     - Beta access check happens after authentication
     - Clear messaging about beta requirements
     - Easy admin management via admin panel
   - **Files Created**: `BetaGate.tsx`, updated `AdminService.ts` with beta user management
   - **Files Modified**: `App.tsx`, `routes.ts`, `.env`, `.env.example`
   - **Impact**: Controlled beta rollout while maintaining professional UX and easy admin management

### Current Technical Debt & Improvement Opportunities
1. ~~**Avatar upload system**: Recently implemented but could benefit from better error handling~~ ✅ **RESOLVED** - Enhanced with comprehensive security validation and toast notifications
2. **Form validation**: Could add client-side validation before server requests
3. **Loading states**: Some components could benefit from better loading indicators
4. ~~**Error messaging**: Could implement more user-friendly error messages~~ ✅ **RESOLVED** - Implemented toast notifications across avatar upload system
5. **Type safety**: Some services use `any` types that could be more specific

### Recently Implemented Features

#### 🚀 AI Agent Email Intelligence System ✅ **FULLY IMPLEMENTED**
Complete LangChain-powered email processing system with sophisticated AI analysis:

**Core Implementation:**
- **EmailEmbeddingProcessor**: Multi-step LangChain chains for email → themes → priorities → actions → embeddings
- **EmailThemeAnalyzer**: Advanced family pattern discovery with 10 theme categories
- **Supabase Edge Functions**: Heavy AI processing deployed via MCP (3 functions deployed)
- **Vercel API Endpoints**: Fast user-facing APIs for job management and status polling
- **Comprehensive Error Logging**: Production monitoring with performance tracking

**Technical Stack:**
- **LangChain**: Complex AI workflows and multi-agent reasoning
- **OpenAI GPT-4o-mini**: Cost-optimized language model for analysis
- **text-embedding-3-small**: Vector embeddings for semantic search
- **Supabase**: Database, authentication, and edge function hosting
- **Neon PostgreSQL**: Optional conversation storage for chat features

**Cost Analysis:**
- **Per email processing**: ~$0.0061 (3 LLM calls + 1 embedding)
- **Monthly cost**: ~$2.82/user for 200 emails/month
- **Scalable architecture**: Designed for 1000+ concurrent users

**User Experience:**
- Fast job initiation (< 1 second API response)
- Real-time progress tracking with status polling
- Background processing prevents app slowdown
- Comprehensive error handling and user feedback

#### 🚀 Original AI Agent Chat System (REFERENCE)**: 
   - **Goal**: LangChain + Neon DB for powerful conversational AI in Home section ✅ **COMPLETED**
   - **Features**: Persistent conversation memory, context-aware responses, family logistics assistance
   - **Tech Stack**: LangChain for AI workflows, Neon PostgreSQL for conversation storage, Vercel Functions
   - **User Experience**: Chat interface in dashboard home that remembers context across sessions
   - **Architecture**: Vercel serverless functions (`/api/chat.js`, `/api/conversations.js`) with Neon DB backend
   - **Dependencies**: `@langchain/core`, `@langchain/openai`, `@neondatabase/serverless`
   - **Implementation Status**: ✅ **LIVE** - Chat system deployed and functional

2. **Email intelligence dashboard**: Process and display email insights
3. **Calendar integration**: Connect and sync Google Calendar events
4. **Real-time notifications**: Use Supabase realtime for live updates
5. **Team member management**: Allow account owners to invite team members
6. **Advanced settings**: Email parsing rules, notification preferences

### Development Philosophy Decisions Made
- **Service layer pattern**: All database operations go through service classes
- **TypeScript-first**: All new code must have proper type definitions
- **Component composition**: Prefer small, reusable components over large ones
- **Error handling**: Always return structured error responses with user-friendly messages
- **Security-first**: All database operations use RLS policies and JWT validation

## 🚀 AI Agent Chat System - Implementation Plan

### Phase 1: Infrastructure Setup
**Dependencies to Add:**
```bash
npm install @langchain/core @langchain/openai @langchain/community
npm install @neondatabase/serverless
npm install uuid @types/uuid
```

**Environment Variables to Add:**
```bash
# Neon Database (for conversation storage)
NEON_DATABASE_URL=postgresql://user:password@host/dbname

# OpenAI API (for LangChain)
OPENAI_API_KEY=your-openai-api-key

# Optional: Other AI providers
ANTHROPIC_API_KEY=your-anthropic-key (if using Claude)
```

### Phase 2: Database Schema (Neon)
**New Tables:**
```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References Supabase auth user
  account_id UUID NOT NULL, -- References Supabase accounts table
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory/context table
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  memory_type VARCHAR(50) NOT NULL, -- 'family_info', 'preferences', 'context'
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Phase 3: Service Layer Implementation
**Files to Create:**
1. **`src/services/neonDb.ts`** - Neon database connection and queries
2. **`src/services/conversationService.ts`** - Conversation CRUD operations
3. **`src/services/aiAgentService.ts`** - LangChain integration and AI logic
4. **`src/services/messageService.ts`** - Message handling and processing

### Phase 4: UI Components
**Components to Create:**
1. **`src/components/ui/ChatInterface.tsx`** - Main chat UI component
2. **`src/components/ui/MessageBubble.tsx`** - Individual message display
3. **`src/components/ui/ChatInput.tsx`** - Message input with send button
4. **`src/components/ui/ConversationList.tsx`** - Sidebar for conversation history

### Phase 5: Integration with Existing Dashboard
**Files to Modify:**
1. **`src/components/dashboard/HomePage.tsx`** - Add chat interface
2. **`src/contexts/AuthContext.tsx`** - Add conversation context if needed
3. **Update CLAUDE.md** - Document new AI agent capabilities

### Expected User Experience
1. **User opens dashboard home** → Sees chat interface
2. **User types message** → "Help me organize my family's schedule"
3. **AI agent responds** → Uses context from email data, calendar, and previous conversations
4. **Conversation persists** → User can return later and continue where they left off
5. **Agent learns** → Remembers family preferences, household info, and user patterns

### Technical Decisions for AI Agent
- **LangChain for orchestration**: Handle complex AI workflows and tool calling
- **Neon for conversation storage**: Separate from Supabase for specialized AI data
- **OpenAI GPT-4 as primary model**: High-quality responses with function calling
- **Memory system**: Store user preferences and context for personalized responses
- **Tool integration**: Agent can access email data, calendar events, and household settings

## Auto-Update Commitment
This CLAUDE.md file will be automatically updated by Claude whenever:
- New components, services, or major features are added
- Database schema changes are made
- New dependencies or tools are introduced
- Development workflows or deployment processes change
- Environment variables or configuration changes occur
- **New proposals or technical decisions are made**
- **Session context changes that affect development approach**