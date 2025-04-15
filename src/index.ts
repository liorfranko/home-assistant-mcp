import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAutomationTools } from "./tools/automations.js";
import { registerEntityTools } from "./tools/entities.js";
import { registerNodeRedTools } from "./tools/nodeRed.js";
import { registerUpdateTools } from "./tools/updates.js";
import { registerMediaPlayerTools } from "./tools/mediaPlayer.js";


// Initialize server
const server = new McpServer({
  name: "Home Assistant MCP",
  version: "1.0.0"
});

// Register all tool groups
registerAutomationTools(server);
registerEntityTools(server);
registerNodeRedTools(server);
registerUpdateTools(server);
registerMediaPlayerTools(server);

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);
 