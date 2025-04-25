import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HomeAssistantWebSocketClient } from "../utils/ws-utils.js";
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get WebSocket URL and token from environment variables
const wsUrl = process.env.HA_WEBSOCKET_URL || 'ws://localhost:8123/api/websocket';
const token = process.env.HA_TOKEN;

if (!token) {
    throw new Error('HA_TOKEN environment variable is required');
}

// Create WebSocket client instance
const wsClient = new HomeAssistantWebSocketClient({
    url: wsUrl,
    token: token
});

export function registerWebSocketTools(server: McpServer) {
    // Connect to WebSocket
    server.tool(
        "connectWebSocket",
        "Connects to the Home Assistant WebSocket API",
        {},
        async () => {
            await wsClient.connect();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, message: 'Connected to Home Assistant WebSocket API' }, null, 2)
                }]
            };
        }
    );

    // Get Home Assistant configuration
    server.tool(
        "getHaConfig",
        "Retrieves the Home Assistant configuration via WebSocket",
        {},
        async () => {
            const config = await wsClient.getConfig();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(config, null, 2)
                }]
            };
        }
    );

    // Subscribe to events
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

    // Fire event
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

    // Get all entity states
    server.tool(
        "getAllEntityStates",
        "Retrieves all entity states from Home Assistant via WebSocket",
        {},
        async () => {
            const states = await wsClient.getStates();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(states, null, 2)
                }]
            };
        }
    );

    // Get available services
    server.tool(
        "getAvailableServices",
        "Retrieves all available services from Home Assistant via WebSocket",
        {},
        async () => {
            const services = await wsClient.getServices();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(services, null, 2)
                }]
            };
        }
    );

} 