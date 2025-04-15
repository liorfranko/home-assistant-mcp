import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockAutomation = {
  entity_id: 'automation.test_automation',
  state: 'on',
  attributes: {
    friendly_name: 'Test Automation',
    last_triggered: '2023-01-01T00:00:00Z',
    id: '12345',
    mode: 'single'
  }
};

// Expected result after formatting
const expectedAutomation = {
  id: 'automation.test_automation',
  name: 'Test Automation',
  state: 'on',
  lastTriggered: '2023-01-01T00:00:00Z',
  attributes: {
    friendly_name: 'Test Automation',
    last_triggered: '2023-01-01T00:00:00Z',
    id: '12345',
    mode: 'single'
  }
};

// Extract the handler function for testability
async function getAutomation(automation_id: string) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    if (!automation_id.startsWith('automation.')) {
      automation_id = `automation.${automation_id}`;
    }
    
    const response = await axios.get(`${haUrl}/api/states/${automation_id}`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const automation = response.data;
    
    const formattedAutomation = {
      id: automation.entity_id,
      name: automation.attributes.friendly_name || automation.entity_id,
      state: automation.state,
      lastTriggered: automation.attributes.last_triggered || 'Never',
      attributes: automation.attributes
    };
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(formattedAutomation, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error fetching automation ${automation_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching automation: ${error.message}` 
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('getAutomation', () => {
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

    it('should return a single automation', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockAutomation 
      });
      
      // Execute handler
      const toolResult = await getAutomation('test_automation');
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedAutomation);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/states/automation.test_automation'),
        expect.any(Object)
      );
    });

    it('should handle IDs already prefixed with automation.', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockAutomation 
      });
      
      // Execute handler with full prefix
      const toolResult = await getAutomation('automation.test_automation');
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedAutomation);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/states/automation.test_automation'),
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosGetSpy.mockRejectedValue(new Error('Automation not found'));
      
      // Execute handler
      const toolResult = await getAutomation('nonexistent_automation');
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error fetching automation:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 