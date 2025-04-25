import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Entity } from "../types/index.js";
import { callHomeAssistantApi, formatErrorMessage } from "../utils/rest-api-utils.js";

export function registerMediaPlayerTools(server: McpServer) {
  server.tool(
    "listMediaPlayers",
    "Lists all media players in Home Assistant with their current state and properties.",
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

  server.tool(
    "controlMediaPlayer",
    "Controls a media player with common commands like play, pause, stop, next, or previous.",
    { 
      entity_id: z.string().describe("Media player entity ID (if doesn't start with 'media_player.', prefix will be added automatically)"),
      command: z.enum(["play", "pause", "stop", "next", "previous"]).describe("Command to execute on the media player"),
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

  server.tool(
    "setVolume",
    "Sets the volume level (0.0 to 1.0) for a specified media player.",
    { 
      entity_id: z.string().describe("Media player entity ID (if doesn't start with 'media_player.', prefix will be added automatically)"),
      volume_level: z.number().min(0).max(1).describe("Volume level to set, from 0.0 (mute) to 1.0 (maximum)"),
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