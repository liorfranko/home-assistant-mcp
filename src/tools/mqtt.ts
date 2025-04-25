import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { callService } from '../utils/index.js';

export function registerMqttTools(server: McpServer) {
    server.tool(
        "publishMqttMessage",
        "Publishes a message to an MQTT topic.",
        {
            topic: z.string().describe("The MQTT topic to publish to"),
            payload: z.string().describe("The message payload to publish"),
            retain: z.boolean().optional().describe("Whether to retain the message"),
            qos: z.number().optional().describe("Quality of Service level (0, 1, or 2)")
        },
        async ({ topic, payload, retain, qos }) => {
            try {
                const response = await callService('mqtt', 'publish', {
                    topic,
                    payload,
                    retain,
                    qos
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Message published successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error publishing MQTT message: ${error.message}`
                    }]
                };
            }
        }
    );
} 