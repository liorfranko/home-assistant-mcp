# Tech Context

This document covers the technologies and tools used:

- **Technologies:**
    - Node.js (v14.x+)
    - TypeScript
    - Home Assistant API
    - Node-RED Admin API (optional)
- **Development Setup:**
    - Clone repository.
    - Install dependencies: `npm install`
    - Configure connection details (HA URL/Token, optional Node-RED URL/Credentials) via `.env` file or Cursor `mcp.json`.
    - Build: `npm run build`
    - Run standalone: `npm start`
    - Run dev mode: `npm run dev`
    - Run tests: `npm test` (Uses Jest - see `jest.config.js`)
- **Constraints:**
    - Requires network access to the Home Assistant instance.
    - Security depends on the provided HA token's permissions.
    - Dashboard tools may have different requirements based on HA Lovelace mode (storage vs. YAML).
- **Dependencies:** (See `package.json` for specific libraries - likely includes HTTP clients like `axios` or `node-fetch`, and potentially HA/Node-RED specific libraries).
- **Tool Usage:**
    - Tools are defined in `/src/tools` and registered in `/src/index.ts`.
    - Follows Cursor MCP specifications for integration.
    - Uses `tsconfig.json` for TypeScript configuration.
    - Uses `jest.config.js` for Jest test runner configuration.

*(Please detail the technical context here)* 