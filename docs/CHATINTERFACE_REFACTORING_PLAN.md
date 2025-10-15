# ChatInterface Refactoring Plan

## Current State Analysis

**File Size**: 1,814 lines (Target: <300 lines per component)
**State Variables**: 25+ useState hooks
**Functions**: 20+ major functions
**Concerns**: Mixed UI, business logic, state management, and data fetching

## Proposed Component Architecture

### 1. **ChatContainer.tsx** (Main Orchestrator - ~200 lines)
```typescript
// Primary coordinator component
- Manages overall chat state
- Handles conversation selection
- Coordinates between child components
- Manages demo mode detection
- Provides shared context
```

### 2. **ConversationSidebar.tsx** (~250 lines)
```typescript
// Conversation management
- Conversation list rendering
- New conversation creation
- Conversation deletion/renaming
- Loading states for conversations
- Search/filter conversations
```

### 3. **MessagesList.tsx** (~300 lines)
```typescript
// Pure message rendering
- Message display logic
- Typewriter effects
- Message actions (copy, feedback)
- Calendar invite rendering
- Auto-scroll functionality
```

### 4. **SuggestionMode.tsx** (~400 lines)
```typescript
// Isolated suggestion workflow
- Profile suggestions review
- Suggestion navigation
- Accept/reject logic
- Review data management
- Transition animations
```

### 5. **ChatInput.tsx** (~150 lines)
```typescript
// Input handling only
- Message composition
- Send functionality
- Input validation
- Loading states
- Demo typing simulation
```

### 6. **DemoFeatures.tsx** (~100 lines)
```typescript
// Demo-specific functionality
- Demo detection
- Demo reset handling
- Demo typing effects
- Demo user data simulation
```

## Custom Hooks for Business Logic

### 1. **useConversations.ts**
```typescript
// Conversation management logic
const useConversations = () => ({
  conversations,
  currentConversation,
  loadConversations,
  createConversation,
  selectConversation,
  deleteConversation,
  renameConversation
});
```

### 2. **useMessages.ts**
```typescript
// Message handling logic
const useMessages = (conversationId: string) => ({
  messages,
  loading,
  error,
  sendMessage,
  loadMessages,
  handleTypedResponse
});
```

### 3. **useSuggestions.ts**
```typescript
// Suggestion workflow logic
const useSuggestions = () => ({
  suggestions,
  suggestionMode,
  currentIndex,
  enterSuggestionMode,
  exitSuggestionMode,
  handleResponse,
  navigateToSuggestion
});
```

### 4. **useDemo.ts**
```typescript
// Demo mode functionality
const useDemo = () => ({
  isInDemo,
  demoTyping,
  typewriterEffect,
  resetDemo,
  handleDemoComplete
});
```

### 5. **useChatService.ts**
```typescript
// Service initialization and management
const useChatService = () => ({
  chatService,
  isAuthenticated,
  userAvatar,
  handleServiceError
});
```

## Error Boundaries

### 1. **ChatErrorBoundary.tsx**
```typescript
// Wraps entire chat interface
- Catches and handles React errors
- Provides fallback UI
- Logs errors for debugging
- Recovery mechanisms
```

### 2. **SuggestionErrorBoundary.tsx**
```typescript
// Wraps suggestion mode
- Handles suggestion-specific errors
- Graceful fallback to chat mode
- Error reporting
```

## Context Providers

### 1. **ChatContext.tsx**
```typescript
// Shared chat state
interface ChatContextType {
  userData: UserData;
  isDemo: boolean;
  currentConversation: Conversation | null;
  setCurrentConversation: (conv: Conversation) => void;
}
```

### 2. **MessageContext.tsx**
```typescript
// Message-specific context
interface MessageContextType {
  handleCopy: (content: string) => void;
  handleFeedback: (id: string, feedback: string) => void;
  handleCalendarSent: (id: string) => void;
}
```

## Implementation Strategy

### Phase 1: Extract Custom Hooks (Week 1)
1. Create `useConversations` hook
2. Create `useMessages` hook
3. Create `useSuggestions` hook
4. Create `useDemo` hook
5. Test hooks in isolation

### Phase 2: Create Child Components (Week 2)
1. Build `ChatInput` component
2. Build `ConversationSidebar` component
3. Build `MessagesList` component
4. Build `DemoFeatures` component

### Phase 3: Extract Complex Features (Week 3)
1. Build `SuggestionMode` component
2. Create error boundaries
3. Implement context providers
4. Create `ChatContainer` orchestrator

### Phase 4: Integration & Testing (Week 4)
1. Wire up all components
2. Test component interactions
3. Performance optimization
4. Remove old ChatInterface

## Benefits

### Performance Improvements
- **Smaller re-render scope**: Only affected components update
- **Better memoization**: Easier to implement React.memo
- **Lazy loading**: Non-critical components can be loaded on demand
- **Bundle splitting**: Separate chunks for different features

### Developer Experience
- **Easier debugging**: Isolated component logic
- **Better testing**: Unit tests for individual hooks/components
- **Cleaner code**: Single responsibility principle
- **Faster development**: Parallel work on different components

### Maintainability
- **Clear boundaries**: Each component has specific purpose
- **Reusable hooks**: Business logic can be shared
- **Type safety**: Better TypeScript inference
- **Documentation**: Smaller, focused components easier to document

## Migration Strategy

1. **Gradual migration**: Extract one piece at a time
2. **Feature flags**: Toggle between old/new implementations
3. **A/B testing**: Validate performance improvements
4. **Rollback plan**: Keep old component until migration complete

## Success Metrics

- **File size**: Each component <300 lines
- **Performance**: 30% faster re-renders
- **Test coverage**: >80% for all new components
- **Developer velocity**: 50% faster feature development

## Risk Mitigation

- **Preserve functionality**: No user-facing changes during refactor
- **Incremental approach**: Small, testable changes
- **Automated testing**: Prevent regressions
- **Performance monitoring**: Track improvement metrics