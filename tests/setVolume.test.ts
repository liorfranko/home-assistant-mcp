import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Expected successful response
const mockSuccessResponse = { 
  success: true, 
  message: "Volume set successfully" 
};

// Extract the handler function for testability
async function setVolume(params: { entity_id: string, volume_level: number }) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { entity_id, volume_level } = params;
    
    let entityId = entity_id;
    if (!entityId.startsWith('media_player.')) {
      entityId = `media_player.${entityId}`;
    }
    
    const response = await axios.post(
      `${haUrl}/api/services/media_player/volume_set`,
      { entity_id: entityId, volume_level },
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
          message: `Volume set to ${volume_level * 100}%`,
          details: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error setting volume for ${params.entity_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error setting volume for ${params.entity_id}: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Media Player Tools', () => {
  describe('setVolume', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should set volume for a media player', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const volume = 0.5;
      const toolResult = await setVolume({
        entity_id: 'media_player.living_room',
        volume_level: volume
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe('Volume set to 50%');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/media_player/volume_set'),
        { 
          entity_id: 'media_player.living_room',
          volume_level: volume 
        },
        expect.any(Object)
      );
    });

    it('should prepend media_player. to entity_id if needed', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const toolResult = await setVolume({
        entity_id: 'bedroom',
        volume_level: 0.75
      });
      
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/media_player/volume_set'),
        { 
          entity_id: 'media_player.bedroom',
          volume_level: 0.75 
        },
        expect.any(Object)
      );
    });

    it('should handle various volume levels correctly', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const volumes = [0, 0.25, 0.5, 0.75, 1];
      
      for (const volume of volumes) {
        await setVolume({
          entity_id: 'media_player.living_room',
          volume_level: volume
        });
        
        expect(axiosPostSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/services/media_player/volume_set'),
          { 
            entity_id: 'media_player.living_room',
            volume_level: volume 
          },
          expect.any(Object)
        );
      }
      
      expect(axiosPostSpy).toHaveBeenCalledTimes(volumes.length);
    });

    it('should format percentage message correctly', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockSuccessResponse 
      });
      
      const testCases = [
        { volume: 0, expected: '0%' },
        { volume: 0.25, expected: '25%' },
        { volume: 0.5, expected: '50%' },
        { volume: 1, expected: '100%' }
      ];
      
      for (const { volume, expected } of testCases) {
        const toolResult = await setVolume({
          entity_id: 'media_player.living_room',
          volume_level: volume
        });
        
        const resultText = toolResult?.content[0].text;
        const parsedResult = JSON.parse(resultText as string);
        
        expect(parsedResult.message).toBe(`Volume set to ${expected}`);
      }
    });

    it('should handle errors gracefully', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Server error'));
      
      const toolResult = await setVolume({
        entity_id: 'media_player.living_room',
        volume_level: 0.5
      });
      
      expect(toolResult?.content[0].text).toContain('Error setting volume for');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 