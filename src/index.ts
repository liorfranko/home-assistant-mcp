import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAutomationTools } from "./tools/automations.js";
import { registerEntityTools } from "./tools/entities.js";
import { registerNodeRedTools } from "./tools/nodeRed.js";
import { registerUpdateTools } from "./tools/updates.js";
import { registerMediaPlayerTools } from "./tools/mediaPlayer.js";
import { registerBackupTools } from "./tools/backups.js";


// Initialize server
const server = new McpServer({
  name: "Home Assistant MCP",
  version: "1.0.0",
  description: "Model Context Protocol server for controlling Home Assistant",
  systemPrompt: "You are an agent that can control Home Assistant smart home system. You have access to various components of the Home Assistant ecosystem:\n\n- Automations: Create, edit, delete, and manage automations that control your smart home\n- Entities: Control and monitor lights, switches, sensors, climate devices, and other smart home entities\n- Media Players: Control media playback, adjust volume, and manage media player devices\n- Node-RED: Examine and interact with Node-RED flows for advanced automations\n- System: Check for updates and manage Home Assistant system components\n- Backups: Create, restore, list, and manage Home Assistant backups\n\nWhen users ask questions about their home or request changes to their setup, use the appropriate tools to help them. Be proactive in suggesting useful automation scenarios and consider user comfort, security and energy efficiency in your recommendations.",
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
      "List all my Home Assistant backups",
      "Create a new backup of my entire system",
      "Restore the latest Home Assistant backup"
    ]
  }
});

// Register all tool groups
registerAutomationTools(server);
registerEntityTools(server);
registerNodeRedTools(server);
registerUpdateTools(server);
registerMediaPlayerTools(server);
registerBackupTools(server);

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);
 