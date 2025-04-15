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

- **Updates Management**
  - Check for available updates for Home Assistant Core, Supervisor, OS, and add-ons
  - Get detailed update information
  - Simulate installation of updates

- **Node-RED Integration**
  - List, get, and update Node-RED flows
  - Deploy flows with different deployment types

## Source Code Structure

The source code is organized into the following directories:

- `/src`: Main source directory
  - `/config`: Configuration and API utilities
    - `api.ts`: API connection utilities and environment setup
  - `/tools`: Tool implementations organized by functionality
    - `automations.ts`: Tools for managing Home Assistant automations
    - `entities.ts`: Tools for interacting with Home Assistant entities
    - `nodeRed.ts`: Tools for managing Node-RED flows
    - `updates.ts`: Tools for handling Home Assistant updates
  - `/types`: Type definitions
    - `index.ts`: Common types used throughout the application
  - `index.ts`: Main entry point that registers all tools

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   HA_URL=http://your-home-assistant-url:8123
   HA_TOKEN=your_long_lived_access_token
   NODE_RED_URL=http://your-node-red-url:1880
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

### Adding New Tools

To add new tools:

1. Create appropriate type definitions in `/types` if needed
2. Add utility functions in `/config` if needed
3. Create a new file in `/tools` for your tool category
4. Register your tools in `index.ts`

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

### Updates Management

- `checkUpdates`: Check for available updates
- `getUpdateDetails`: Get detailed information about a specific update
- `installUpdates`: Simulate installation of updates

### Node-RED Integration

- `listNodeRedFlows`: List all Node-RED flows
- `getNodeRedFlow`: Get details about a specific flow
- `updateNodeRedFlow`: Update a Node-RED flow
- `deployNodeRedFlows`: Deploy Node-RED flows

## Security Considerations

- Keep your Home Assistant access token secure
- This MCP has full access to your Home Assistant instance with the privileges of your access token
- Consider using a restricted user account for the access token
- Run the MCP in a secure environment

## Troubleshooting

- If you encounter authentication issues, check your Home Assistant access token
- Make sure your Home Assistant instance is accessible from the machine running the MCP
- Check that your Node-RED instance is properly configured if you're using those features
- Verify environment variables are correctly set in your `.env` file
- Check the console output for detailed error messages

## Testing

To run integration tests:

```
RUN_TESTS=true npm start
```

Note: Tests require a working Home Assistant connection.

## License

MIT 