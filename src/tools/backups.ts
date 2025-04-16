import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Backup } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerBackupTools(server: McpServer) {
  server.tool(
    "listBackups",
    "Lists all available Home Assistant backups (snapshots) with their details.",
    {},
    async () => {
      try {
        // Get all backups
        const backups = await callHomeAssistantApi<Backup[]>('get', '/api/hassio/snapshots');
        
        if (!backups || !Array.isArray(backups)) {
          return {
            content: [{ 
              type: "text", 
              text: "No backups found or unexpected response format from Home Assistant."
            }]
          };
        }
        
        const formattedBackups = backups.map(backup => ({
          slug: backup.slug,
          name: backup.name,
          date: backup.date,
          size: backup.size,
          type: backup.type,
          protected: backup.protected,
          location: backup.location,
          content: {
            homeassistant: backup.content.homeassistant,
            addonsCount: backup.content.addons.length,
            foldersCount: backup.content.folders.length
          }
        }));
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              count: formattedBackups.length,
              backups: formattedBackups
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error listing backups:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "listing backups")
          }]
        };
      }
    }
  );

  server.tool(
    "getBackupDetails",
    "Gets detailed information about a specific backup by its slug.",
    { 
      backup_slug: z.string().describe("The slug identifier of the backup")
    },
    async ({ backup_slug }) => {
      try {
        // Get specific backup details
        const backupDetails = await callHomeAssistantApi<Backup>('get', `/api/hassio/snapshots/${backup_slug}/info`);
        
        if (!backupDetails) {
          return {
            content: [{ 
              type: "text", 
              text: `No backup found with slug: ${backup_slug}`
            }]
          };
        }
        
        const formattedDetails = {
          slug: backupDetails.slug,
          name: backupDetails.name,
          date: backupDetails.date,
          size: backupDetails.size,
          type: backupDetails.type,
          protected: backupDetails.protected,
          location: backupDetails.location,
          content: {
            homeassistant: backupDetails.content.homeassistant,
            addons: backupDetails.content.addons,
            folders: backupDetails.content.folders
          }
        };
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(formattedDetails, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error getting backup details for ${backup_slug}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `getting backup details for ${backup_slug}`)
          }]
        };
      }
    }
  );

  server.tool(
    "createBackup",
    "Creates a new Home Assistant backup with options for full or partial backups.",
    { 
      name: z.string().describe("Friendly name for the backup"),
      password: z.string().optional().describe("Optional password to protect the backup"),
      include_homeassistant: z.boolean().optional().default(true).describe("Whether to include Home Assistant configuration in the backup"),
      include_addons: z.array(z.string()).optional().describe("List of addon slugs to include in the backup"),
      include_folders: z.array(z.string()).optional().describe("List of folders to include in the backup")
    },
    async ({ name, password, include_homeassistant = true, include_addons, include_folders }) => {
      try {
        const backupData: Record<string, any> = {
          name,
          password,
          homeassistant: include_homeassistant
        };
        
        // If addons are specified, include them
        if (include_addons && include_addons.length > 0) {
          backupData.addons = include_addons;
        }
        
        // If folders are specified, include them
        if (include_folders && include_folders.length > 0) {
          backupData.folders = include_folders;
        }
        
        // Create backup
        const result = await callHomeAssistantApi<{slug: string}>('post', '/api/hassio/snapshots/new/partial', backupData);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Backup "${name}" created successfully`,
              slug: result.slug,
              details: {
                name,
                type: include_addons || include_folders ? "partial" : "full",
                protected: !!password
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error("Error creating backup:", error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "creating backup")
          }]
        };
      }
    }
  );

  server.tool(
    "deleteBackup",
    "Permanently removes a backup from Home Assistant by its slug.",
    { 
      backup_slug: z.string().describe("The slug identifier of the backup to delete")
    },
    async ({ backup_slug }) => {
      try {
        // Delete backup
        await callHomeAssistantApi('delete', `/api/hassio/snapshots/${backup_slug}`);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Backup with slug "${backup_slug}" deleted successfully`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error deleting backup ${backup_slug}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `deleting backup ${backup_slug}`)
          }]
        };
      }
    }
  );

  server.tool(
    "restoreBackup",
    "Restores a Home Assistant backup with options for full or partial restoration.",
    { 
      backup_slug: z.string().describe("The slug identifier of the backup to restore"),
      password: z.string().optional().describe("Password for the backup, if it is protected"),
      restore_homeassistant: z.boolean().optional().default(true).describe("Whether to restore Home Assistant configuration"),
      restore_addons: z.array(z.string()).optional().describe("List of addon slugs to restore"),
      restore_folders: z.array(z.string()).optional().describe("List of folders to restore")
    },
    async ({ backup_slug, password, restore_homeassistant = true, restore_addons, restore_folders }) => {
      try {
        const restoreData: Record<string, any> = {
          password,
          homeassistant: restore_homeassistant
        };
        
        // If addons are specified, include them
        if (restore_addons && restore_addons.length > 0) {
          restoreData.addons = restore_addons;
        }
        
        // If folders are specified, include them
        if (restore_folders && restore_folders.length > 0) {
          restoreData.folders = restore_folders;
        }
        
        // Restore backup
        await callHomeAssistantApi('post', `/api/hassio/snapshots/${backup_slug}/restore/partial`, restoreData);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Backup with slug "${backup_slug}" restored successfully`,
              details: {
                homeassistant: restore_homeassistant,
                addons: restore_addons || "all",
                folders: restore_folders || "all"
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        console.error(`Error restoring backup ${backup_slug}:`, error);
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `restoring backup ${backup_slug}`)
          }]
        };
      }
    }
  );
} 