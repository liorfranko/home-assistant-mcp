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
} 