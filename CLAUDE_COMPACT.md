# CLAUDE.md - Whaticket

## Project Overview
Whaticket is a multi-tenant WhatsApp ticketing system built with Node.js/TypeScript backend and React frontend.

## Node.js Version Requirements
- **Backend**: Node.js v18.x+ (required for whatsapp-web.js)
- **Frontend**: Node.js v16.x+

```bash
# Switch versions
nvm use 18  # Backend
nvm use 16  # Frontend
```

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev:server    # Development
npm run build        # Compile TypeScript
npm run lint         # Lint code
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start            # Development (port 3000)
npm run build       # Production build
```

## Architecture
- **Backend**: Express.js + TypeScript + Sequelize ORM + PostgreSQL
- **Frontend**: React 17 + Material-UI v4 + Socket.IO Client
- **WhatsApp**: whatsapp-web.js (migrated from Baileys)
- **Real-time**: Socket.IO
- **Multi-tenant**: Company-based data isolation

## Migration Status: COMPLETED ✅
Successfully migrated from Baileys to whatsapp-web.js for better stability.

## Key Security Notes
- Fixed hardcoded database passwords
- Added environment validation
- Remaining: SQL injection in `src/queues.ts` (lines 816, 823)

## Development Workflow
1. Check Node.js version before starting
2. Backend changes require `npm run build`
3. Test both API and real-time functionality
4. Verify multi-company isolation

## Common Issues
- Frontend requires `--legacy-peer-deps`
- Mixed Material-UI versions (v4 and v5)
- WhatsApp sessions need QR code authentication
- Case-sensitive file imports in TypeScript

## Files Structure
- `src/controllers/` - HTTP request handlers
- `src/services/` - Business logic layer
- `src/models/` - Sequelize database models
- `src/libs/` - Core libraries (socket, cache, wbot)
- `src/queues.ts` - Background job processing (935 lines)

## Integration Points
- N8N Integration, Typebot, Campaign System, AI Integration