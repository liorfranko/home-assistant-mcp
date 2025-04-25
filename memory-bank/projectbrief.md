# Project Brief

This project, **Home Assistant MCP (Model Context Protocol)**, provides an integration layer enabling AI models (like Claude/Gemini) to interact with a user's Home Assistant instance and optionally Node-RED through a defined set of tools.

**Core Goal:** Allow natural language control, monitoring, and management of Home Assistant entities, automations, media players, updates, Node-RED flows, and dashboards via an AI assistant integrated with the MCP.

**Scope:**
- Implement tools covering key Home Assistant and Node-RED functionalities (see README tool list).
- Provide real-time communication through WebSocket API for events and state changes.
- Provide a secure and configurable way to connect to HA/Node-RED APIs.
- Integrate with environments like Cursor via its MCP server mechanism.
- Maintain clear documentation and structure for tool development.

**Key Features:**
- REST API integration for core Home Assistant functionality
- WebSocket API integration for real-time updates and events
- Node-RED flow management and deployment
- Dashboard configuration and management
- Secure authentication and configuration