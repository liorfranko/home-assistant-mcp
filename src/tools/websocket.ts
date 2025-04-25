import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HomeAssistantWebSocketClient } from "../utils/ws-utils.js";
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
} 