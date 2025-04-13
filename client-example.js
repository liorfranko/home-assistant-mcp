// Simple example client for the Home Assistant MCP Server
const WebSocket = require('ws');
const axios = require('axios');

// Configuration
const MCP_HTTP_URL = 'http://localhost:3001';
const MCP_WS_URL = 'ws://localhost:8080';

// Create HTTP client
const httpClient = axios.create({
  baseURL: MCP_HTTP_URL,
  timeout: 5000,
});

// Example: Get all entities via HTTP
async function getAllEntities() {
  try {
    const response = await httpClient.get('/api/entities');
    console.log('Entities:', response.data.length);
    
    // Print first 3 entities as example
    response.data.slice(0, 3).forEach(entity => {
      console.log(`- ${entity.entity_id}: ${entity.state}`);
    });
  } catch (error) {
    console.error('Error fetching entities:', error.message);
  }
}

// Example: Toggle a light via HTTP
async function toggleLight(entityId) {
  try {
    // First get current state
    const stateResponse = await httpClient.get(`/api/entities/${entityId}`);
    const currentState = stateResponse.data.state;
    
    // Determine target state (toggle logic)
    const targetState = currentState === 'on' ? 'off' : 'on';
    
    console.log(`Toggling ${entityId} from ${currentState} to ${targetState}`);
    
    // Call the appropriate service based on target state
    const domain = entityId.split('.')[0]; // Extract domain from entity_id
    const service = `turn_${targetState}`;
    
    const response = await httpClient.post(`/api/services/${domain}/${service}`, {
      entity_id: entityId
    });
    
    console.log(`Service call result:`, response.data);
  } catch (error) {
    console.error(`Error toggling ${entityId}:`, error.message);
  }
}

// Example: Connect to WebSocket for real-time updates
function connectWebSocket() {
  const ws = new WebSocket(MCP_WS_URL);
  
  ws.on('open', () => {
    console.log('Connected to MCP WebSocket');
    
    // Request a specific entity state
    const request = {
      type: 'getState',
      id: 'request-' + Date.now(),
      entityId: 'light.living_room' // Replace with your entity
    };
    
    ws.send(JSON.stringify(request));
  });
  
  ws.on('message', (data) => {
    // Try to parse as JSON
    try {
      const message = JSON.parse(data);
      
      // Skip ping messages
      if (message.type === 'ping' || Object.keys(message).length === 0) {
        // Send pong response 
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }
      
      console.log('Received WebSocket message:');
      console.log(JSON.stringify(message, null, 2));
      
      // Example: React to state changes
      if (message.type === 'stateChange') {
        const { entityId, newState } = message.data;
        console.log(`Entity ${entityId} changed to ${newState.state}`);
      }
    } catch (error) {
      // Handle non-JSON messages
      if (data.toString() === 'ping') {
        ws.send('pong');
      } else {
        console.log('Received non-JSON message:', data.toString());
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  // Return the WebSocket object so we can close it later
  return ws;
}

// Run the example
async function runExample() {
  console.log('=== Home Assistant MCP Client Example ===');
  
  // HTTP examples
  await getAllEntities();
  
  // Uncomment to test toggling a light - replace with your entity ID
  // await toggleLight('light.living_room');
  
  // WebSocket example
  const ws = connectWebSocket();
  
  // Keep the connection open for 30 seconds for demo purposes
  console.log('Listening for real-time updates for 30 seconds...');
  setTimeout(() => {
    ws.close();
    console.log('Example completed');
  }, 30000);
}

// Start the example
runExample().catch(error => {
  console.error('Example failed:', error.message);
}); 