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
*

---

## Research Query

Investigate the "WhatsApp API" component in detail. Provide a comprehensive analysis of its architecture, responsibilities, and implementation details.

*Session: 36a1f50efdc2899ed4e100fc516664c5 | Generated: 5/7/2025, 12:52:26*

### Analysis Summary

The previous sub-search for `backend/src/services/WbotServices/index.ts` returned an error, indicating the file might not exist or the path was incorrect. However, the sub-search for `backend/src/services/WbotServices/providers.ts` was successful and provided valuable information about how `whatsapp-web.js` is used for sending messages.

Given the information from the successful sub-searches, I can now synthesize a comprehensive report on the WhatsApp API component.

# WhatsApp API Component Analysis

The WhatsApp API component in this codebase is primarily responsible for managing WhatsApp accounts, handling communication with the WhatsApp Web API, and integrating WhatsApp functionalities into the overall system. It is built around the `whatsapp-web.js` library and is structured into several key modules within the `backend` directory.

## High-Level Architecture

The WhatsApp integration follows a layered architecture, with distinct responsibilities assigned to different components:

*   **[WhatsAppController.ts](file:backend/src/controllers/WhatsAppController.ts)**: This acts as the **API endpoint** for managing WhatsApp accounts.
    *   **Purpose:** Handles incoming HTTP requests related to WhatsApp accounts (e.g., creating, listing, showing, updating, and deleting accounts).
    *   **Internal Parts:** Contains methods for handling various HTTP verbs (GET, POST, PUT, DELETE) for WhatsApp account resources.
    *   **External Relationships:**
        *   Receives requests from the frontend.
        *   Orchestrates calls to the `WhatsappService` for business logic.
        *   Manages real-time updates to the frontend via WebSockets (using `getIO()`) to reflect changes in WhatsApp session status.
        *   Initiates WhatsApp session startup by calling `StartWhatsAppSession` from `WbotServices`.
        *   Provides an endpoint to restart WhatsApp sessions for a given company.
        *   Directly calls `removeWbot` and `restartWbot` from [wbot.ts](file:backend/src/libs/wbot.ts) to manage sessions.

*   **[WhatsappService.ts](file:backend/src/services/WhatsappService.ts)**: This serves as the **business logic layer** for WhatsApp account management.
    *   **Purpose:** Encapsulates the core business rules for creating, retrieving, updating, and deleting WhatsApp accounts.
    *   **Internal Parts:** Contains service methods like `CreateWhatsAppService`, `ListWhatsAppsService`, `ShowWhatsAppService`, `UpdateWhatsAppService`, and `DeleteWhatsAppService`.
    *   **External Relationships:**
        *   Called by the `WhatsAppController` to perform operations on WhatsApp accounts.
        *   Interacts with the database models (e.g., `Whatsapp`, `Queue`, `Prompt`) to persist and retrieve WhatsApp account information.
        *   Performs data validation and ensures data integrity related to WhatsApp accounts.

*   **[wbot.ts](file:backend/src/libs/wbot.ts)**: This is the **core WhatsApp client management** module.
    *   **Purpose:** Responsible for handling the actual connection and interaction with the WhatsApp Web API using the `whatsapp-web.js` library.
    *   **Internal Parts:**
        *   `initWASocket` [wbot.ts](file:backend/src/libs/wbot.ts:118): Initializes a new WhatsApp session, creates a `Client` instance from `whatsapp-web.js`, configures Puppeteer arguments, and sets up event listeners.
        *   `sessions` array [wbot.ts](file:backend/src/libs/wbot.ts:24): Stores active WhatsApp client instances.
        *   `getWbot` [wbot.ts](file:backend/src/libs/wbot.ts:35): Retrieves an active session by its WhatsApp ID.
        *   `removeWbot` [wbot.ts](file:backend/src/libs/wbot.ts:47): Handles logging out and destroying a session.
        *   `restartWbot` [wbot.ts](file:backend/src/libs/wbot.ts:71): Restarts all sessions for a given company.
        *   `isSessionActive` [wbot.ts](file:backend/src/libs/wbot.ts:342): Checks if a session is active.
        *   `getSessionInfo` [wbot.ts](file:backend/src/libs/wbot.ts:348): Retrieves session information.
    *   **External Relationships:**
        *   Directly interacts with the WhatsApp Web API via `whatsapp-web.js`.
        *   Called by `StartWhatsAppSession` (which is called by `WhatsAppController`) to initiate new sessions.
        *   Updates the `Whatsapp` model in the database with session status information (e.g., `qrcode`, `status`, `number`).
        *   Emits real-time events (via `getIO()`) to the frontend about session status changes.

