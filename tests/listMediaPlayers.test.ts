import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockMediaPlayers = [
  {
    entity_id: 'media_player.living_room',
    state: 'playing',
    attributes: {
      friendly_name: 'Living Room Speaker',
      volume_level: 0.5,
      source: 'Spotify',
      media_title: 'Test Song'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'media_player.bedroom',
    state: 'paused',
    attributes: {
      friendly_name: 'Bedroom Speaker',
      volume_level: 0.3,
      source: 'YouTube Music',
      media_title: 'Paused Song'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'light.kitchen',
    state: 'on',
    attributes: {
      friendly_name: 'Kitchen Light'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  }
];

// Expected result after filtering and mapping
const expectedMediaPlayers = [
  {
    id: 'media_player.living_room',
    name: 'Living Room Speaker',
    state: 'playing',
    volume: 0.5,
    source: 'Spotify',
    mediaTitle: 'Test Song'
  },
  {
    id: 'media_player.bedroom',
    name: 'Bedroom Speaker',
    state: 'paused',
    volume: 0.3,
    source: 'YouTube Music',
    mediaTitle: 'Paused Song'
  }
];

// Extract the handler function for testability
async function listMediaPlayers() {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const response = await axios.get(`${haUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const mediaPlayers = response.data
      .filter((entity: any) => entity.entity_id.startsWith('media_player.'))
      .map((player: any) => ({
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
    console.error("Error fetching media players:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching media players: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Media Player Tools', () => {
  describe('listMediaPlayers', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      axiosGetSpy.mockRestore();
    });

    it('should return all media players', async () => {
      axiosGetSpy.mockResolvedValue({ 
        data: mockMediaPlayers 
      });
      
      const toolResult = await listMediaPlayers();
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult).toEqual(expectedMediaPlayers);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/states'),
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Server error'));
      
      const toolResult = await listMediaPlayers();
      
      expect(toolResult?.content[0].text).toContain('Error fetching media players:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 