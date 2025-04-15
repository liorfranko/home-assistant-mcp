import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockCreateAutomationResponse = {
  data: {
    result: "ok",
    status: "success"
  }
};

// Sample automation config
const sampleAutomation = {
  alias: "Test Automation",
  description: "A test automation",
  trigger: {
    platform: "state",
    entity_id: "light.living_room",
    to: "on"
  },
  condition: {
    condition: "time",
    after: "08:00:00",
    before: "22:00:00"
  },
  action: {
    service: "notify.mobile_app",
    data: {
      message: "Light turned on"
    }
  }
};

// Extract the handler function for testability
async function createAutomation({ 
  alias, 
  description, 
  trigger, 
  condition, 
  action 
}: { 
  alias: string; 
  description?: string; 
  trigger: any; 
  condition?: any; 
  action: any 
}) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const automationConfig: Record<string, any> = {
      alias,
      description,
      trigger,
      condition,
      action
    };
    
    // Remove undefined values
    Object.keys(automationConfig).forEach(key => 
      automationConfig[key] === undefined && delete automationConfig[key]
    );
    
    const response = await axios.post(
      `${haUrl}/api/services/automation/reload`, 
      {
        "automation_config": automationConfig
      },
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
          message: "Automation created successfully",
          details: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error creating automation:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error creating automation: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('createAutomation', () => {
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

    it('should create an automation successfully', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue(mockCreateAutomationResponse);
      
      // Execute handler
      const toolResult = await createAutomation(sampleAutomation);
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result indicates success
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe("Automation created successfully");
      expect(parsedResult.details).toEqual(mockCreateAutomationResponse.data);
      
      // Verify axios was called with the right parameters
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/services/automation/reload'),
        {
          automation_config: sampleAutomation
        },
        expect.any(Object)
      );
    });

    it('should handle missing optional parameters', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue(mockCreateAutomationResponse);
      
      // Automation without description and condition
      const minimalAutomation = {
        alias: "Minimal Automation",
        trigger: { platform: "state", entity_id: "light.kitchen", to: "on" },
        action: { service: "light.turn_on", target: { entity_id: "light.bedroom" } }
      };
      
      // Execute handler
      await createAutomation(minimalAutomation);
      
      // Verify axios was called with only the provided parameters
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.any(String),
        {
          automation_config: {
            alias: "Minimal Automation",
            trigger: { platform: "state", entity_id: "light.kitchen", to: "on" },
            action: { service: "light.turn_on", target: { entity_id: "light.bedroom" } }
          }
        },
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosPostSpy.mockRejectedValue(new Error('Invalid automation configuration'));
      
      // Execute handler
      const toolResult = await createAutomation(sampleAutomation);
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error creating automation:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 