import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerEntityTools(server: McpServer) {
  server.tool(
    "listEntities",
    "Lists all entities from Home Assistant, optionally filtered by domain (e.g., light, switch, sensor).",
    { 
      domain: z.string().optional().describe("Filter entities by domain (e.g., light, switch, sensor)")
    },
    async ({ domain }) => {
      try {
        const entities = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        
        let filteredEntities = entities.map((entity: Entity) => ({
          entity_id: entity.entity_id,
          state: entity.state,
          attributes: entity.attributes,
          last_changed: entity.last_changed,
          last_updated: entity.last_updated
        }));
        
        // Filter by domain if provided
        if (domain) {
          filteredEntities = filteredEntities.filter(entity => 
            entity.entity_id.startsWith(`${domain}.`)
          );
        }
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(filteredEntities, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error fetching entities:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "fetching entities")
          }]
        };
      }
    }
  );

  server.tool(
    "getEntity",
    "Retrieves detailed information about a specific entity by its ID.",
    { 
      entity_id: z.string().describe("The ID of the entity to retrieve information about")
    },
    async ({ entity_id }) => {
      try {
        const entity = await callHomeAssistantApi<Entity>('get', `/api/states/${entity_id}`);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(entity, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error fetching entity ${entity_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `fetching entity ${entity_id}`)
          }]
        };
      }
    }
  );

  server.tool(
    "updateEntity",
    "Updates the state and optionally the attributes of an entity in Home Assistant.",
    {
      entity_id: z.string().describe("The ID of the entity to update"),
      state: z.string().describe("The new state to set for the entity"),
      attributes: z.record(z.any()).optional().describe("Optional attributes to update for the entity")
    },
    async ({ entity_id, state, attributes }) => {
      try {
        const payload: any = { state };
        
        if (attributes) {
          payload.attributes = attributes;
        }
        
        const response = await callHomeAssistantApi<Entity>(
          'post',
          `/api/states/${entity_id}`,
          payload
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: "Entity updated successfully",
              entity: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error updating entity ${entity_id}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `updating entity ${entity_id}`)
          }]
        };
      }
    }
  );

  server.tool(
    "callService",
    "Calls any Home Assistant service with optional service data and target entities, devices, or areas.",
    {
      domain: z.string().describe("The domain of the service to call (e.g., light, switch, automation)"),
      service: z.string().describe("The service to call within the specified domain (e.g., turn_on, turn_off)"),
      service_data: z.record(z.any()).optional().describe("Optional data to pass to the service call"),
      target: z.object({
        entity_id: z.string().or(z.array(z.string())).optional().describe("Entity ID(s) to target"),
        device_id: z.string().or(z.array(z.string())).optional().describe("Device ID(s) to target"),
        area_id: z.string().or(z.array(z.string())).optional().describe("Area ID(s) to target")
      }).optional().describe("Optional targeting information for the service call")
    },
    async ({ domain, service, service_data, target }) => {
      try {
        const payload: any = {};
        
        if (service_data) {
          Object.assign(payload, service_data);
        }
        
        if (target) {
          Object.assign(payload, target);
        }
        
        const response = await callHomeAssistantApi<any>(
          'post',
          `/api/services/${domain}/${service}`,
          payload
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Service ${domain}.${service} called successfully`,
              result: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error calling service ${domain}.${service}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `calling service ${domain}.${service}`)
          }]
        };
      }
    }
  );
} 