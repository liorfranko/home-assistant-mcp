import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockFlows = [
  {
    id: 'flow1',
    type: 'tab',
    label: 'Flow 1',
    disabled: false,
    info: 'Test flow 1'
  },
  {
    id: 'flow2',
    type: 'tab',
    label: 'Flow 2',
    disabled: true,
    info: ''
  },
  {
    id: 'node1',
    type: 'inject',
    z: 'flow1'
  },
  {
    id: 'node2',
    type: 'debug',
    z: 'flow1'
  }
];

// Expected result after filtering and mapping
const expectedFlows = [
  {
    id: 'flow1',
    name: 'Flow 1',
    disabled: false,
    info: 'Test flow 1',
  },
  {
    id: 'flow2',
    name: 'Flow 2',
    disabled: true,
    info: '',
  }
];

// Extract the handler function for testability
async function listNodeRedFlows() {
  try {
    const nodeRedUrl = process.env.NODE_RED_URL || `http://homeassistant.local:1880`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Use basic auth if username and password are provided
    const nodeRedUsername = process.env.NODE_RED_USERNAME;
    const nodeRedPassword = process.env.NODE_RED_PASSWORD;
    const auth = nodeRedUsername && nodeRedPassword ? 
      { username: nodeRedUsername, password: nodeRedPassword } : 
      undefined;
    
    const response = await axios.get(`${nodeRedUrl}/flows`, {
      headers,
      auth
    });
    
    const flows = response.data;
    
    // Filter only the actual flows (tabs) and not nodes
    const mainFlows = flows.filter((flow: any) => flow.type === 'tab');
    
    const formattedFlows = mainFlows.map((flow: any) => ({
      id: flow.id,
      name: flow.label || flow.id,
      disabled: flow.disabled || false,
      info: flow.info || '',
    }));
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(formattedFlows, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error fetching Node-RED flows:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching Node-RED flows: ${error.message}` 
      }]
    };
  }
}

describe('Node-RED MCP Tools', () => {
  describe('listNodeRedFlows', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.get
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosGetSpy.mockRestore();
    });

    it('should return a list of Node-RED flows', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Execute handler
      const toolResult = await listNodeRedFlows();
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedFlows);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        'http://homeassistant.local:1880/flows', 
        {
          headers: { 'Content-Type': 'application/json' },
          auth: undefined
        }
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosGetSpy.mockRejectedValue(new Error('Connection refused'));
      
      // Execute handler
      const toolResult = await listNodeRedFlows();
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error fetching Node-RED flows:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 