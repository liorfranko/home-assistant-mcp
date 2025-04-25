import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { callService } from '../utils/index.js';

export function registerThemeTools(server: McpServer) {
    server.tool(
        "setTheme",
        "Sets the active theme for Home Assistant.",
        {
            theme_name: z.string().describe("The name of the theme to activate"),
            mode: z.enum(['light', 'dark']).optional().describe("Theme mode (light or dark)")
        },
        async ({ theme_name, mode }) => {
            try {
                const response = await callService('frontend', 'set_theme', {
                    name: theme_name,
                    mode
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Theme set successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error setting theme: ${error.message}`
                    }]
                };
            }
        }
    );

    server.tool(
        "reloadThemes",
        "Reloads all themes from storage.",
        {
            random_string: z.string().describe("Dummy parameter for no-parameter tools")
        },
        async () => {
            try {
                const response = await callService('frontend', 'reload_themes', {});
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Themes reloaded successfully",
                            details: response
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error reloading themes: ${error.message}`
                    }]
                };
            }
        }
    );
} 