import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockStateUpdateResponse = {
  data: {
    result: "ok",
    message: "Automation state updated"
  }
};

const mockConfigUpdateResponse = {
  data: {
    result: "ok",
    message: "Automation config updated"
  }
};

// Sample automation config update
const sampleConfigUpdate = {
  alias: "Updated Automation Name",
  trigger: {
    platform: "state",
    entity_id: "light.kitchen",
    to: "on"
  }
};

// Extract the handler function for testability
async function updateAutomation({ 
  automation_id, 
  state, 
  config 
}: { 
  automation_id: string; 
  state?: "on" | "off"; 
  config?: any 
}) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    if (!automation_id.startsWith('automation.')) {
      automation_id = `automation.${automation_id}`;
    }
    
    const result: Record<string, any> = {};
    
    // Update state if provided
    if (state) {
      const stateResponse = await axios.post(
        `${haUrl}/api/services/automation/${state}`,
        { entity_id: automation_id },
        {
          headers: {
            Authorization: `Bearer ${haToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      result.stateUpdate = stateResponse.data;
    }
    
    // Update config if provided
    if (config) {
      const configResponse = await axios.post(
        `${haUrl}/api/config/automation/config/${automation_id.replace('automation.', '')}`,
        config,
        {
          headers: {
            Authorization: `Bearer ${haToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      result.configUpdate = configResponse.data;
    }
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          success: true,
          message: "Automation updated successfully",
          details: result
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error updating automation ${automation_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error updating automation: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('updateAutomation', () => {
    // Use any type to avoid TypeScript issues
    let axiosPostSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.post
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosPostSpy.mockRestore();
    });

    it('should update automation state', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue(mockStateUpdateResponse);
      
      // Execute handler - turn on an automation
      const toolResult = await updateAutomation({
        automation_id: 'test_automation',
        state: 'on'
      });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe("Automation updated successfully");
      expect(parsedResult.details.stateUpdate).toEqual(mockStateUpdateResponse.data);
      
      // Verify axios was called with the right parameters
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/automation/on'),
        { entity_id: 'automation.test_automation' },
        expect.any(Object)
      );
    });

    it('should update automation config', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue(mockConfigUpdateResponse);
      
      // Execute handler - update config
      const toolResult = await updateAutomation({
        automation_id: 'test_automation',
        config: sampleConfigUpdate
      });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.details.configUpdate).toEqual(mockConfigUpdateResponse.data);
      
      // Verify axios was called with the right parameters
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/config/automation/config/test_automation'),
        sampleConfigUpdate,
        expect.any(Object)
      );
    });

    it('should update both state and config', async () => {
      // Mock sequential calls to axios.post
      axiosPostSpy
        .mockResolvedValueOnce(mockStateUpdateResponse)
        .mockResolvedValueOnce(mockConfigUpdateResponse);
      
      // Execute handler - update both state and config
      const toolResult = await updateAutomation({
        automation_id: 'test_automation',
        state: 'off',
        config: sampleConfigUpdate
      });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success with both updates
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.details.stateUpdate).toEqual(mockStateUpdateResponse.data);
      expect(parsedResult.details.configUpdate).toEqual(mockConfigUpdateResponse.data);
      
      // Verify axios was called twice with the right parameters
      expect(axiosPostSpy).toHaveBeenCalledTimes(2);
      expect(axiosPostSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/api/services/automation/off'),
        { entity_id: 'automation.test_automation' },
        expect.any(Object)
      );
      expect(axiosPostSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/api/config/automation/config/test_automation'),
        sampleConfigUpdate,
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosPostSpy.mockRejectedValue(new Error('Automation not found'));
      
      // Execute handler
      const toolResult = await updateAutomation({
        automation_id: 'nonexistent_automation',
        state: 'on'
      });
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error updating automation:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 