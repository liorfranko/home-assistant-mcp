# Home Assistant MCP (Model Context Protocol)

This MCP provides integration between Anthropic's Claude and your Home Assistant instance, allowing you to control, monitor, and interact with your home automation system through natural language.

## Features

- **Automations Management**
  - List, get, create, update, and delete automations
  - Toggle automation state (on/off)

- **Entity Control**
  - List entities by domain (e.g., lights, switches, sensors)
  - Get detailed entity information
  - Update entity states and attributes
  - Call Home Assistant services for more complex actions

- **Media Player Control**
  - List all media players with their current states
  - Control playback (play, pause, stop, next, previous)
  - Adjust volume levels

- **Updates Management**
  - Check for available updates for Home Assistant Core, Supervisor, OS, and add-ons
  - Get detailed update information
  - Simulate installation of updates

- **Node-RED Integration**
  - List, get, and update Node-RED flows
  - Deploy flows with different deployment types

- **WebSocket Integration**
  - Real-time communication with Home Assistant
  - Subscribe to events and state changes
  - Fire custom events
  - Get live entity states and configuration
  - Discover available services

- **Architecture & Patterns**
  - Modular, domain-driven tool architecture
  - Tools split by domain and protocol (REST vs WebSocket)
  - Dedicated files for event and service WebSocket tools
  - Explicit tool registration in `src/index.ts`
  - Strong typing and validation
  - All tests pass after the latest refactor

## Source Code Structure

The source code is organized into the following directories:

- `/src`: Main source directory
  - `/config`: Configuration settings
    - `api.ts`: API connection configuration
  - `/ha-websocket`: WebSocket client implementation
    - `client.ts`: WebSocket client for real-time communication
    - `types.ts`: WebSocket message type definitions
  - `/tools`: Tool implementations organized by domain and protocol
    - `automations.ts`: Tools for managing Home Assistant automations (REST)
    - `entities.ts`: Tools for interacting with Home Assistant entities (REST)
    - `nodeRed.ts`: Tools for managing Node-RED flows (REST)
    - `updates.ts`: Tools for handling Home Assistant updates (REST)
    - `mediaPlayer.ts`: Tools for media player control (REST)
    - `config.ts`: Tools for configuration management (REST)
    - `mqtt.ts`: Tools for MQTT messaging (REST)
    - `scenes.ts`: Tools for scene management (REST)
    - `themes.ts`: Tools for theme management (REST)
    - `logs.ts`: Tools for log management (REST)
    - `websocket.ts`: Core WebSocket tools (connect, config, state)
    - `events.ts`: WebSocket tools for event subscription and firing
    - `services.ts`: WebSocket tools for service discovery
  - `/types`: Type definitions
  - `/utils`: Utility functions
    - `api-utils.ts`: API connection utilities and helper functions
    - `ws-utils.ts`: WebSocket client utilities
  - `index.ts`: Main entry point that registers all tools explicitly

## Prerequisites

- **Node.js** (v14.x or later)
- **npm** (v6.x or later)
- **Home Assistant** instance (accessible via network)
- **Long-lived access token** for Home Assistant
- **Node-RED** (optional, required only for Node-RED integration)
- **Cursor Editor** (optional, required only for Cursor MCP integration)

## Setup

### Option 1: Run with Cursor MCP

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/home-assistant-mcp.git
   cd home-assistant-mcp
   npm install
   npm run build
   ```

2. Create a `.cursor` directory in your project:
   ```
   mkdir -p .cursor
   ```

3. Create a `mcp.json` file in the `.cursor` directory:
   ```json
   {
     "mcpServers": {
       "home-assistant": {
         "command": "node",
         "args": ["<path/to/your/dist/folder>"],
         "env": {
           "HA_URL": "http://homeassistant.local:8123",
           "HA_TOKEN": "your_long_lived_access_token",
           "HA_WEBSOCKET_URL": "ws://homeassistant.local:8123/api/websocket",
           "NODE_RED_URL": "http://homeassistant.local:1880",
           "NODE_RED_USERNAME": "your_node_red_username",
           "NODE_RED_PASSWORD": "your_node_red_password"
         }
       }
     }
   }
   ```

4. Replace the environment variables with your actual Home Assistant and Node-RED credentials
5. Restart Cursor or reload the window to enable the MCP server
6. Open Cursor's chat (Cmd+I or Ctrl+I) and try a command like "List all my Home Assistant automations"

### Option 2: Run standalone

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/home-assistant-mcp.git
   cd home-assistant-mcp
   ```

