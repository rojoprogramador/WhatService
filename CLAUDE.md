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
- **whatsapp-web.js** library for WhatsApp Web integration (migrated from Baileys)
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
1. **Connection**: whatsapp-web.js library connects to WhatsApp Web via QR code with LocalAuth
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

## Migration from Baileys to whatsapp-web.js

**Migration Status: COMPLETED ✅**

This project has been successfully migrated from Baileys to whatsapp-web.js for improved stability and better WhatsApp Web integration.

### Migration Summary

**Phase 1: Preparation ✅**
- Removed Baileys dependencies (`@whiskeysockets/baileys`, `@adiwajshing/keyed-db`)
- Installed whatsapp-web.js v1.23.0 and dependencies
- Fixed security vulnerabilities (hardcoded passwords, JWT secrets)
- Added environment validation (`validateEnv.ts`)

**Phase 2: Core Components ✅**
- Completely rewritten `src/libs/wbot.ts` for whatsapp-web.js
- Removed `src/helpers/authState.ts` (handled automatically by LocalAuth)
- Created `src/libs/wwebjs-types.ts` for TypeScript compatibility
- Migrated all helper functions (GetTicketWbot, GetWbotMessage, etc.)

**Phase 3: Messaging Services ✅**
- Migrated `SendWhatsAppMessage.ts` → `chat.sendMessage()`
- Migrated `SendWhatsAppMedia.ts` → `MessageMedia.fromFilePath()`
- Migrated `SendWhatsAppReaction.ts` → `message.react()`
- Migrated `EditWhatsAppMessage.ts` → `message.edit()`
- Migrated auxiliary services (CheckNumber, GetProfilePicUrl, etc.)

**Phase 4: Message Processing ✅**
- Completely migrated `wbotMessageListener.ts` (1600+ lines)
- Updated `wbotMonitor.ts` and `StartWhatsAppSession.ts`
- Removed obsolete Baileys services

### Key Changes

**API Differences:**
```typescript
// OLD (Baileys)
await wbot.sendMessage(jid, { text: body });
const media = await downloadMediaMessage(msg);

// NEW (whatsapp-web.js)
const chat = await wbot.getChatById(chatId);
await chat.sendMessage(body);
const media = await message.downloadMedia();
```

**Contact ID Format:**
- Baileys: `${number}@s.whatsapp.net`
- whatsapp-web.js: `${number}@c.us` (contacts), `${number}@g.us` (groups)

**Authentication:**
- Baileys: Custom `authState.ts` with manual session management
- whatsapp-web.js: `LocalAuth` with automatic session persistence in `.wwebjs_auth/`

**Events:**
```typescript
// OLD (Baileys)
socket.ev.on('messages.upsert', handler);

// NEW (whatsapp-web.js)
client.on('message', handler);
client.on('message_create', handler);
```

### Benefits of Migration

1. **Better Stability**: whatsapp-web.js is more stable with fewer breaking changes
2. **Improved Documentation**: Better community support and documentation
3. **Modern APIs**: More intuitive and feature-complete API
4. **Better Media Handling**: Simplified multimedia processing
5. **Automatic Session Management**: No manual auth state handling required

### Files Modified/Created

**Core Files:**
- `src/libs/wbot.ts` - Complete rewrite
- `src/libs/wwebjs-types.ts` - New type definitions
- `src/config/validateEnv.ts` - New environment validation

**Services Migrated:**
- All files in `src/services/WbotServices/` (18+ files)
- `src/helpers/` - GetTicketWbot, GetWbotMessage, SetTicketMessagesAsRead

**Files Removed:**
- `src/helpers/authState.ts`
- `src/services/BaileysServices/` (entire directory)
- `src/services/BaileysChatServices/` (entire directory)

## Security Considerations

**Migration Security Improvements ✅:**
- ✅ Fixed hardcoded database password in `src/config/database.ts:14`
- ✅ Added mandatory environment variable validation
- ✅ Enforced strong JWT secrets

**Remaining Issues to Address:**
- SQL injection vulnerability in `src/queues.ts` (lines 816, 823)
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

---

## Research Query

Investigate the "WhatsApp API" component in detail. Provide a comprehensive analysis of its architecture, responsibilities, and implementation details.

*Session: eff6834f09ebd7f06c3f72be8d3d3334 | Generated: 2/7/2025, 11:56:40*

### Analysis Summary

# WhatsApp API Component Analysis

This report details the architecture, responsibilities, and implementation of the WhatsApp API component within the codebase. The component is primarily managed by the `WhatsAppController`, `WhatsappService` (a collection of services), and `WbotServices` (a directory of services that directly interact with the WhatsApp Web API).

## High-Level Architecture

The WhatsApp API component is structured in a layered architecture to manage WhatsApp interactions efficiently.

