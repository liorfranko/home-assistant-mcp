// This file contains WebSocket-based tools for Home Assistant event subscription and firing.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
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

export function registerEventTools(server: McpServer) {
  server.tool(
    "subscribeToEvents",
    "Subscribes to Home Assistant events via WebSocket",
    {
      event_type: z.string().optional().describe("Type of event to subscribe to (optional)")
    },
    async ({ event_type }) => {
      let events: any[] = [];
      const unsubscribe = await wsClient.subscribeEvents((event) => {
        events.push(event);
      }, event_type);
      // Keep subscription active for 5 seconds to collect events
      await new Promise(resolve => setTimeout(resolve, 5000));
      await unsubscribe();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ events }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "fireEvent",
    "Fires a custom event in Home Assistant via WebSocket",
    {
      event_type: z.string().describe("Type of event to fire"),
      event_data: z.record(z.any()).optional().describe("Data to include with the event")
    },
    async ({ event_type, event_data }) => {
      await wsClient.fireEvent(event_type, event_data);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: `Event ${event_type} fired successfully` }, null, 2)
        }]
      };
    }
  );
} 