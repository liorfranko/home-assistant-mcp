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
    id: 'node1',
    type: 'inject',
    name: 'Trigger',
    z: 'flow1',
    wires: [['node2']]
  },
  {
    id: 'node2',
    type: 'debug',
    name: 'Debug',
    z: 'flow1',
    wires: []
  },
  {
    id: 'flow2',
    type: 'tab',
    label: 'Flow 2',
    disabled: true
  }
];

// Expected result for flow1
const expectedFlowDetails = {
  id: 'flow1',
  name: 'Flow 1',
  disabled: false,
  info: 'Test flow 1',
  nodes: [
    {
      id: 'node1',
      type: 'inject',
      name: 'Trigger',
      wires: [['node2']]
    },
    {
      id: 'node2',
      type: 'debug',
      name: 'Debug',
      wires: []
    }
  ]
};

// Extract the handler function for testability
async function getNodeRedFlow(params: { flow_id: string }) {
  try {
    const { flow_id } = params;
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
    
    // First get all flows
    const response = await axios.get(`${nodeRedUrl}/flows`, {
      headers,
      auth
    });
    
    const flows = response.data;
    
    // Find the requested flow
    const flowTab = flows.find((flow: any) => flow.id === flow_id && flow.type === 'tab');
    
    if (!flowTab) {
      return {
        content: [{ 
          type: "text", 
          text: `Flow with ID ${flow_id} not found.`
        }]
      };
    }
    
    // Get all nodes that belong to this flow
    const flowNodes = flows.filter((node: any) => node.z === flow_id);
    
    const flowDetails = {
      id: flowTab.id,
      name: flowTab.label || flowTab.id,
      disabled: flowTab.disabled || false,
      info: flowTab.info || '',
      nodes: flowNodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        name: node.name || node.type,
        wires: node.wires || []
      }))
    };
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(flowDetails, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error fetching Node-RED flow:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error fetching Node-RED flow: ${error.message}` 
      }]
    };
  }
}

describe('Node-RED MCP Tools', () => {
  describe('getNodeRedFlow', () => {
    let axiosGetSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.get
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosGetSpy.mockRestore();
    });

    it('should return details of a specific Node-RED flow', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Execute handler with flow_id = flow1
      const toolResult = await getNodeRedFlow({ flow_id: 'flow1' });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedFlowDetails);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        'http://homeassistant.local:1880/flows', 
        {
          headers: { 'Content-Type': 'application/json' },
          auth: undefined
        }
      );
    });

    it('should return a not found message when flow does not exist', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Execute handler with non-existent flow_id
      const toolResult = await getNodeRedFlow({ flow_id: 'nonexistent' });
      
      // Check if the not found message is returned
      expect(toolResult?.content[0].text).toBe('Flow with ID nonexistent not found.');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosGetSpy.mockRejectedValue(new Error('Connection refused'));
      
      // Execute handler
      const toolResult = await getNodeRedFlow({ flow_id: 'flow1' });
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error fetching Node-RED flow:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 