*   **API Layer (backend/src/controllers/WhatsAppController.ts):** This is the external interface, handling HTTP requests related to WhatsApp accounts. It acts as the entry point for all WhatsApp-related operations from the frontend.
*   **Business Logic/Data Access Layer (backend/src/services/WhatsappService/):** This layer encapsulates the core business logic for managing WhatsApp account data, including persistence and retrieval from the database.
*   **WhatsApp Bot Interaction Layer (backend/src/services/WbotServices/):** This layer directly interacts with the WhatsApp Web API (likely via the `whatsapp-web.js` library), abstracting the complexities of session management, message sending, and message receiving.

## Mid-Level Interactions and Session Management

The three main components collaborate to manage WhatsApp sessions and message flows.

### WhatsAppController (file:backend/src/controllers/WhatsAppController.ts)

The **WhatsAppController** (node:WhatsAppController_WC1) is responsible for handling API requests and orchestrating the creation, management, and deletion of WhatsApp sessions.

*   **Purpose:** Acts as the **API endpoint handler** for all WhatsApp-related operations. It receives HTTP requests, delegates business logic to appropriate services, and sends back HTTP responses.
*   **Key Functionalities:**
    *   **`index` (List):** Retrieves a list of WhatsApp accounts associated with a company. (file:backend/src/controllers/WhatsAppController.ts:39)
    *   **`store` (Create):** Creates a new WhatsApp account, including its name, associated queues, greeting messages, and other configurations. It initiates a WhatsApp session for the newly created account by calling `CreateWhatsAppService` and `StartWhatsAppSession`. (file:backend/src/controllers/WhatsAppController.ts:47)
    *   **`show` (Retrieve):** Fetches details of a specific WhatsApp account by its ID. (file:backend/src/controllers/WhatsAppController.ts:108)
    *   **`update`:** Modifies the details of an existing WhatsApp account. (file:backend/src/controllers/WhatsAppController.ts:118)
    *   **`remove` (Delete):** Deletes a WhatsApp account and removes its associated WhatsApp bot session by calling `DeleteWhatsAppService` and `removeWbot`. (file:backend/src/controllers/WhatsAppController.ts:148)
    *   **`restart`:** Allows an administrator to restart the WhatsApp bot for a given company by calling `restartWbot`. (file:backend/src/controllers/WhatsAppController.ts:170)
    *   **Real-time Updates:** Uses `socket.io` (`getIO()`) to emit real-time updates to connected clients when WhatsApp accounts are created, updated, or deleted, ensuring the frontend is always synchronized. (file:backend/src/controllers/WhatsAppController.ts:92, file:backend/src/controllers/WhatsAppController.ts:132, file:backend/src/controllers/WhatsAppController.ts:160)

### WhatsappService (file:backend/src/services/WhatsappService.ts)

The **WhatsappService** (node:WhatsappService_WS1) directory contains services responsible for the persistence and retrieval of WhatsApp account data.

*   **Purpose:** Encapsulates the **business logic** related to retrieving and managing WhatsApp account data from the database.
*   **Key Functionalities (examples from the directory):**
    *   **`ShowWhatsAppService`:** Retrieves a `Whatsapp` model instance from the database based on its ID and company ID, including related `Queue` and `Prompt` data. (file:backend/src/services/WhatsappService.ts:8)
    *   **`CreateWhatsAppService`:** Used by `WhatsAppController` to create new WhatsApp account entries in the database.
    *   **`DeleteWhatsAppService`:** Used by `WhatsAppController` to delete WhatsApp account entries from the database.

### WbotServices (directory:backend/src/services/WbotServices/)

The **WbotServices** (node:WbotServices_WBS) directory contains services that directly interact with the WhatsApp Web API.

*   **Purpose:** Manages the actual WhatsApp sessions, sends/receives messages, handles events, and maintains the connection to WhatsApp.
*   **Key Functionalities:**
    *   **`StartWhatsAppSession` (file:backend/src/services/WbotServices/StartWhatsAppSession.ts):** Initiates a new WhatsApp session, handling connection, authentication (QR code generation, session restoration), and setting up event listeners. It updates the WhatsApp account status in the database.
    *   **`removeWbot`:** Disconnects and removes a WhatsApp bot instance from memory.
    *   **`restartWbot`:** Restarts an existing WhatsApp bot session.
    *   **`SendMessage.ts` (file:backend/src/services/WbotServices/SendMessage.ts):** Handles sending messages through an active WhatsApp session.

### WhatsApp Session Management Flow

