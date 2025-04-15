import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock successful deployment response
const mockDeployResponse = {
  rev: '1234',
  deploymentType: 'full'
};

// Extract the handler function for testability
async function deployNodeRedFlows(params?: { type?: 'full' | 'nodes' | 'flows' }) {
  try {
    const type = params?.type || 'full';
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
    
    const response = await axios.post(
      `${nodeRedUrl}/flows`,
      { 
        deploymentType: type 
      },
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
          message: `Node-RED flows deployed with type: ${type}`,
          result: response.data
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error(`Error deploying Node-RED flows:`, error);
    return {
      content: [{ 
        type: "text", 
        text: `Error deploying Node-RED flows: ${error.message}` 
      }]
    };
  }
}

describe('Node-RED MCP Tools', () => {
  describe('deployNodeRedFlows', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.post
      axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosPostSpy.mockRestore();
    });

    it('should deploy flows with default type "full"', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue({ 
        data: mockDeployResponse 
      });
      
      // Execute handler with no parameters
      const toolResult = await deployNodeRedFlows();
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check success response
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe('Node-RED flows deployed with type: full');
      expect(parsedResult.result).toEqual(mockDeployResponse);
      
      // Verify axios call
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        'http://homeassistant.local:1880/flows',
        { deploymentType: 'full' },
        {
          headers: { 'Content-Type': 'application/json' },
          auth: undefined
        }
      );
    });

    it('should deploy flows with specified type', async () => {
      // Mock the axios.post implementation
      axiosPostSpy.mockResolvedValue({ 
        data: { ...mockDeployResponse, deploymentType: 'nodes' } 
      });
      
      // Execute handler with type = nodes
      const toolResult = await deployNodeRedFlows({ type: 'nodes' });
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check success response
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.message).toBe('Node-RED flows deployed with type: nodes');
      
      // Verify axios call
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        'http://homeassistant.local:1880/flows',
        { deploymentType: 'nodes' },
        {
          headers: { 'Content-Type': 'application/json' },
          auth: undefined
        }
      );
    });

    it('should handle deployment errors gracefully', async () => {
      // Mock an error response
      axiosPostSpy.mockRejectedValue(new Error('Deployment failed'));
      
      // Execute handler
      const toolResult = await deployNodeRedFlows();
      
      // Check error response
      expect(toolResult?.content[0].text).toContain('Error deploying Node-RED flows:');
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 