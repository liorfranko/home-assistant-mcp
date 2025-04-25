# System Patterns

This document describes the technical architecture and design:

- **Architecture:**
    - Node.js/TypeScript MCP server for Home Assistant and Node-RED integration.
    - Connects to Home Assistant and Node-RED via REST and WebSocket APIs.
    - Maintains WebSocket connection for real-time communication with Home Assistant.
    - Exposes domain-specific functionalities as tools callable by an AI model.
    - **Tools are now split by domain and protocol:**
        - REST tools (e.g., entities, automations, config) vs WebSocket tools (real-time events, state, services).
        - Dedicated files for event (`events.ts`) and service (`services.ts`) WebSocket tools for maintainability and clarity.
    - All tool registration is explicit in `src/index.ts` for transparency and extensibility.
    - Uses environment variables or a `.env` file for configuration.

- **Key Decisions:**
    - Use TypeScript for type safety and better development experience.
    - Structure tools logically by HA/Node-RED domain and protocol.
    - Provide setup options for both standalone execution and Cursor integration.
    - Separate API interaction logic from tool logic.
    - Implement comprehensive error handling and validation.
    - Use Jest for testing framework.
    - Use WebSocket for real-time features instead of polling.
    - Implement robust WebSocket reconnection handling.
    - **New:** Use dedicated files for event and service WebSocket tools.
    - **New:** Register all tools explicitly in the main entrypoint.

- **Design Patterns:**
    - Modular tool registration system, now with explicit registration in `index.ts`.
    - Configuration management via environment variables.
    - Type-safe API interactions.
    - Domain-driven design for tool organization.
    - Factory pattern for tool creation.
    - Observer pattern for state changes and events.
    - Strategy pattern for different API interactions.
    - Singleton pattern for WebSocket client.
    - Event emitter pattern for WebSocket events.
    - **New:** Dedicated event and service tool modules for WebSocket.

- **Component Relationships:** 
    - AI Assistant <-> MCP Server (this project) <-> Home Assistant API / Node-RED API.
    - Tool Registry <-> Individual Tools <-> API Clients.
    - Configuration Manager <-> Environment.
    - Type Definitions <-> API Interfaces.
    - WebSocket Client <-> Event Subscribers (now in `events.ts`).
    - WebSocket Client <-> Service Discovery (now in `services.ts`).
    - WebSocket Client <-> Home Assistant WebSocket API.

- **Critical Paths:** 
    - Authentication with HA/Node-RED.
    - API call translation within tools.
    - Error handling and recovery.
    - State management and updates.
    - Tool registration and initialization (now explicit in `index.ts`).
    - WebSocket connection management.
    - Event subscription handling (now in `events.ts`).
    - Real-time state synchronization.

- **Communication Patterns:**
    - REST API:
        - CRUD operations
        - Configuration changes
        - Service calls
        - State queries
    - WebSocket API:
        - Real-time events (now in `events.ts`)
        - State changes
        - Command results
        - Configuration updates
        - Service discovery (now in `services.ts`)
    - MQTT:
        - Message publishing
        - Topic subscriptions
    - Node-RED:
        - Flow management
        - Deployment control

*(Please document the system patterns here)* 