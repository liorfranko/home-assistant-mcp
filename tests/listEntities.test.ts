import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockEntities = [
  {
    entity_id: 'light.living_room',
    state: 'on',
    attributes: {
      friendly_name: 'Living Room Light',
      brightness: 255
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'switch.kitchen',
    state: 'off',
    attributes: {
      friendly_name: 'Kitchen Switch'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'light.bedroom',
    state: 'off',
    attributes: {
      friendly_name: 'Bedroom Light',
      brightness: 0
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  }
];

// Expected result after mapping
const expectedEntities = [
  {
    entity_id: 'light.living_room',
    state: 'on',
    attributes: {
      friendly_name: 'Living Room Light',
      brightness: 255
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'switch.kitchen',
    state: 'off',
    attributes: {
      friendly_name: 'Kitchen Switch'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'light.bedroom',
    state: 'off',
    attributes: {
      friendly_name: 'Bedroom Light',
      brightness: 0
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  }
];

// Expected result when filtered by domain 'light'
const expectedLightEntities = [
  {
    entity_id: 'light.living_room',
    state: 'on',
    attributes: {
      friendly_name: 'Living Room Light',
      brightness: 255
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  },
  {
    entity_id: 'light.bedroom',
    state: 'off',
    attributes: {
      friendly_name: 'Bedroom Light',
      brightness: 0
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:00Z'
  }
];

// Extract the handler function for testability
async function listEntities(params: { domain?: string } = {}) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { domain } = params;
    
    const response = await axios.get(`${haUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    let entities = response.data.map((entity: any) => ({
      entity_id: entity.entity_id,
      state: entity.state,
      attributes: entity.attributes,
      last_changed: entity.last_changed,
      last_updated: entity.last_updated
    }));
    
    // Filter by domain if provided
    if (domain) {
      entities = entities.filter((entity: any) => 
        entity.entity_id.startsWith(`${domain}.`)
      );
    }
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(entities, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error fetching entities:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching entities: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Entity Tools', () => {
  describe('listEntities', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      axiosGetSpy.mockRestore();
    });

    it('should return all entities when no domain is specified', async () => {
      axiosGetSpy.mockResolvedValue({ 
        data: mockEntities 
      });
      
      const toolResult = await listEntities();
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult).toEqual(expectedEntities);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should filter entities by domain when specified', async () => {
      axiosGetSpy.mockResolvedValue({ 
        data: mockEntities 
      });
      
      const toolResult = await listEntities({ domain: 'light' });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult).toEqual(expectedLightEntities);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Server error'));
      
      const toolResult = await listEntities();
      
      expect(toolResult?.content[0].text).toContain('Error fetching entities:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 