1.  **Creation:** A user initiates a new WhatsApp session via the `WhatsAppController.store` endpoint. `CreateWhatsAppService` saves the account details to the database, and then `StartWhatsAppSession` is called to connect to WhatsApp Web, generate a QR code (if needed), and establish the session. Real-time updates on session status are emitted via WebSockets.
2.  **Status Updates:** `StartWhatsAppSession` listens to events from the `whatsapp-web.js` library and updates the `status` field of the WhatsApp account in the database. `WhatsAppController` and `WhatsAppSessionController` also trigger status updates (e.g., `DISCONNECTED`) when sessions are explicitly removed or updated. These changes are broadcasted to the frontend via `socket.io`.
3.  **Deletion:** When a user requests to delete a WhatsApp session via `WhatsAppController.remove`, `DeleteWhatsAppService` removes the account from the database, and `removeWbot` clears the in-memory WhatsApp bot instance. The frontend is notified of the deletion via WebSockets.

## Low-Level Implementation Details: Message Sending and Receiving

### Message Sending

Message sending is handled by two primary services within `backend/src/services/WbotServices/`:

#### **`SendWhatsAppMessage.ts`** (file:backend/src/services/WbotServices/SendWhatsAppMessage.ts)

*   **`SendWhatsAppMessage`** (node:SendWhatsAppMessage_SWM1): This is the core function for sending standard text messages.
    *   It takes the message `body`, associated `ticket`, optional `quotedMsg` (for replies), and `isForwarded` as input.
    *   It retrieves the `wbot` (WhatsApp bot instance) using `GetTicketWbot(ticket)`.
    *   It formats the recipient's `chatId` and fetches the chat object.
    *   It handles quoted messages by attempting to find the original message in WhatsApp's history.
    *   Finally, it sends the message using `chat.sendMessage()` and updates the `lastMessage` field of the associated `ticket`.

#### **`SendWhatsAppMedia.ts`** (file:backend/src/services/WbotServices/SendWhatsAppMedia.ts)

*   **`SendWhatsAppMedia`** (node:SendWhatsAppMedia_SWM5): This is the primary function for sending media messages (images, videos, documents, audio).
    *   It takes `media` (file object), `ticket`, optional `body` (caption), and `isForwarded` as input.
    *   It retrieves the `wbot` and `chatId` similar to `SendWhatsAppMessage`.
    *   **Audio Handling:** It includes `processAudio` (node:processAudio_SWM2) and `processAudioFile` (node:processAudioFile_SWM3) to convert audio files to MP3 format using `ffmpeg` before sending. Voice messages are sent with `sendAudioAsVoice: true`.
    *   For other media types, it creates a `MessageMedia` object using `getMessageOptions` (node:getMessageOptions_SWM4) and sends it with an optional caption.
    *   It updates the `lastMessage` of the `ticket` and deletes the original media file after successful sending.

### Message Receiving

Message receiving is primarily managed by **`wbotMessageListener.ts`** (file:backend/src/services/WbotServices/wbotMessageListener.ts).

#### **`wbotMessageListener.ts`** (file:backend/src/services/WbotServices/wbotMessageListener.ts)

*   **`wbotMessageListener`** (node:wbotMessageListener_WML1): This function sets up event listeners for incoming WhatsApp messages (`message`), message acknowledgments (`message_ack`), and revoked messages (`message_revoked_everyone`). It acts as the central entry point for processing all incoming messages.
    *   It calls `filterMessages(message)` (node:filterMessages_WML38) to filter out irrelevant messages.
    *   It checks for duplicate messages and then dispatches new messages to `handleMessage`.
    *   It also includes logic for campaign-related message handling (`verifyRecentCampaign` (node:verifyRecentCampaign_WML11) and `verifyCampaignMessageAndCloseTicket` (node:verifyCampaignMessageAndCloseTicket_WML12)).
*   **`handleMessage`** (node:handleMessage_WML2): This is the core function for processing and saving incoming WhatsApp messages. It orchestrates various actions based on message content and context.
    *   It performs initial checks using `isValidMsg` (node:isValidMsg_WML13).
    *   It retrieves contact information using `getContactMessage` (node:getContactMessage_WML17) and `verifyContact` (node:verifyContact_WML18) (which creates/updates contacts in the database).
    *   It manages unread message counts and finds or creates a `Ticket` for the conversation.
    *   It handles media messages by calling `verifyMediaMessage` (node:verifyMediaMessage_WML3) to download and save media via `downloadMedia` (node:downloadMedia_WML5).
    *   It processes text messages via `verifyMessage` (node:verifyMessage_WML4).
    *   It integrates with external services like OpenAI (`handleOpenAi` (node:handleOpenAi_WML9)), N8N, and Typebot (`handleMessageIntegration` (node:handleMessageIntegration_WML10)).
    *   It manages chatbot flows and queue assignments using `verifyQueue` (node:verifyQueue_WML7) and `handleChartbot` (node:handleChartbot_WML8).
    *   It checks business hours and queue schedules to send automated "out of hours" messages.
