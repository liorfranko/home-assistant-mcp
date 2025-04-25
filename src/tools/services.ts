// This file contains WebSocket-based tools for Home Assistant service discovery and management.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dotenv from 'dotenv';
import { HomeAssistantWebSocketClient } from "../utils/ws-utils.js";

dotenv.config();
const wsUrl = process.env.HA_WEBSOCKET_URL || 'ws://localhost:8123/api/websocket';
const token = process.env.HA_TOKEN;

if (!token) {
  throw new Error('HA_TOKEN environment variable is required');
}

const wsClient = new HomeAssistantWebSocketClient({
  url: wsUrl,
  token: token
});

export function registerServiceTools(server: McpServer) {
  server.tool(
    "getAvailableServices",
    "Retrieves all available services from Home Assistant via WebSocket",
    {},
    async () => {
      try {
        const services = await wsClient.getServices();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(services, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching available services via WebSocket:", error);
        return {
          content: [{
            type: "text",
            text: `Error fetching available services via WebSocket: ${error.message}`
          }]
        };
      }
    }
  );
} 