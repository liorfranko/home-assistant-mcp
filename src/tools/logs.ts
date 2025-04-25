import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { callService } from '../utils/index.js';

export function registerLogTools(server: McpServer) {
    server.tool(
        "setLogLevel",
        "Sets the log level for a specific integration or component.",
        {
            integration: z.string().describe("The integration or component name"),
            level: z.enum(['debug', 'info', 'warning', 'error']).describe("The log level to set")
        },
        async ({ integration, level }) => {
            try {
                const response = await callService('logger', 'set_level', {
                    [integration]: level
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Log level for ${integration} set to ${level}`,
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error setting log level: ${error.message}`
                    }]
                };
            }
        }
    );
} 