*   **`handleMsgAck`** (node:handleMsgAck_WML6): Updates the acknowledgment status (read, delivered) of messages in the database and emits real-time updates to the frontend.
*   **Helper Functions:** The `wbotMessageListener.ts` file also contains numerous helper functions that support the main message processing flow, such as:
    *   `getBodyMessage` (node:getBodyMessage_WML14): Extracts text content from various message types.
    *   `getQuotedMessage` (node:getQuotedMessage_WML15) and `getQuotedMessageId` (node:getQuotedMessageId_WML16): Retrieve quoted message information.
    *   `handleRating` (node:handleRating_WML20): Processes user ratings for tickets.
    *   `convertTextToSpeechAndSaveToFile` (node:convertTextToSpeechAndSaveToFile_WML21) and `convertWavToAnotherFormat` (node:convertWavToAnotherFormat_WML22): Handle audio conversions.
    *   `transferQueue` (node:transferQueue_WML24): Transfers a ticket to a different queue.

In summary, the WhatsApp API component is a well-structured system that separates concerns into API handling, business logic, and direct WhatsApp interaction layers. It provides comprehensive functionality for managing WhatsApp accounts, sessions, and the sending and receiving of various message types, including advanced features like chatbot integration, campaign management, and external service integrations.

### Implementation Steps

1. **Understanding the High-Level Architecture**
   The WhatsApp API component is organized into a layered architecture. The `API Layer` handles external HTTP requests, acting as the entry point. The `Business Logic/Data Access Layer` manages core WhatsApp account data and persistence. The `WhatsApp Bot Interaction Layer` directly interfaces with the WhatsApp Web API for session management and message handling.

2. **Exploring the WhatsAppController**
   The `WhatsAppController` is the API endpoint handler for all WhatsApp-related operations. It receives HTTP requests, delegates business logic to appropriate services, and sends back responses. Its key functionalities include listing, creating, retrieving, updating, and deleting WhatsApp accounts. It also supports restarting WhatsApp bots and uses `socket.io` for real-time updates to connected clients.

3. **Delving into WhatsappService**
   The `WhatsappService` directory contains services responsible for the persistence and retrieval of WhatsApp account data. Its purpose is to encapsulate the business logic related to managing WhatsApp account data from the database. Examples include `ShowWhatsAppService` for retrieving account details, `CreateWhatsAppService` for creating new entries, and `DeleteWhatsAppService` for removing accounts.

4. **Understanding WbotServices for WhatsApp Interaction**
   The `WbotServices` directory houses services that directly interact with the WhatsApp Web API. These services manage actual WhatsApp sessions, send and receive messages, handle events, and maintain the connection to WhatsApp. Key functionalities include `StartWhatsAppSession` for initiating sessions, `removeWbot` for disconnecting bot instances, `restartWbot` for restarting sessions, and `SendMessage.ts` for handling message sending.

5. **Tracing the WhatsApp Session Management Flow**
   The WhatsApp session management flow involves several steps. Session creation is initiated via the `WhatsAppController`, which uses `CreateWhatsAppService` to save account details and then `StartWhatsAppSession` to connect to WhatsApp Web. Real-time updates are emitted via WebSockets. `StartWhatsAppSession` also listens for events to update the account status in the database, and these changes are broadcasted to the frontend. Session deletion, requested via the `WhatsAppController`, involves `DeleteWhatsAppService` to remove data and `removeWbot` to clear the in-memory bot instance, with frontend notification via WebSockets.

6. **Understanding Message Sending Mechanisms**
   Message sending is handled by two primary services within `WbotServices`. `SendWhatsAppMessage.ts` is responsible for sending standard text messages, handling message body, associated tickets, quoted messages, and forwarding. `SendWhatsAppMedia.ts` manages sending media messages (images, videos, documents, audio). It includes specific logic for audio handling, converting files to MP3 format using `ffmpeg` before sending, and creating `MessageMedia` objects for other media types. Both services update the `lastMessage` field of the associated ticket.

7. **Exploring Message Receiving and Processing**
   Message receiving is primarily managed by `wbotMessageListener.ts`. The `wbotMessageListener` function sets up event listeners for incoming messages, acknowledgments, and revoked messages, acting as the central entry point. It filters messages and dispatches new ones to `handleMessage`. The `handleMessage` function processes and saves incoming messages, performing checks, retrieving contact information, managing unread counts, and handling media and text messages. It also integrates with external services like OpenAI and manages chatbot flows. `handleMsgAck` updates message acknowledgment statuses and emits real-time updates. Numerous helper functions support the main message processing flow, such as extracting message content, handling quoted messages, processing ratings, and managing audio conversions.

