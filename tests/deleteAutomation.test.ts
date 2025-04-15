import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockDeleteResponse = {
  data: {
    result: "ok",
    message: "Automation deleted successfully"
  }
};

// Extract the handler function for testability
async function deleteAutomation(automation_id: string) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    if (!automation_id.startsWith('automation.')) {
      automation_id = `automation.${automation_id}`;
    }
    
    const response = await axios.delete(
      `${haUrl}/api/config/automation/config/${automation_id.replace('automation.', '')}`,
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
          message: "Automation deleted successfully",
          details: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error deleting automation ${automation_id}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error deleting automation: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('deleteAutomation', () => {
    // Use any type to avoid TypeScript issues
    let axiosDeleteSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.delete
      axiosDeleteSpy = jest.spyOn(axios, 'delete');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosDeleteSpy.mockRestore();
    });

    it('should delete an automation successfully', async () => {
      // Mock the axios.delete implementation
      axiosDeleteSpy.mockResolvedValue(mockDeleteResponse);
      
      // Execute handler
      const toolResult = await deleteAutomation('test_automation');
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe("Automation deleted successfully");
      expect(parsedResult.details).toEqual(mockDeleteResponse.data);
      
      // Verify axios was called with the right parameters
      expect(axiosDeleteSpy).toHaveBeenCalledTimes(1);
      expect(axiosDeleteSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/config/automation/config/test_automation'),
        expect.any(Object)
      );
    });

    it('should handle IDs already prefixed with automation.', async () => {
      // Mock the axios.delete implementation
      axiosDeleteSpy.mockResolvedValue(mockDeleteResponse);
      
      // Execute handler with prefixed ID
      const toolResult = await deleteAutomation('automation.test_automation');
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success
      expect(parsedResult.success).toBe(true);
      
      // Verify axios was called with the right parameters
      expect(axiosDeleteSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/config/automation/config/test_automation'),
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosDeleteSpy.mockRejectedValue(new Error('Automation not found'));
      
      // Execute handler
      const toolResult = await deleteAutomation('nonexistent_automation');
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error deleting automation:');
      expect(axiosDeleteSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 