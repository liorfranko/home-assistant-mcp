import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockConfigData = {
  components: ['automation', 'config', 'light', 'sensor'],
  config_dir: '/config',
  elevation: 0,
  latitude: 32.87336,
  longitude: -117.22743,
  time_zone: 'America/Los_Angeles',
  unit_system: {
    length: 'mi',
    mass: 'lb',
    temperature: '°F',
    volume: 'gal'
  },
  version: '2023.9.0',
  location_name: 'Home'
};

// Extract the handler function for testability
async function getConfig() {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const response = await axios.get(`${haUrl}/api/config`, {
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
    console.error("Error fetching configuration:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching configuration: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Config Tools', () => {
  describe('getConfig', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      axiosGetSpy.mockRestore();
    });

    it('should return the Home Assistant configuration', async () => {
      axiosGetSpy.mockResolvedValue({ 
        data: mockConfigData 
      });
      
      const toolResult = await getConfig();
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult).toEqual(mockConfigData);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy.mock.calls[0][0]).toContain('/api/config');
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API error');
      error.name = 'APIError';
      (error as any).response = { status: 500, data: 'Internal server error' };
      
      axiosGetSpy.mockRejectedValue(error);
      
      const toolResult = await getConfig();
      
      expect(toolResult?.content[0].text).toContain('Error fetching configuration:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Network error'));
      
      const toolResult = await getConfig();
      
      expect(toolResult?.content[0].text).toContain('Error fetching configuration:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 