import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/api-utils.js";

export function registerMediaPlayerTools(server: McpServer) {
  server.tool("listMediaPlayers",
    {},
    async () => {
      try {
        const data = await callHomeAssistantApi<Entity[]>('get', '/api/states');
        
        const mediaPlayers = data
          .filter((entity: Entity) => entity.entity_id.startsWith('media_player.'))
          .map((player: Entity) => ({
            id: player.entity_id,
            name: player.attributes.friendly_name || player.entity_id,
            state: player.state,
            volume: player.attributes.volume_level,
            source: player.attributes.source,
            mediaTitle: player.attributes.media_title
          }));
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(mediaPlayers, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, "fetching media players")
          }]
        };
      }
    }
  );

  server.tool("controlMediaPlayer",
    { 
      entity_id: z.string(),
      command: z.enum(["play", "pause", "stop", "next", "previous"]),
    },
    async ({ entity_id, command }) => {
      try {
        if (!entity_id.startsWith('media_player.')) {
          entity_id = `media_player.${entity_id}`;
        }
        
        const response = await callHomeAssistantApi<any>(
          'post',
          `/api/services/media_player/${command}`,
          { entity_id }
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Media player ${command} command sent successfully`,
              details: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `controlling media player ${entity_id}`)
          }]
        };
      }
    }
  );

  server.tool("setVolume",
    { 
      entity_id: z.string(),
      volume_level: z.number().min(0).max(1),
    },
    async ({ entity_id, volume_level }) => {
      try {
        if (!entity_id.startsWith('media_player.')) {
          entity_id = `media_player.${entity_id}`;
        }
        
        const response = await callHomeAssistantApi<any>(
          'post',
          '/api/services/media_player/volume_set',
          { entity_id, volume_level }
        );
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: true,
              message: `Volume set to ${volume_level * 100}%`,
              details: response
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: formatErrorMessage(error, `setting volume for ${entity_id}`)
          }]
        };
      }
    }
  );
} 