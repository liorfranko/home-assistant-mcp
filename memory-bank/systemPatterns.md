# System Patterns

This document describes the technical architecture and design:

- **Architecture:**
    - A Node.js/TypeScript application acting as an MCP server.
    - Connects to Home Assistant and Node-RED via their respective APIs using user-provided credentials (URL, token/password).
    - Exposes specific functionalities as tools callable by an AI model (e.g., within Cursor).
    - Tool implementations are organized by domain (`automations`, `entities`, `nodeRed`, etc.) within the `/src/tools` directory.
    - Uses environment variables or a `.env` file for configuration.
- **Key Decisions:**
    - Use TypeScript for type safety.
    - Structure tools logically by HA/Node-RED domain.
    - Provide setup options for both standalone execution and Cursor integration.
    - Separate API interaction logic (`api-utils.ts`) from tool logic.
- **Design Patterns:**
    - Modular tool registration (`index.ts`).
    - Configuration management via environment variables.
- **Component Relationships:** AI Assistant <-> MCP Server (this project) <-> Home Assistant API / Node-RED API.
- **Critical Paths:** Authentication with HA/Node-RED; API call translation within tools.

*(Please document the system patterns here)* 