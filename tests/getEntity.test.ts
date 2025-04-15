import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockEntity = {
  entity_id: 'light.living_room',
  state: 'on',
  attributes: {
    friendly_name: 'Living Room Light',
    brightness: 255,
    rgb_color: [255, 255, 255],
    color_mode: 'rgb'
  },
  last_changed: '2023-01-01T00:00:00Z',
  last_updated: '2023-01-01T00:00:00Z',
  context: {
    id: '01234567890123456789',
    parent_id: null,
    user_id: null
  }
};

// Extract the handler function for testability
async function getEntity(params: { entity_id: string }) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { entity_id } = params;
    
    const response = await axios.get(`${haUrl}/api/states/${entity_id}`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response.data, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error fetching entity ${params.entity_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching entity: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Entity Tools', () => {
  describe('getEntity', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      axiosGetSpy.mockRestore();
    });

    it('should return the requested entity details', async () => {
      axiosGetSpy.mockResolvedValue({ 
        data: mockEntity 
      });
      
      const entityId = 'light.living_room';
      const toolResult = await getEntity({ entity_id: entityId });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult).toEqual(mockEntity);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy.mock.calls[0][0]).toContain(entityId);
    });

    it('should handle entity not found errors', async () => {
      const error = new Error('Entity not found');
      error.name = 'NotFoundError';
      (error as any).response = { status: 404 };
      
      axiosGetSpy.mockRejectedValue(error);
      
      const entityId = 'light.non_existent';
      const toolResult = await getEntity({ entity_id: entityId });
      
      expect(toolResult?.content[0].text).toContain('Error fetching entity:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Network error'));
      
      const entityId = 'light.living_room';
      const toolResult = await getEntity({ entity_id: entityId });
      
      expect(toolResult?.content[0].text).toContain('Error fetching entity:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 