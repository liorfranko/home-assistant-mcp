import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const entityId = 'light.living_room';
const newState = 'on';
const attributes = {
  brightness: 255,
  rgb_color: [255, 255, 255]
};

const mockUpdatedEntity = {
  entity_id: entityId,
  state: newState,
  attributes: {
    friendly_name: 'Living Room Light',
    brightness: 255,
    rgb_color: [255, 255, 255],
    color_mode: 'rgb'
  },
  last_changed: '2023-01-01T00:00:00Z',
  last_updated: '2023-01-01T00:00:01Z',
  context: {
    id: '01234567890123456789',
    parent_id: null,
    user_id: null
  }
};

// Extract the handler function for testability
async function updateEntity(params: { entity_id: string, state: string, attributes?: Record<string, any> }) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { entity_id, state, attributes } = params;
    
    const payload: any = {
      state
    };
    
    if (attributes) {
      payload.attributes = attributes;
    }
    
    const response = await axios.post(
      `${haUrl}/api/states/${entity_id}`,
      payload,
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
          message: "Entity updated successfully",
          entity: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error updating entity ${params.entity_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error updating entity: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Entity Tools', () => {
  describe('updateEntity', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should update entity state successfully', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockUpdatedEntity 
      });
      
      const toolResult = await updateEntity({ 
        entity_id: entityId, 
        state: newState 
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.entity).toEqual(mockUpdatedEntity);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify that payload only contains state without attributes
      expect(axiosPostSpy.mock.calls[0][1]).toEqual({
        state: newState
      });
    });

    it('should update entity state with attributes', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockUpdatedEntity 
      });
      
      const toolResult = await updateEntity({ 
        entity_id: entityId, 
        state: newState,
        attributes
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.entity).toEqual(mockUpdatedEntity);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify that payload contains both state and attributes
      expect(axiosPostSpy.mock.calls[0][1]).toEqual({
        state: newState,
        attributes
      });
    });

    it('should handle entity not found errors', async () => {
      const error = new Error('Entity not found');
      error.name = 'NotFoundError';
      (error as any).response = { status: 404 };
      
      axiosPostSpy.mockRejectedValue(error);
      
      const nonExistentEntityId = 'light.non_existent';
      const toolResult = await updateEntity({ 
        entity_id: nonExistentEntityId, 
        state: newState 
      });
      
      expect(toolResult?.content[0].text).toContain('Error updating entity:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Network error'));
      
      const toolResult = await updateEntity({ 
        entity_id: entityId, 
        state: newState 
      });
      
      expect(toolResult?.content[0].text).toContain('Error updating entity:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 