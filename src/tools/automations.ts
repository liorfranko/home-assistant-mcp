import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerAutomationTools(server: McpServer) {
  server.tool(
    "listAutomations",
    "Retrieves a list of all automations from Home Assistant with their current state and when they were last triggered.",
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

  server.tool(
    "getAutomation",
    "Gets detailed information about a specific automation by its ID.",
    { 
      automation_id: z.string().describe("Automation ID (required for update, delete, and duplicate)") 
    },
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

  server.tool(
    "createAutomation",
    "Creates a new automation in Home Assistant with the specified configuration.",
    { 
      alias: z.string().describe("Friendly name for the automation"),
      description: z.string().optional().describe("Description of what the automation does"),
      trigger: z.any().describe("List of triggers that will initiate the automation"),
      condition: z.any().optional().describe("List of conditions that must be true for the automation to run"),
      action: z.any().describe("List of actions to perform when the automation is triggered")
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

  server.tool(
    "updateAutomation",
    "Updates an existing automation by changing its state (on/off) or configuration.",
    {
      automation_id: z.string().describe("Automation ID (if doesn't start with 'automation.', prefix will be added automatically)"),
      state: z.enum(["on", "off"]).optional().describe("New state for the automation ('on' or 'off')"),
      config: z.any().optional().describe("New configuration for the automation")
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

  server.tool(
    "deleteAutomation",
    "Permanently removes an automation from Home Assistant by its ID.",
    { 
      automation_id: z.string().describe("Automation ID to delete (if doesn't start with 'automation.', prefix will be added automatically)") 
    },
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