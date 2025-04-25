// This file contains WebSocket-based tools for Home Assistant service discovery and management.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dotenv from 'dotenv';
import { HomeAssistantWebSocketClient } from "../utils/ws-utils.js";
import { z } from "zod";

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

  server.tool(
    "callService",
    "Calls a Home Assistant service via WebSocket. Parameters: domain (string), service (string), serviceData (object, optional), target (object, optional: entity_id/device_id/area_id)",
    {
      domain: z.string().describe("The domain of the service (e.g., light, switch)"),
      service: z.string().describe("The service to call (e.g., turn_on, turn_off)"),
      serviceData: z.record(z.any()).optional().describe("Optional service data"),
      target: z.object({
        entity_id: z.string().or(z.array(z.string())).optional().describe("Entity ID(s) to target"),
        device_id: z.string().or(z.array(z.string())).optional().describe("Device ID(s) to target"),
        area_id: z.string().or(z.array(z.string())).optional().describe("Area ID(s) to target")
      }).optional().describe("Optional target object with entity_id, device_id, or area_id")
    },
    async ({ domain, service, serviceData, target }) => {
      try {
        const result = await wsClient.callService(domain, service, serviceData, target);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error calling service via WebSocket:", error);
        return {
          content: [{
            type: "text",
            text: `Error calling service via WebSocket: ${error.message}`
          }]
        };
      }
    }
  );
} 