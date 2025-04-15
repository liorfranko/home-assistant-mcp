import axios from "axios";
import { haUrl, haToken, nodeRedUrl, nodeRedUsername, nodeRedPassword } from "../config/api.js";

// Format error message with details
export const formatErrorMessage = (error: any, context: string): string => {
  let errorMessage = `Error ${context}: ${error.message}`;
  
  if (error.response) {
    // The request was made and the server responded with a status code outside the 2xx range
    errorMessage += `\nStatus: ${error.response.status}`;
    errorMessage += `\nData: ${JSON.stringify(error.response.data || {})}`;
    
    // Check if this might be an authentication issue
    if (error.response.status === 401) {
      errorMessage += `\nAuthentication failed. Please check your HA_TOKEN environment variable.`;
      errorMessage += `\nCurrent token length: ${haToken ? haToken.length : 0}`;
      errorMessage += `\nCurrent URL: ${haUrl}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage += `\nNo response received from server at ${haUrl}`;
    errorMessage += `\nPlease check if Home Assistant is running and accessible at that URL.`;
  }
  
  return errorMessage;
};

// Get API headers
export const getHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${haToken}`,
  "Content-Type": "application/json",
});

// Helper function to make API calls to Home Assistant
export async function callHomeAssistantApi<T>(
  method: 'get' | 'post' | 'put' | 'delete', 
  endpoint: string, 
  data?: any
): Promise<T> {
  try {
    const url = `${haUrl}${endpoint}`;
    const headers = getHeaders();
    
    let response;
    switch (method) {
      case 'get':
        response = await axios.get(url, { headers });
        break;
      case 'post':
        response = await axios.post(url, data, { headers });
        break;
      case 'put':
        response = await axios.put(url, data, { headers });
        break;
      case 'delete':
        response = await axios.delete(url, { headers });
        break;
    }
      
    return response.data as T;
  } catch (error: any) {
    throw error;
  }
}

// Helper function for Node-RED API calls
export async function callNodeRedApi<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    const url = `${nodeRedUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Use basic auth if credentials are provided
    const auth = nodeRedUsername && nodeRedPassword
      ? { username: nodeRedUsername, password: nodeRedPassword }
      : undefined;
    
    let response;
    switch (method) {
      case 'get':
        response = await axios.get(url, { headers, auth });
        break;
      case 'post':
        response = await axios.post(url, data, { headers, auth });
        break;
      case 'put':
        response = await axios.put(url, data, { headers, auth });
        break;
      case 'delete':
        response = await axios.delete(url, { headers, auth });
        break;
    }
      
    return response.data as T;
  } catch (error: any) {
    throw error;
  }
} 