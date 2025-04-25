// This file includes both REST and WebSocket-based configuration tools for Home Assistant.
import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/rest-api-utils.js";
import { HomeAssistantWebSocketClient } from "../utils/ws-utils.js";

import dotenv from 'dotenv';
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

export function registerConfigTools(server: McpServer) {
  server.tool(
    "getConfig",
    "Retrieves the Home Assistant configuration via WebSocket",
    {},
    async () => {
      try {
        const config = await wsClient.getConfig();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(config, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching configuration via WebSocket:", error);
        return {
          content: [{
            type: "text",
            text: `Error fetching configuration via WebSocket: ${error.message}`
          }]
        };
      }
    }
  );


  server.tool(
    "validateConfig",
    "Validates the Home Assistant configuration via WebSocket.",
    {},
    async () => {
      try {
        const result = await wsClient.validateConfig();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error validating config via WebSocket:", error);
        return {
          content: [{
            type: "text",
            text: `Error validating config via WebSocket: ${error.message}`
          }]
        };
      }
    }
  );  
} 