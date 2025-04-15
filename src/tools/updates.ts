// @ts-ignore
const zod = require("zod");
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity, UpdateEntity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerUpdateTools(server: McpServer) {
  server.tool("checkUpdates",
    {},
    async () => {
      try {
        // Get all entities
        const entities = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        
        // Filter for update entities
        const updateEntities = entities.filter(entity => 
          entity.entity_id.startsWith('update.')
        ) as UpdateEntity[];
        
        // Separate system updates from other updates
        const systemUpdates = updateEntities.filter(entity => 
          entity.entity_id.includes('home_assistant') || 
          entity.entity_id.includes('supervisor') ||
          entity.entity_id.includes('operating_system')
        );
        
        const addonUpdates = updateEntities.filter(entity => 
          !entity.entity_id.includes('home_assistant') && 
          !entity.entity_id.includes('supervisor') &&
          !entity.entity_id.includes('operating_system') &&
          entity.state === 'on'
        );
        
        const formatUpdateEntity = (entity: UpdateEntity) => ({
          id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          currentVersion: entity.attributes.installed_version,
          latestVersion: entity.attributes.latest_version,
          releaseUrl: entity.attributes.release_url || null,
          state: entity.state
        });
        
        const updateInfo = {
          systemUpdates: systemUpdates.map(formatUpdateEntity),
          addonUpdates: addonUpdates.map(formatUpdateEntity)
        };
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(updateInfo, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error checking for updates:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "checking for updates")
          }]
        };
      }
    }
  );

  server.tool("getUpdateDetails",
    { 
      update_type: zod.enum(["core", "supervisor", "addon"]), 
      addon_slug: zod.string().optional()
    },
    async ({ update_type, addon_slug }) => {
      try {
        // Map update_type to corresponding entity_id prefix
        let entityIdPrefix = '';
        switch (update_type) {
          case "core":
            entityIdPrefix = 'update.home_assistant_core';
            break;
          case "supervisor":
            entityIdPrefix = 'update.home_assistant_supervisor';
            break;
          case "addon":
            if (!addon_slug) {
              return {
                content: [{ 
                  type: "text", 
                  text: "Addon slug is required when checking addon update details."
                }]
              };
            }
            break;
        }
        
        // Get all entities
        const entities = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        const updateEntities = entities.filter(entity => 
          entity.entity_id.startsWith('update.')
        ) as UpdateEntity[];
        
        // Find the specific entity we're looking for
        let entity: UpdateEntity | undefined;
        if (update_type === "addon" && addon_slug) {
          // For addons, we need to find the entity that contains the addon slug
          entity = updateEntities.find(e => 
            e.entity_id.includes(addon_slug.replace('-', '_'))
          );
        } else {
          // For core/supervisor, we can use the prefix
          entity = updateEntities.find(e => 
            e.entity_id.startsWith(entityIdPrefix)
          );
        }
        
        if (!entity) {
          return {
            content: [{ 
              type: "text", 
              text: `No update entity found for ${update_type}${addon_slug ? ` (${addon_slug})` : ''}`
            }]
          };
        }
        
        // Format the update details
        const updateDetails = {
          type: update_type,
          entity_id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          current_version: entity.attributes.installed_version,
          latest_version: entity.attributes.latest_version,
          update_available: entity.state === 'on',
          release_url: entity.attributes.release_url || null,
          release_summary: entity.attributes.release_summary || "No release summary available",
        };
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(updateDetails, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error getting update details for ${update_type}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `getting update details for ${update_type}`)
          }]
        };
      }
    }
  );

  server.tool("installUpdates",
    { update_all: zod.boolean().optional() },
    async ({ update_all = true }) => {
      try {
        // Get all entities
        const entities = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        
        // Filter for update entities that have updates available (state is "on")
        const updateEntities = entities.filter(entity => 
          entity.entity_id.startsWith('update.') && 
          entity.state === 'on'
        ) as UpdateEntity[];
        
        type UpdateResult = {
          success: boolean;
          name: string;
          details: {
            installed_version: string;
            latest_version: string;
          };
        };
        
        const updates: string[] = [];
        const results: Record<string, UpdateResult> = {};
        
        // Only simulate update installation in dry-run mode due to authentication limitations
        // In a real implementation, this would use the update service to install updates
        
        if (update_all) {
          // Simulate installing all available updates
          for (const entity of updateEntities) {
            updates.push(entity.entity_id);
            results[entity.entity_id] = {
              success: true,
              name: entity.attributes.friendly_name || entity.entity_id,
              details: {
                installed_version: entity.attributes.installed_version,
                latest_version: entity.attributes.latest_version
              }
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                success: true,
                message: `Found ${updates.length} components that need updates`,
                note: "Update installation was simulated. To actually install updates, use the Home Assistant UI.",
                components: updates,
                results: results
              }, null, 2)
            }]
          };
        } else {
          // Only simulate updating Home Assistant Core and OS
          const coreEntity = updateEntities.find(entity => 
            entity.entity_id === 'update.home_assistant_core_update'
          );
          
          const osEntity = updateEntities.find(entity => 
            entity.entity_id === 'update.home_assistant_operating_system_update'
          );
          
          if (coreEntity) {
            updates.push(coreEntity.entity_id);
            results[coreEntity.entity_id] = {
              success: true,
              name: coreEntity.attributes.friendly_name || coreEntity.entity_id,
              details: {
                installed_version: coreEntity.attributes.installed_version,
                latest_version: coreEntity.attributes.latest_version
              }
            };
          }
          
          if (osEntity) {
            updates.push(osEntity.entity_id);
            results[osEntity.entity_id] = {
              success: true,
              name: osEntity.attributes.friendly_name || osEntity.entity_id,
              details: {
                installed_version: osEntity.attributes.installed_version,
                latest_version: osEntity.attributes.latest_version
              }
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                success: true,
                message: `Found ${updates.length} core components that need updates`,
                note: "Update installation was simulated. To actually install updates, use the Home Assistant UI.",
                components: updates,
                results: results
              }, null, 2)
            }]
          };
        }
      } catch (error: any) {
        console.error("Error processing updates:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "processing updates")
          }]
        };
      }
    }
  );
} 