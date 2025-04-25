import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAutomationTools } from "./tools/automations.js";
import { registerEntityTools } from "./tools/entities.js";
import { registerNodeRedTools } from "./tools/nodeRed.js";
import { registerUpdateTools } from "./tools/updates.js";
import { registerMediaPlayerTools } from "./tools/mediaPlayer.js";
import { registerConfigTools } from "./tools/config.js";
import { registerMqttTools } from "./tools/mqtt.js";
import { registerSceneTools } from "./tools/scenes.js";
import { registerThemeTools } from "./tools/themes.js";
import { registerLogTools } from "./tools/logs.js";
import { registerWebSocketTools } from "./tools/websocket.js";


// Initialize server
const server = new McpServer({
  name: "Home Assistant MCP",
  version: "1.0.0",
  description: "Model Context Protocol server for controlling Home Assistant",
  systemPrompt: "You are an agent that can control Home Assistant smart home system. You have access to various components of the Home Assistant ecosystem:\n\n- Automations: Create, edit, delete, and manage automations that control your smart home\n- Entities: Control and monitor lights, switches, sensors, climate devices, and other smart home entities\n- Media Players: Control media playback, adjust volume, and manage media player devices\n- Node-RED: Examine and interact with Node-RED flows for advanced automations\n- System: Check for updates and manage Home Assistant system components\n- Configuration: Retrieve and validate Home Assistant configuration\n- MQTT: Manage MQTT topics, publish/subscribe to messages, and discover MQTT devices\n- Scenes: Create, activate, and manage scenes for controlling multiple entities at once\n- Themes: Manage and customize the Home Assistant frontend appearance\n- Logs: View and manage system logs, set log levels, and monitor errors\n- WebSocket: Direct WebSocket communication with Home Assistant for real-time updates and control\n\nWhen users ask questions about their home or request changes to their setup, use the appropriate tools to help them. Be proactive in suggesting useful automation scenarios and consider user comfort, security and energy efficiency in your recommendations.",
  usage: {
    examples: [
      "List all automations in my Home Assistant instance",
      "Turn on the living room lights",
      "What's the current temperature in the bedroom?",
      "Show me all available Node-RED flows",
      "Check for Home Assistant updates",
      "Create an automation that turns on my porch light at sunset",
      "Set my thermostat to 72 degrees",
      "Pause the media player in the kitchen",
      "Which lights are currently on in my house?",
      "Show me details about my front door sensor",
      "Create a nighttime routine that turns off all lights at 11pm",
      "Adjust the volume of my living room speaker to 40%",
      "What's the status of my washer/dryer?",
      "Deploy my updated Node-RED flows",
      "Is my garage door closed?",
      "Check if my Home Assistant configuration is valid",
      "What version of Home Assistant am I running?",
      "List all MQTT topics",
      "Publish a message to an MQTT topic",
      "Subscribe to an MQTT topic",
      "Show me all discovered MQTT devices",
      "List all available scenes",
      "Create a new movie night scene",
      "Activate the bedtime scene",
      "Delete an unused scene",
      "List all available themes",
      "Switch to dark mode theme",
      "Set a custom theme",
      "Get current theme settings",
      "Show me the latest system logs",
      "Set debug log level for Z-Wave integration",
      "Show me error logs from the last hour",
      "Clear all system logs",
      "Show me automation execution logs"
    ]
  }
});

// Register all tool groups
registerAutomationTools(server);
registerEntityTools(server);
registerNodeRedTools(server);
registerUpdateTools(server);
registerMediaPlayerTools(server);
registerConfigTools(server);
registerMqttTools(server);
registerSceneTools(server);
registerThemeTools(server);
registerLogTools(server);
registerWebSocketTools(server);

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Remove the tools array since we're using the register pattern
 