# HomeOps Demo Mode

This folder contains all demo-related files for investor presentations, completely segregated from the main codebase.

## Structure

```
src/demo/
├── config/
│   └── demoConfig.ts        # Demo account data and scripted conversations
├── components/
│   └── DemoBanner.tsx       # Demo mode indicator banner
├── services/
│   └── demoChatService.ts   # Handles scripted chat responses
├── data/                    # Reserved for demo data files
└── README.md               # This file
```

## Demo Account

**Email**: `demo@homeops.ai`
**Persona**: Sarah Thompson (Marketing Director, 2 kids)

## Demo Flow

1. **Login**: User signs in with demo credentials
2. **Onboarding**: Pre-filled with Sarah's family data
3. **Chat**: Scripted responses to showcase key features
4. **Reset**: Button to restart demo for multiple presentations

## Key Features Demonstrated

- 📅 **Family Schedule Management**
- 📧 **Email Intelligence & Filtering**
- 🧠 **Proactive AI Insights**
- 📊 **Pattern Recognition**
- 🎯 **Personalized Suggestions**

## Usage

Import demo utilities in main components:

```typescript
import { isDemoMode, DEMO_CONFIG } from '../demo/config/demoConfig';
import { demoChatService } from '../demo/services/demoChatService';
import DemoBanner from '../demo/components/DemoBanner';
```

## Integration Points

- `AuthContext`: Check for demo email
- `ChatInterface`: Use demo service when in demo mode
- `DashboardLayout`: Show demo banner
- `Onboarding`: Pre-fill demo data