## Implementation Details

The WhatsApp API component heavily relies on the `whatsapp-web.js` library for its core functionalities.

### WhatsApp Client Initialization and Management

The `whatsapp-web.js` client is initialized and managed within [wbot.ts](file:backend/src/libs/wbot.ts).

*   **Underlying Library:** The `Client` class from `whatsapp-web.js` is imported and used [wbot.ts](file:backend/src/libs/wbot.ts:2).
*   **Initialization Process (`initWASocket`):**
    *   A new `Client` instance is created [wbot.ts](file:backend/src/libs/wbot.ts:139).
    *   **Authentication:** `LocalAuth` is used for authentication [wbot.ts](file:backend/src/libs/wbot.ts:109), which stores session data in a local directory named `.wwebjs_auth` [wbot.ts](file:backend/src/libs/wbot.ts:102). This allows for persistent sessions without requiring re-authentication on every restart.
    *   **Puppeteer Configuration:** Various Puppeteer arguments are passed to the `Client` constructor [wbot.ts](file:backend/src/libs/wbot.ts:141-158) to control the headless browser used by `whatsapp-web.js`. These arguments likely optimize performance and ensure compatibility across different environments.
    *   **Web Version Cache:** A remote web version cache is utilized [wbot.ts](file:backend/src/libs/wbot.ts:159-162) to manage the WhatsApp Web version, ensuring the client uses a compatible version.
    *   **Event Handling:** The `initWASocket` function sets up listeners for critical `whatsapp-web.js` events:
        *   `qr`: Emitted when a QR code is generated for user authentication [wbot.ts](file:backend/src/libs/wbot.ts:176). The QR code data is then sent to the frontend via WebSockets.
        *   `ready`: Indicates that the client is ready and connected to WhatsApp [wbot.ts](file:backend/src/libs/wbot.ts:218).
        *   `authenticated`: Signifies successful authentication [wbot.ts](file:backend/src/libs/wbot.ts:279).
        *   `authentication_failure`: Handles cases where authentication fails [wbot.ts](file:backend/src/libs/wbot.ts:284).
        *   `disconnected`: Triggered when the client disconnects from WhatsApp [wbot.ts](file:backend/src/libs/wbot.ts:303).
        *   `state_changed`: Provides updates on the client's connection state [wbot.ts](file:backend/src/libs/wbot.ts:326).
    *   Finally, `client.initialize()` is called to start the WhatsApp client [wbot.ts](file:backend/src/libs/wbot.ts:331).

### Message Sending Functionality

The `whatsapp-web.js` client instance, managed by [wbot.ts](file:backend/src/libs/wbot.ts), is used by various services to send messages. The `provider` function in [providers.ts](file:backend/src/services/WbotServices/providers.ts:14) demonstrates this. It receives a `wbot` object (an instance of the `whatsapp-web.js` `Client`) and uses its `sendMessage()` method to send different types of messages, including text, media, and other specialized message formats. The extensive use of `wbot.sendMessage()` throughout [providers.ts](file:backend/src/services/WbotServices/providers.ts) indicates that this file likely centralizes the logic for constructing and sending various message types based on the application's needs.

## Problemas Conocidos y Soluciones

### Fix: Mensajes enviados desde celular no se muestran en conversación correcta

**Problema Resuelto ✅ (Enero 2025)**

**Descripción del Problema:**
Los mensajes enviados desde el celular (respuestas directas desde WhatsApp móvil) no aparecían en la conversación correcta del cliente en el sistema, sino que se mostraban en una conversación separada.

**Causa Raíz:**
El problema estaba en la lógica de filtrado del frontend (`MessagesList/index.js`) que no manejaba correctamente los mensajes `fromMe` para asociarlos con la conversación del cliente correcto.

