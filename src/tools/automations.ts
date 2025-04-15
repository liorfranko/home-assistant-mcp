// @ts-ignore
const zod = require("zod");
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerAutomationTools(server: McpServer) {
  server.tool("listAutomations",
    {},
    async () => {
      try {
        const data = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        
        const automations = data
          .filter((entity: Entity) => entity.entity_id.startsWith('automation.'))
          .map((automation: Entity) => ({
            id: automation.entity_id,
            name: automation.attributes.friendly_name || automation.entity_id,
            state: automation.state,
            lastTriggered: automation.attributes.last_triggered || 'Never'
          }));
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(automations, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching automations:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "fetching automations")
          }]
        };
      }
    }
  );

  server.tool("getAutomation",
    { automation_id: zod.string() },
    async ({ automation_id }) => {
      try {
        if (!automation_id.startsWith('automation.')) {
          automation_id = `automation.${automation_id}`;
        }
        
        const automation = await callHomeAssistantApi<Entity>('get', `/api/states/${automation_id}`);
        
        const formattedAutomation = {
          id: automation.entity_id,
          name: automation.attributes.friendly_name || automation.entity_id,
          state: automation.state,
          lastTriggered: automation.attributes.last_triggered || 'Never',
          attributes: automation.attributes
        };
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(formattedAutomation, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error fetching automation ${automation_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `fetching automation ${automation_id}`)
          }]
        };
      }
    }
  );

  server.tool("createAutomation", 
    { 
      alias: zod.string(),
      description: zod.string().optional(),
      trigger: zod.any(),
      condition: zod.any().optional(),
      action: zod.any()
    },
    async ({ alias, description, trigger, condition, action }) => {
      try {
        const automationConfig: Record<string, any> = {
          alias,
          description,
          trigger,
          condition,
          action
        };
        
        // Remove undefined values
        Object.keys(automationConfig).forEach(key => 
          automationConfig[key] === undefined && delete automationConfig[key]
        );
        
        const result = await callHomeAssistantApi<any>('post', 
          '/api/services/automation/reload', 
          { automation_config: automationConfig }
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              success: true, 
              message: "Automation created successfully",
              details: result
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error creating automation:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "creating automation")
          }]
        };
      }
    }
  );

  server.tool("updateAutomation",
    {
      automation_id: zod.string(),
      state: zod.enum(["on", "off"]).optional(),
      config: zod.any().optional()
    },
    async ({ automation_id, state, config }) => {
      try {
        if (!automation_id.startsWith('automation.')) {
          automation_id = `automation.${automation_id}`;
        }
        
        const result: Record<string, any> = {};
        
        // Update state if provided
        if (state) {
          const stateResponse = await callHomeAssistantApi<any>(
            'post',
            `/api/services/automation/${state}`,
            { entity_id: automation_id }
          );
          result.stateUpdate = stateResponse;
        }
        
        // Update config if provided
        if (config) {
          const configResponse = await callHomeAssistantApi<any>(
            'post',
            `/api/config/automation/config/${automation_id.replace('automation.', '')}`,
            config
          );
          result.configUpdate = configResponse;
        }
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: "Automation updated successfully",
              details: result
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error updating automation ${automation_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `updating automation ${automation_id}`)
          }]
        };
      }
    }
  );

  server.tool("deleteAutomation",
    { automation_id: zod.string() },
    async ({ automation_id }) => {
      try {
        if (!automation_id.startsWith('automation.')) {
          automation_id = `automation.${automation_id}`;
        }
        
        const response = await callHomeAssistantApi<any>(
          'delete',
          `/api/config/automation/config/${automation_id.replace('automation.', '')}`
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: "Automation deleted successfully",
              details: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error deleting automation ${automation_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `deleting automation ${automation_id}`)
          }]
        };
      }
    }
  );
} 