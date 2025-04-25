# System Patterns

This document describes the technical architecture and design:

- **Architecture:**
    - A Node.js/TypeScript application acting as an MCP server.
    - Connects to Home Assistant and Node-RED via their respective APIs using user-provided credentials (URL, token/password).
    - Maintains WebSocket connection for real-time communication with Home Assistant.
    - Exposes specific functionalities as tools callable by an AI model (e.g., within Cursor).
    - Tool implementations are organized by domain (`automations`, `entities`, `nodeRed`, `websocket`, etc.) within the `/src/tools` directory.
    - Uses environment variables or a `.env` file for configuration.

- **Key Decisions:**
    - Use TypeScript for type safety and better development experience.
    - Structure tools logically by HA/Node-RED domain.
    - Provide setup options for both standalone execution and Cursor integration.
    - Separate API interaction logic from tool logic.
    - Implement comprehensive error handling and validation.
    - Use Jest for testing framework.
    - Use WebSocket for real-time features instead of polling.
    - Implement robust WebSocket reconnection handling.

- **Design Patterns:**
    - Modular tool registration system.
    - Configuration management via environment variables.
    - Type-safe API interactions.
    - Domain-driven design for tool organization.
    - Factory pattern for tool creation.
    - Observer pattern for state changes and events.
    - Strategy pattern for different API interactions.
    - Singleton pattern for WebSocket client.
    - Event emitter pattern for WebSocket events.

- **Component Relationships:** 
    - AI Assistant <-> MCP Server (this project) <-> Home Assistant API / Node-RED API.
    - Tool Registry <-> Individual Tools <-> API Clients.
    - Configuration Manager <-> Environment.
    - Type Definitions <-> API Interfaces.
    - WebSocket Client <-> Event Subscribers.
    - WebSocket Client <-> Home Assistant WebSocket API.

- **Critical Paths:** 
    - Authentication with HA/Node-RED.
    - API call translation within tools.
    - Error handling and recovery.
    - State management and updates.
    - Tool registration and initialization.
    - WebSocket connection management.
    - Event subscription handling.
    - Real-time state synchronization.

- **Communication Patterns:**
    - REST API:
        - CRUD operations
        - Configuration changes
        - Service calls
        - State queries
    - WebSocket API:
        - Real-time events
        - State changes
        - Command results
        - Configuration updates
    - MQTT:
        - Message publishing
        - Topic subscriptions
    - Node-RED:
        - Flow management
        - Deployment control

*(Please document the system patterns here)* 