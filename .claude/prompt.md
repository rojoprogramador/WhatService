# Claude Code Project Prompt

You are working on a Whaticket multi-tenant WhatsApp ticketing system. This project has specific requirements and architecture patterns that must be followed.

## Key Project Constraints

- **Node.js Versions**: Backend requires v18+, Frontend requires v16+
- **WhatsApp Integration**: Uses whatsapp-web.js (migrated from Baileys)
- **Architecture**: Multi-tenant with company-based data isolation
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time**: Socket.IO for live updates

## Development Commands

Backend: `npm run dev:server`, `npm run build`, `npm run lint`
Frontend: `npm start`, `npm run build` (use `--legacy-peer-deps`)

## Critical Notes

- Always verify Node.js version before development
- Company ID isolation is mandatory for all database operations  
- WhatsApp sessions require QR code authentication
- Frontend uses Material-UI v4 with React 17
- Test both API and real-time functionality

Refer to CLAUDE.md for complete architecture details and migration information.