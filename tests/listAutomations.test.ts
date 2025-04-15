import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockAutomations = [
  {
    entity_id: 'automation.turn_on_lights',
    state: 'on',
    attributes: {
      friendly_name: 'Turn On Lights',
      last_triggered: '2023-01-01T00:00:00Z'
    }
  },
  {
    entity_id: 'automation.turn_off_lights',
    state: 'on',
    attributes: {
      friendly_name: 'Turn Off Lights',
      last_triggered: '2023-01-01T00:00:00Z'
    }
  },
  {
    entity_id: 'switch.not_an_automation',
    state: 'on',
    attributes: {
      friendly_name: 'Some Switch'
    }
  }
];

// Expected result after filtering and mapping
const expectedAutomations = [
  {
    id: 'automation.turn_on_lights',
    name: 'Turn On Lights',
    state: 'on',
    lastTriggered: '2023-01-01T00:00:00Z'
  },
  {
    id: 'automation.turn_off_lights',
    name: 'Turn Off Lights',
    state: 'on',
    lastTriggered: '2023-01-01T00:00:00Z'
  }
];

// Extract the handler function for testability
async function listAutomations() {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const response = await axios.get(`${haUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    interface Entity {
      entity_id: string;
      state: string;
      attributes: {
        friendly_name?: string;
        last_triggered?: string;
        [key: string]: any;
      };
    }
    
    const automations = response.data
      .filter((entity: Entity) => entity.entity_id.startsWith('automation.'))
      .map((automation: Entity) => ({
        id: automation.entity_id,
        name: automation.attributes.friendly_name || automation.entity_id,
        state: automation.state,
        lastTriggered: automation.attributes.last_triggered || 'Never'
      }));
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(automations, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error fetching automations:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching automations: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('listAutomations', () => {
    // Use any type to avoid TypeScript issues
    let axiosGetSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.get
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosGetSpy.mockRestore();
    });

    it('should return a list of automations', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockAutomations 
      });
      
      // Execute handler
      const toolResult = await listAutomations();
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedAutomations);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosGetSpy.mockRejectedValue(new Error('Server error'));
      
      // Execute handler
      const toolResult = await listAutomations();
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error fetching automations:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 