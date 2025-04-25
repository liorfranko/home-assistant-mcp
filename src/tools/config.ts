// This file includes both REST and WebSocket-based configuration tools for Home Assistant.
import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/rest-api-utils.js";

export function registerConfigTools(server: McpServer) {
  server.tool(
    "getConfig",
    "Retrieves the current Home Assistant configuration information",
    {},
    async () => {
      try {
        const response = await callHomeAssistantApi<any>('get', "/api/config");
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching configuration:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "fetching configuration")
          }]
        };
      }
    }
  );

  server.tool(
    "checkConfig",
    "Checks the validity of the current Home Assistant configuration.",
    {},
    async () => {
      try {
        // This endpoint is used to check configuration validity
        const response = await callHomeAssistantApi<{ result: string }>('post', "/api/config/core/check_config");
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              valid: response.result === "valid",
              ...response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error checking configuration:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "checking configuration")
          }]
        };
      }
    }
  );

  server.tool(
    "getHaConfig",
    "Retrieves the Home Assistant configuration via WebSocket",
    {},
    async () => {
      try {
        // Use WebSocket for real-time config
        const dotenv = await import('dotenv');
        dotenv.config();
        const { HomeAssistantWebSocketClient } = await import('../utils/ws-utils.js');
        const wsUrl = process.env.HA_WEBSOCKET_URL || 'ws://localhost:8123/api/websocket';
        const token = process.env.HA_TOKEN;
        if (!token) throw new Error('HA_TOKEN environment variable is required');
        const wsClient = new HomeAssistantWebSocketClient({ url: wsUrl, token });
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
} 