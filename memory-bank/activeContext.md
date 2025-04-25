# Active Context

*(Updated 2025-04-25)*

This document tracks the current focus and state of the project:

- **Current Focus:**
  - Maintaining a modular, domain-driven tool architecture for Home Assistant and Node-RED integration, with clear separation between REST and WebSocket-based tools.
  - Ensuring real-time capabilities and event-driven automation via WebSocket.
- **Recent Changes:**
  - Tools are now split by domain and protocol (REST vs WebSocket) for clarity and maintainability.
  - Created `events.ts` for WebSocket-based event subscription and firing tools (`subscribeToEvents`, `fireEvent`).
  - Created `services.ts` for WebSocket-based service discovery (`getAvailableServices`).
  - Removed event/service WebSocket tools from `websocket.ts` and `entities.ts`.
  - All tool registration is now explicit in `src/index.ts` for transparency and extensibility.
  - All tests pass after the refactor, confirming no regressions.
- **Next Steps:**
  - Continue to improve error handling and documentation for new tool files.
  - Expand test coverage for event and service tools.
  - Monitor for further opportunities to modularize or clarify tool boundaries.
- **Decisions:**
  - Maintain strict separation of concerns by protocol and domain.
  - Use dedicated files for event and service tools to support future growth.
  - Register all tools explicitly in the main entrypoint for clarity.
- **Patterns & Preferences:**
  - Modular, domain-driven tool architecture
  - Strong typing and validation
  - Explicit tool registration
  - Real-time event handling via WebSocket
- **Learnings:**
  - The new structure improves maintainability and discoverability of tools.
  - Explicit registration in `index.ts` makes it easy to add or remove tool groups.
  - Tests are critical for safe refactoring.

*(This file should be updated frequently)* 