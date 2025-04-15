import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Expected successful response
const mockSuccessResponse = { 
  success: true, 
  message: "Command executed successfully" 
};

// Extract the handler function for testability
async function controlMediaPlayer(params: { entity_id: string, command: string }) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { entity_id, command } = params;
    
    let entityId = entity_id;
    if (!entityId.startsWith('media_player.')) {
      entityId = `media_player.${entityId}`;
    }
    
    const response = await axios.post(
      `${haUrl}/api/services/media_player/${command}`,
      { entity_id: entityId },
      {
        headers: {
          Authorization: `Bearer ${haToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          success: true,
          message: `Media player ${command} command sent successfully`,
          details: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error controlling media player ${params.entity_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error controlling media player ${params.entity_id}: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Media Player Tools', () => {
  describe('controlMediaPlayer', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should control a media player with play command', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const toolResult = await controlMediaPlayer({
        entity_id: 'media_player.living_room',
        command: 'play'
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe('Media player play command sent successfully');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/media_player/play'),
        { entity_id: 'media_player.living_room' },
        expect.any(Object)
      );
    });

    it('should prepend media_player. to entity_id if needed', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const toolResult = await controlMediaPlayer({
        entity_id: 'bedroom',
        command: 'pause'
      });
      
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/media_player/pause'),
        { entity_id: 'media_player.bedroom' },
        expect.any(Object)
      );
    });

    it('should handle different commands correctly', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const commands = ['play', 'pause', 'stop', 'next', 'previous'];
      
      for (const command of commands) {
        await controlMediaPlayer({
          entity_id: 'media_player.living_room',
          command
        });
        
        expect(axiosPostSpy).toHaveBeenCalledWith(
          expect.stringContaining(`/api/services/media_player/${command}`),
          { entity_id: 'media_player.living_room' },
          expect.any(Object)
        );
      }
      
      expect(axiosPostSpy).toHaveBeenCalledTimes(commands.length);
    });

    it('should handle errors gracefully', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Server error'));
      
      const toolResult = await controlMediaPlayer({
        entity_id: 'media_player.living_room',
        command: 'play'
      });
      
      expect(toolResult?.content[0].text).toContain('Error controlling media player');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 