import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockValidConfigResponse = {
  result: "valid",
  errors: null
};

const mockInvalidConfigResponse = {
  result: "invalid",
  errors: "Invalid configuration in automations.yaml"
};

// Extract the handler function for testability
async function checkConfig() {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const response = await axios.post(`${haUrl}/api/config/core/check_config`, {}, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          success: true,
          valid: response.data.result === "valid",
          ...response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error checking configuration:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error checking configuration: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Config Tools', () => {
  describe('checkConfig', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should return valid configuration status', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockValidConfigResponse 
      });
      
      const toolResult = await checkConfig();
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.valid).toBe(true);
      expect(parsedResult.result).toBe('valid');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy.mock.calls[0][0]).toContain('/api/config/core/check_config');
    });

    it('should return invalid configuration status with errors', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockInvalidConfigResponse 
      });
      
      const toolResult = await checkConfig();
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.valid).toBe(false);
      expect(parsedResult.result).toBe('invalid');
      expect(parsedResult.errors).toBe('Invalid configuration in automations.yaml');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API error');
      error.name = 'APIError';
      (error as any).response = { status: 500, data: 'Internal server error' };
      
      axiosPostSpy.mockRejectedValue(error);
      
      const toolResult = await checkConfig();
      
      expect(toolResult?.content[0].text).toContain('Error checking configuration:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Network error'));
      
      const toolResult = await checkConfig();
      
      expect(toolResult?.content[0].text).toContain('Error checking configuration:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 