# HomeOps Agent

A comprehensive personal AI assistant for home operations management, focusing on email intelligence and family logistics coordination.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (simple mode)
npm run dev -- --simple

# Start full server with all features
npm start
```

## Project Structure

```
├── server.js              # Main server entry point
├── simple-server.js       # Lightweight server for development
├── quick-server.js        # Full-featured production server
├── index.cjs              # Alternative entry point
├── services/              # Core business logic
│   ├── email-intelligence.js
│   ├── commerce-intelligence.js
│   └── data-manager.js
├── routes/                # API route handlers
├── public/                # Frontend files
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   ├── deployment/       # Deployment docs
│   └── technical/        # Technical documentation
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── html/             # HTML test pages
└── archive/              # Legacy and backup files
```

## Key Features

- **📧 Email Intelligence**: Smart categorization and analysis of emails
- **🛍️ Commerce Intelligence**: Deal analysis and shopping insights
- **📅 Calendar Integration**: Event extraction and scheduling
- **🤖 AI Chat Interface**: Natural language queries and responses

## Environment Setup

Copy `.env.example` to `.env` and configure your API keys:

- `OPENAI_API_KEY` - For AI processing
- `GMAIL_CLIENT_ID` & `GMAIL_CLIENT_SECRET` - For email integration
- Firebase credentials for data storage

## Development

- **Simple Mode**: `node simple-server.js` (no API keys required)
- **Full Mode**: `node quick-server.js` (requires configuration)
- **Auto-restart**: `npm run dev`

## Deployment

See `docs/deployment/` for deployment instructions.

## Documentation

- Setup guides: `docs/setup/`
- Deployment: `docs/deployment/`
- Technical docs: `docs/technical/`