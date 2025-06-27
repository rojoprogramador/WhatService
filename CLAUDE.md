# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whaticket is a multi-tenant WhatsApp ticketing system built with Node.js/TypeScript backend and React frontend. It enables companies to manage WhatsApp conversations through a ticket-based system with features like campaigns, chatbots, queues, and multi-company support.

## Node.js Version Requirements

**Critical**: This project requires specific Node.js versions due to compatibility constraints:
- **Backend**: Node.js v18.x+ (required for whatsapp-web.js library compatibility)
- **Frontend**: Node.js v16.x+ (updated from v14.21.3 after dependency migration)

Always verify and switch Node.js versions before development:
```bash
# For backend work
nvm use 18

# For frontend work  
nvm use 16
```

## Development Commands

### Backend Setup & Development
```bash
cd backend

# Install dependencies
npm install

# Database setup (first time only)
npx sequelize db:create
npx sequelize db:migrate
npx sequelize db:seed:all

# Development
npm run dev:server          # Development server with hot reload
npm run build              # Compile TypeScript
npm start                  # Production server
npm run lint               # Lint code
npm test                   # Run tests

# Database operations
npm run db:migrate         # Run new migrations
npm run db:seed           # Run seeders
```

### Frontend Setup & Development
```bash
cd frontend

# Install dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Development
npm start                  # Development server (port 3000)
npm run build             # Production build
npm test                  # Run tests
```

## Architecture Overview

### Backend Architecture
- **Express.js** server with TypeScript
- **Sequelize ORM** with PostgreSQL database
- **Socket.IO** for real-time communication
- **Bull Queue** for background job processing
- **Baileys** library for WhatsApp Web integration
- **Multi-tenant** architecture with company-based isolation

Key directories:
- `src/controllers/` - HTTP request handlers
- `src/services/` - Business logic layer
- `src/models/` - Sequelize database models
- `src/routes/` - API route definitions
- `src/libs/` - Core libraries (socket, cache, wbot)
- `src/queues.ts` - Background job processing (935 lines, complex)
- `src/database/migrations/` - Database schema changes

### Frontend Architecture
- **React 17** with Material-UI v4
- **React Query** for API state management
- **Socket.IO Client** for real-time updates
- **React Router v5** for navigation
- **Dark/Light theme** system with persistent preferences

Key directories:
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/services/` - API communication layer
- `src/context/` - React context providers
- `src/layout/` - Layout components and theme

### WhatsApp Integration Flow
1. **Connection**: Baileys library connects to WhatsApp Web via QR code
2. **Message Processing**: Incoming WhatsApp messages are converted to tickets
3. **Queue System**: Messages are processed through configurable queues
4. **Agent Assignment**: Tickets are assigned to agents based on queue rules
5. **Real-time Updates**: Socket.IO broadcasts updates to connected clients
6. **Response Handling**: Agent responses are sent back to WhatsApp contacts

### Multi-Tenancy
- Each company has isolated data (contacts, tickets, users, settings)
- Company ID is propagated through all database operations
- Separate WhatsApp connections per company
- Company-specific configurations and plans

## Database & Configuration

### Environment Files
- Backend: `.env` (DATABASE_URL, JWT secrets, Redis config)
- Frontend: `.env` (REACT_APP_BACKEND_URL)

### Database Setup
- **PostgreSQL** as primary database
- **Redis** for sessions and queue management
- Extensive migration system (80+ migrations)
- Multi-company data isolation via `companyId` foreign keys

### Critical Configuration
- CORS setup between frontend (port 3000) and backend (port 8080)
- JWT authentication with refresh tokens
- Redis configuration for Bull queues
- File upload handling for media messages

## Security Considerations

**Known Issues to Address:**
- Hardcoded database password in `src/config/database.ts:14`
- SQL injection vulnerability in `src/queues.ts` (lines 816, 823)
- Weak default JWT secrets in auth config
- TypeScript strict mode disabled (`tsconfig.json`)

## Development Workflow

### Making Changes
1. Always check Node.js version before starting
2. Backend changes require TypeScript compilation (`npm run build`)
3. Database changes need migrations (`npx sequelize migration:generate`)
4. Test both real-time (Socket.IO) and API functionality
5. Verify multi-company isolation in changes

### Testing WhatsApp Integration
- QR code authentication required for each WhatsApp connection
- Test message sending/receiving flow
- Verify queue processing and agent assignment
- Check real-time updates in frontend

### Common Gotchas
- Frontend requires `--legacy-peer-deps` for installation
- Mixed Material-UI versions (v4 and v5) in frontend
- Large `queues.ts` file handles multiple responsibilities
- Duplicate messageRoutes in route configuration
- Case-sensitive file imports in TypeScript

## Deployment Notes

- Backend uses custom startup script (`start-backend.js`) to handle Node.js v16 compatibility
- Frontend builds to static files for serving
- Requires PostgreSQL and Redis services
- WhatsApp connections need persistent sessions
- File uploads stored in `backend/public/` directory

## Integration Points

- **N8N Integration**: Webhook support for external automations
- **Typebot Integration**: Chatbot functionality
- **Campaign System**: Bulk messaging capabilities
- **AI Integration**: OpenAI integration for automated responses
- **Subscription Management**: Plan-based feature limitations