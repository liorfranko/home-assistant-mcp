import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const domain = 'light';
const service = 'turn_on';
const serviceData = {
  brightness_pct: 100,
  rgb_color: [255, 255, 255]
};
const target = {
  entity_id: 'light.living_room'
};

const mockServiceResponse = [
  {
    entity_id: 'light.living_room',
    state: 'on',
    attributes: {
      friendly_name: 'Living Room Light',
      brightness: 255,
      rgb_color: [255, 255, 255],
      color_mode: 'rgb'
    },
    last_changed: '2023-01-01T00:00:00Z',
    last_updated: '2023-01-01T00:00:01Z'
  }
];

// Extract the handler function for testability
async function callService(params: { 
  domain: string, 
  service: string, 
  service_data?: Record<string, any>, 
  target?: { 
    entity_id?: string | string[], 
    device_id?: string | string[], 
    area_id?: string | string[] 
  } 
}) {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    const { domain, service, service_data, target } = params;
    
    const payload: any = {};
    
    if (service_data) {
      Object.assign(payload, service_data);
    }
    
    if (target) {
      Object.assign(payload, target);
    }
    
    const response = await axios.post(
      `${haUrl}/api/services/${domain}/${service}`,
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
          message: `Service ${domain}.${service} called successfully`,
          result: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error calling service ${params.domain}.${params.service}:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error calling service: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Entity Tools', () => {
  describe('callService', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should call service with only domain and service', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockServiceResponse 
      });
      
      const toolResult = await callService({ 
        domain, 
        service 
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.result).toEqual(mockServiceResponse);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify URL and payload
      expect(axiosPostSpy.mock.calls[0][0]).toContain(`/api/services/${domain}/${service}`);
      expect(axiosPostSpy.mock.calls[0][1]).toEqual({});
    });

    it('should call service with service_data', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockServiceResponse 
      });
      
      const toolResult = await callService({ 
        domain, 
        service,
        service_data: serviceData
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.result).toEqual(mockServiceResponse);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify payload contains service data
      expect(axiosPostSpy.mock.calls[0][1]).toEqual(serviceData);
    });

    it('should call service with target entity_id', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockServiceResponse 
      });
      
      const toolResult = await callService({ 
        domain, 
        service,
        target
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.result).toEqual(mockServiceResponse);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify payload contains target
      expect(axiosPostSpy.mock.calls[0][1]).toEqual(target);
    });

    it('should call service with both service_data and target', async () => {
      axiosPostSpy.mockResolvedValue({ 
        data: mockServiceResponse 
      });
      
      const toolResult = await callService({ 
        domain, 
        service,
        service_data: serviceData,
        target
      });
      
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.result).toEqual(mockServiceResponse);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      
      // Verify payload contains merged service_data and target
      const expectedPayload = {
        ...serviceData,
        ...target
      };
      expect(axiosPostSpy.mock.calls[0][1]).toEqual(expectedPayload);
    });

    it('should handle service not found errors', async () => {
      const error = new Error('Service not found');
      error.name = 'NotFoundError';
      (error as any).response = { status: 404 };
      
      axiosPostSpy.mockRejectedValue(error);
      
      const nonExistentService = 'non_existent_service';
      const toolResult = await callService({ 
        domain, 
        service: nonExistentService 
      });
      
      expect(toolResult?.content[0].text).toContain('Error calling service:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Network error'));
      
      const toolResult = await callService({ 
        domain, 
        service 
      });
      
      expect(toolResult?.content[0].text).toContain('Error calling service:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 