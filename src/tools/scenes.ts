import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { callService } from '../utils/index.js';

export function registerSceneTools(server: McpServer) {
    server.tool(
        "activateScene",
        "Activates a specific scene.",
        {
            scene_id: z.string().describe("The ID of the scene to activate"),
            transition: z.number().optional().describe("Transition time in seconds")
        },
        async ({ scene_id, transition }) => {
            try {
                const response = await callService('scene', 'turn_on', {
                    entity_id: scene_id,
                    transition
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Scene activated successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error activating scene: ${error.message}`
                    }]
                };
            }
        }
    );

    server.tool(
        "createScene",
        "Creates a new scene with the current states of specified entities.",
        {
            scene_id: z.string().describe("The ID for the new scene"),
            name: z.string().describe("Friendly name for the scene"),
            entities: z.array(z.string()).describe("List of entity IDs to include in the scene"),
            snapshot: z.boolean().optional().describe("Whether to snapshot current entity states")
        },
        async ({ scene_id, name, entities, snapshot }) => {
            try {
                const response = await callService('scene', 'create', {
                    scene_id,
                    name,
                    entities,
                    snapshot: snapshot ?? true
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Scene created successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error creating scene: ${error.message}`
                    }]
                };
            }
        }
    );

    server.tool(
        "deleteScene",
        "Deletes a scene from Home Assistant.",
        {
            scene_id: z.string().describe("The ID of the scene to delete")
        },
        async ({ scene_id }) => {
            try {
                const response = await callService('scene', 'delete', {
                    entity_id: scene_id
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Scene deleted successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error deleting scene: ${error.message}`
                    }]
                };
            }
        }
    );

    server.tool(
        "applyScene",
        "Applies a scene to specific entities without creating a permanent scene.",
        {
            entities: z.record(z.string(), z.any()).describe("Map of entity IDs to their desired states"),
            transition: z.number().optional().describe("Transition time in seconds")
        },
        async ({ entities, transition }) => {
            try {
                const response = await callService('scene', 'apply', {
                    entities,
                    transition
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Scene applied successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error applying scene: ${error.message}`
                    }]
                };
            }
        }
    );
} 