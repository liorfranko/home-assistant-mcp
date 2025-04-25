# Tech Context

This document covers the technologies and tools used:

- **Technologies:**
    - Node.js (v14.x+)
    - TypeScript
    - Home Assistant REST API
    - Home Assistant WebSocket API
    - Node-RED Admin API (optional)
    - MQTT Protocol Support

- **Development Setup:**
    - Clone repository
    - Install dependencies: `npm install`
    - Configure connection details via `.env` file or Cursor `mcp.json`:
        - Home Assistant URL and Long-Lived Access Token
        - Home Assistant WebSocket URL
        - Optional Node-RED URL and Credentials
        - Optional MQTT broker details
    - Build: `npm run build`
    - Run standalone: `npm start`
    - Run dev mode: `npm run dev`
    - Run tests: `npm test`

- **Constraints:**
    - Requires network access to the Home Assistant instance
    - Security depends on the provided HA token's permissions
    - Dashboard tools may have different requirements based on HA Lovelace mode
    - Node-RED integration requires admin API access
    - MQTT functionality needs broker configuration
    - WebSocket connections require stable network connection

- **Dependencies:**
    - Core:
        - `axios` for HTTP requests
        - `ws` for WebSocket connections
        - `mqtt` for MQTT protocol support
        - `dotenv` for environment configuration
        - `zod` for runtime type validation
    - Development:
        - `typescript` for type checking
        - `jest` for testing
        - `eslint` for code linting
        - `prettier` for code formatting

- **Tool Usage:**
    - Tools defined in `/src/tools` with domain-specific organization
    - **New:** WebSocket tools are now split into dedicated files for events (`events.ts`) and services (`services.ts`)
    - Each tool implements standard MCP interface
    - Strong typing via TypeScript interfaces
    - Comprehensive error handling
    - Automated testing with Jest
    - Documentation via JSDoc comments
    - **New:** All tool registration is explicit in `src/index.ts` for clarity and extensibility

- **Configuration:**
    - Environment variables for sensitive data
    - TypeScript configuration in `tsconfig.json`
    - Jest configuration in `jest.config.js`
    - ESLint rules for code quality
    - Prettier config for consistent formatting

- **WebSocket Implementation:**
    - Custom WebSocket client in `/src/ha-websocket`
    - Automatic reconnection handling
    - Event subscription management (now in `events.ts`)
    - Authentication via HA token
    - Message type definitions
    - Real-time state updates
    - Event handling system
    - Ping/pong keep-alive
    - Error recovery mechanisms
    - **New:** Service discovery logic now in `services.ts`

- **API Integration:**
    - REST API for standard operations
    - WebSocket API for real-time features:
        - Event subscriptions (now in `events.ts`)
        - State changes
        - Configuration updates
        - Service calls
        - Command results
        - Service discovery (now in `services.ts`)
    - MQTT for message broker operations
    - Node-RED API for flow management

- **Testing:**
    - All tests pass after the latest refactor and tool split

*(Please detail the technical context here)* 