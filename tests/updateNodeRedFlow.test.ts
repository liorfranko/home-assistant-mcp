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

// Config update to apply
const updateConfig = {
  label: 'Updated Flow 1',
  disabled: true,
  info: 'Updated test flow 1'
};

// Expected updated flow
const updatedFlow = {
  id: 'flow1',
  type: 'tab',
  label: 'Updated Flow 1',
  disabled: true,
  info: 'Updated test flow 1'
};

// Mock successful update response
const mockUpdateResponse = {
  rev: '1234',
  success: true
};

// Extract the handler function for testability
async function updateNodeRedFlow(params: { flow_id: string, config: Record<string, any> }) {
  try {
    const { flow_id, config } = params;
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
    
    // First get all flows to ensure we're updating correctly
    const getResponse = await axios.get(`${nodeRedUrl}/flows`, {
      headers,
      auth
    });
    
    const flows = getResponse.data;
    
    // Find the flow to update
    const flowIndex = flows.findIndex((flow: any) => flow.id === flow_id && flow.type === 'tab');
    
    if (flowIndex === -1) {
      return {
        content: [{ 
          type: "text", 
          text: `Flow with ID ${flow_id} not found.`
        }]
      };
    }
    
    // Update the flow with new config
    flows[flowIndex] = { ...flows[flowIndex], ...config };
    
    // Send the updated flows back to Node-RED
    const updateResponse = await axios.put(
      `${nodeRedUrl}/flows`,
      flows,
      {
        headers,
        auth
      }
    );
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          success: true,
          message: `Flow ${flow_id} updated successfully`,
          result: updateResponse.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error updating Node-RED flow:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error updating Node-RED flow: ${error.message}` 
      }]
    };
  }
}

describe('Node-RED MCP Tools', () => {
  describe('updateNodeRedFlow', () => {
    let axiosGetSpy: any;
    let axiosPutSpy: any;
    
    beforeEach(() => {
      // Create spies on axios methods
      axiosGetSpy = jest.spyOn(axios, 'get');
      axiosPutSpy = jest.spyOn(axios, 'put');
    });
    
    afterEach(() => {
      // Restore the original implementations
      axiosGetSpy.mockRestore();
      axiosPutSpy.mockRestore();
    });

    it('should update a Node-RED flow successfully', async () => {
      // Mock axios.get to return the flow data
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Mock axios.put to return a success response
      axiosPutSpy.mockResolvedValue({
        data: mockUpdateResponse
      });
      
      // Execute handler
      const toolResult = await updateNodeRedFlow({ 
        flow_id: 'flow1', 
        config: updateConfig 
      });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check success response
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe('Flow flow1 updated successfully');
      expect(parsedResult.result).toEqual(mockUpdateResponse);
      
      // Verify axios calls
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        'http://homeassistant.local:1880/flows', 
        {
          headers: { 'Content-Type': 'application/json' },
          auth: undefined
        }
      );
      
      // Verify the PUT request was made with the correctly updated flows
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);
      
      // Get the flows that were sent in the PUT request
      const sentFlows = axiosPutSpy.mock.calls[0][1];
      
      // Check that the flow was updated correctly
      const updatedFlowInRequest = sentFlows.find((flow: any) => flow.id === 'flow1');
      expect(updatedFlowInRequest).toEqual(updatedFlow);
    });

    it('should return a not found message when flow does not exist', async () => {
      // Mock axios.get to return flows without the requested flow
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Execute handler with non-existent flow_id
      const toolResult = await updateNodeRedFlow({ 
        flow_id: 'nonexistent', 
        config: updateConfig 
      });
      
      // Check the response
      expect(toolResult?.content[0].text).toBe('Flow with ID nonexistent not found.');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosPutSpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock axios.get to throw an error
      axiosGetSpy.mockRejectedValue(new Error('Connection refused'));
      
      // Execute handler
      const toolResult = await updateNodeRedFlow({ 
        flow_id: 'flow1', 
        config: updateConfig 
      });
      
      // Check error response
      expect(toolResult?.content[0].text).toContain('Error updating Node-RED flow:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosPutSpy).not.toHaveBeenCalled();
    });
    
    it('should handle update errors gracefully', async () => {
      // Mock axios.get to return flows
      axiosGetSpy.mockResolvedValue({ 
        data: mockFlows 
      });
      
      // Mock axios.put to throw an error
      axiosPutSpy.mockRejectedValue(new Error('Update failed'));
      
      // Execute handler
      const toolResult = await updateNodeRedFlow({ 
        flow_id: 'flow1', 
        config: updateConfig 
      });
      
      // Check error response
      expect(toolResult?.content[0].text).toContain('Error updating Node-RED flow:');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosPutSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 