2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   HA_URL=http://homeassistant.local:8123
   HA_TOKEN=your_long_lived_access_token
   HA_WEBSOCKET_URL=ws://homeassistant.local:8123/api/websocket
   NODE_RED_URL=http://homeassistant.local:1880
   NODE_RED_USERNAME=your_node_red_username
   NODE_RED_PASSWORD=your_node_red_password
   ```
4. Build the project:
   ```
   npm run build
   ```
5. Start the MCP:
   ```
   npm start
   ```

## Development

For development with hot-reloading:
```
npm run dev
```

Run tests:
```
npm test
```

All tests pass after the latest refactor and tool split.

### Adding New Tools

To add new tools:

1. Create appropriate type definitions in `/types` if needed
2. Add utility functions in `/utils` if needed
3. Create a new file in `/tools` for your tool category (by domain and protocol)
4. Register your tools explicitly in `index.ts`

## Generating a Home Assistant Long-Lived Access Token

1. Log in to your Home Assistant instance
2. Go to your profile by clicking on your username in the bottom left corner
3. Scroll down to the "Long-Lived Access Tokens" section
4. Click "Create Token"
5. Give your token a name (e.g., "Claude MCP")
6. Copy the token and add it to your `.env` file

## Tools Reference

### Automation Management

- `listHomeAssistantAutomations`: List all automations
- `getAutomation`: Get details about a specific automation
- `createAutomation`: Create a new automation
- `updateAutomation`: Update an existing automation
- `deleteAutomation`: Delete an automation

### Entity Management

- `listEntities`: List entities, optionally filtered by domain
- `getEntity`: Get details about a specific entity
- `updateEntity`: Update an entity's state and attributes
- `callService`: Call any Home Assistant service

### Media Player Control

- `listMediaPlayers`: List all media players with their states and properties
- `controlMediaPlayer`: Control media players with common commands
- `setVolume`: Set volume level for a specified media player

### Updates Management

- `checkUpdates`: Check for available updates
- `getUpdateDetails`: Get detailed information about a specific update
- `installUpdates`: Simulate installation of updates

### Node-RED Integration

- `listNodeRedFlows`: List all Node-RED flows
- `getNodeRedFlow`: Get details about a specific flow
- `updateNodeRedFlow`: Update a Node-RED flow
- `deployNodeRedFlows`: Deploy Node-RED flows

### WebSocket Integration

- `connectWebSocket`: Connect to Home Assistant WebSocket API
- `getHaConfig`: Get Home Assistant configuration via WebSocket
- `getAllEntityStates`: Get all entity states via WebSocket
- `subscribeToEvents`: Subscribe to Home Assistant events (see `events.ts`)
- `fireEvent`: Fire custom events in Home Assistant (see `events.ts`)
- `getAvailableServices`: Get available services via WebSocket (see `services.ts`)
- `validateConfig`: Validate Home Assistant configuration components

## Security Considerations

- Keep your Home Assistant access token secure
- This MCP has full access to your Home Assistant instance with the privileges of your access token
- Consider using a restricted user account for the access token
- Run the MCP in a secure environment
- WebSocket connections are authenticated using the same token as the REST API

## Troubleshooting

- If you encounter authentication issues, check your Home Assistant access token
- Make sure your Home Assistant instance is accessible from the machine running the MCP
- Check that your Node-RED instance is properly configured if you're using those features
- Verify environment variables are correctly set in your `.env` file
- Check the console output for detailed error messages

## Dashboard Management

### API-Based Dashboard Tools

The MCP provides tools to manage dashboards through the Home Assistant API:

- `listDashboards`: Lists all dashboards in Home Assistant
- `getDashboard`: Gets details about a specific dashboard
- `getDashboardConfig`: Retrieves the configuration of a dashboard
- `createDashboard`: Creates a new dashboard
- `updateDashboardConfig`: Updates a dashboard's configuration
- `deleteDashboard`: Deletes a dashboard

These tools require that Home Assistant is configured to use the storage mode for Lovelace UI.

### YAML-Based Dashboard Tools

For Home Assistant instances using YAML mode for dashboards, the MCP provides tools to directly edit the YAML configuration files:

- `listDashboardsFromFiles`: Lists all dashboards from YAML configuration files
- `getDashboardConfigYaml`: Retrieves a dashboard's configuration from its YAML file
- `createDashboardYaml`: Creates a new dashboard by writing to YAML configuration files
- `updateDashboardYaml`: Updates a dashboard's configuration by modifying YAML files
- `deleteDashboardYaml`: Deletes a dashboard by removing its YAML file and references

These tools require that the MCP has access to the Home Assistant configuration directory, which should be specified using the `HA_CONFIG_DIR` environment variable.

## Architectural & Design Patterns

- Modular, domain-driven tool architecture (REST and WebSocket separation)
- Dedicated files for event and service WebSocket tools
- Explicit tool registration in `src/index.ts`
- Strong typing and validation throughout
- Observer and event emitter patterns for real-time event handling
- Factory and strategy patterns for tool creation and API interaction
- Singleton pattern for WebSocket client
- Comprehensive error handling and automated testing
- All tests pass after the latest refactor
- Project is fully operational and modularized, with no critical issues 


## License

MIT