**Solución Implementada:**
- **Archivo modificado:** `frontend/src/components/MessagesList/index.js` líneas 459-547
- **Cambio principal:** Mejorada la lógica de filtrado de mensajes en tiempo real vía Socket.IO

```javascript
// ANTES (incorrecto):
const isSamePhoneNumber = data.message?.contact?.number === ticket?.contact?.number;

// DESPUÉS (correcto):
const messageFromMe = data.message?.fromMe;
const messageTicketContactNumber = data.ticket?.contact?.number;
const currentTicketContactNumber = ticket?.contact?.number;
const isFromMeToSameContact = messageFromMe && 
  messageTicketContactNumber === currentTicketContactNumber;

const isSamePhoneNumber = !messageFromMe && 
  data.message?.contact?.number === ticket?.contact?.number;

const shouldAddMessage = isCorrectTicket || isFromMeToSameContact || isSamePhoneNumber;
```

**Lógica de la Solución:**
1. **Para mensajes `fromMe`:** Compara el número del cliente del ticket del mensaje con el ticket actual
2. **Para mensajes recibidos:** Mantiene la lógica original de comparar números de contacto
3. **Resultado:** Los mensajes enviados desde el celular aparecen correctamente en la conversación del cliente

**Beneficios:**
- ✅ Mensajes desde celular se muestran en conversación correcta
- ✅ No se crean conversaciones duplicadas
- ✅ Historial de conversación completo
- ✅ Experiencia de usuario mejorada

## Conclusion

The WhatsApp API component is a well-structured part of the system, clearly separating concerns between API handling, business logic, and the direct interaction with the WhatsApp Web API. The use of `whatsapp-web.js` and its event-driven architecture allows for robust session management and real-time communication capabilities. The `WbotServices` (specifically `providers.ts`) acts as an abstraction layer over the raw `whatsapp-web.js` client, providing specialized functions for sending different message types.

### Implementation Steps

1. **Understanding the WhatsApp API Component Architecture**
   The WhatsApp API component is responsible for managing WhatsApp accounts, handling communication with the WhatsApp Web API, and integrating WhatsApp functionalities. It uses a layered architecture with distinct responsibilities for different components.

2. **Exploring the WhatsAppController**
   The `WhatsAppController` acts as the API endpoint for managing WhatsApp accounts. It handles incoming HTTP requests, orchestrates calls to the `WhatsappService` for business logic, manages real-time updates to the frontend via WebSockets, and initiates WhatsApp session startup. It also directly manages sessions by calling `removeWbot` and `restartWbot`.

3. **Delving into the WhatsappService**
   The `WhatsappService` serves as the business logic layer for WhatsApp account management. It encapsulates core business rules for creating, retrieving, updating, and deleting WhatsApp accounts. It is called by the `WhatsAppController` and interacts with database models to persist and retrieve WhatsApp account information, performing data validation.

4. **Understanding the wbot Module**
   The `wbot` module is the core WhatsApp client management module. It is responsible for handling the actual connection and interaction with the WhatsApp Web API using the `whatsapp-web.js` library. It initializes new WhatsApp sessions, stores active client instances, retrieves and removes active sessions, restarts sessions, and checks session activity. It also updates the `Whatsapp` model in the database with session status and emits real-time events to the frontend.

5. **WhatsApp Client Initialization and Management**
   The WhatsApp API component heavily relies on the `whatsapp-web.js` library. The `Client` class from `whatsapp-web.js` is used for initialization. `LocalAuth` is used for authentication, storing session data for persistent sessions. Puppeteer arguments are configured for the headless browser, and a remote web version cache is utilized. Event listeners are set up for `qr`, `ready`, `authenticated`, `authentication_failure`, `disconnected`, and `state_changed` events, and `client.initialize()` starts the WhatsApp client.

6. **Understanding Message Sending Functionality**
   The `whatsapp-web.js` client instance, managed by `wbot`, is used by various services to send messages. A `provider` function demonstrates this by receiving a `wbot` object and using its `sendMessage()` method to send different types of messages, including text, media, and other specialized formats. This centralizes the logic for constructing and sending various message types.

