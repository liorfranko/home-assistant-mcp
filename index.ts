import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import * as http from 'http';
import { EventEmitter } from 'events';

// Load environment variables
dotenv.config();

// Constants from environment variables
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const HA_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
const HA_TOKEN = process.env.HA_TOKEN;

if (!HA_TOKEN) {
  console.error('HA_TOKEN is required. Please set it in your .env file.');
  process.exit(1);
}

/**
 * Splits concatenated JSON strings into an array of individual JSON strings.
 * Handles cases where multiple JSON objects were sent in a single message without delimiters.
 * E.g., '{"a":1}{"b":2}' becomes ['{"a":1}', '{"b":2}']
 */
function splitConcatenatedJSON(input: string): string[] {
  const result: string[] = [];
  let braceCount = 0;
  let start = 0;
  
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '{') {
      if (braceCount === 0) {
        start = i;
      }
      braceCount++;
    } else if (input[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        // We found a complete JSON object
        result.push(input.substring(start, i + 1));
      }
    }
  }
  
  // If we found no JSON objects, return the original string as a single item
  return result.length > 0 ? result : [input];
}

// Define types
interface HomeAssistantEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

interface WebSocketMessage {
  type: string;
  id?: string;
  [key: string]: any;
}

interface StateChangeEvent {
  entityId: string;
  newState: HomeAssistantEntity;
}

interface ServiceCallEvent {
  domain: string;
  service: string;
  data: Record<string, any>;
  result: any;
}

// Automation types
interface AutomationTrigger {
  platform: string;
  [key: string]: any;
}

interface AutomationCondition {
  condition: string;
  [key: string]: any;
}

interface AutomationAction {
  service?: string;
  domain?: string;
  entity_id?: string | string[];
  [key: string]: any;
}

interface Automation {
  id: string;
  alias: string;
  description?: string;
  mode?: 'single' | 'parallel' | 'queued' | 'restart';
  trigger: AutomationTrigger[];
  condition?: AutomationCondition[];
  action: AutomationAction[];
  enabled: boolean;
}

// Create event bus for internal communication
const eventBus = new EventEmitter();

// Configure Axios for Home Assistant API
const haClient: AxiosInstance = axios.create({
  baseURL: HA_URL,
  headers: {
    'Authorization': `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Create Express app for HTTP API
const app = express();
app.use(express.json());

// Basic middleware for logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Home Assistant entities endpoint
app.get('/api/entities', async (req: Request, res: Response) => {
  try {
    const response = await haClient.get<HomeAssistantEntity[]>('/api/states');
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching entities:', error.message);
    res.status(500).json({ error: 'Failed to fetch entities from Home Assistant' });
  }
});

// Call a Home Assistant service
app.post('/api/services/:domain/:service', async (req: Request, res: Response) => {
  const { domain, service } = req.params;
  try {
    const response = await haClient.post(
      `/api/services/${domain}/${service}`,
      req.body
    );
    
    // Emit event for the WebSocket clients
    eventBus.emit('serviceCall', {
      domain,
      service,
      data: req.body,
      result: response.data
    } as ServiceCallEvent);
    
    res.json(response.data);
  } catch (error: any) {
    console.error(`Error calling service ${domain}.${service}:`, error.message);
    res.status(500).json({ error: `Failed to call service ${domain}.${service}` });
  }
});

// Get entity state
app.get('/api/entities/:entityId', async (req: Request, res: Response) => {
  const { entityId } = req.params;
  try {
    const response = await haClient.get<HomeAssistantEntity>(`/api/states/${entityId}`);
    res.json(response.data);
  } catch (error: any) {
    console.error(`Error fetching entity ${entityId}:`, error.message);
    res.status(500).json({ error: `Failed to fetch entity ${entityId}` });
  }
});

// Set entity state
app.post('/api/entities/:entityId', async (req: Request, res: Response) => {
  const { entityId } = req.params;
  const { state, attributes } = req.body;
  
  try {
    const response = await haClient.post<HomeAssistantEntity>(`/api/states/${entityId}`, {
      state,
      attributes,
    });
    
    // Emit event for WebSocket clients
    eventBus.emit('stateChange', {
      entityId,
      newState: response.data
    } as StateChangeEvent);
    
    res.json(response.data);
  } catch (error: any) {
    console.error(`Error setting state for ${entityId}:`, error.message);
    res.status(500).json({ error: `Failed to set state for ${entityId}` });
  }
});

// Automation management endpoints
// Get all automations
app.get('/api/automations', async (req: Request, res: Response) => {
  try {
    const response = await haClient.get<HomeAssistantEntity[]>('/api/states');
    const automations = response.data
      .filter(entity => entity.entity_id.startsWith('automation.'))
      .map(entity => ({
        id: entity.entity_id,
        alias: entity.attributes.friendly_name || entity.entity_id.split('.')[1],
        enabled: entity.state === 'on',
        last_triggered: entity.attributes.last_triggered || null,
      }));
    
    res.json(automations);
  } catch (error: any) {
    console.error('Error fetching automations:', error.message);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// Get automation details
app.get('/api/automations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // First get the basic entity state
    const stateResponse = await haClient.get<HomeAssistantEntity>(`/api/states/${id}`);
    
    // Then get the automation config
    const configResponse = await haClient.get(`/api/config/automation/config/${id.replace('automation.', '')}`);
    
    // Combine the data
    const automationData = {
      id: stateResponse.data.entity_id,
      alias: stateResponse.data.attributes.friendly_name || stateResponse.data.entity_id.split('.')[1],
      description: configResponse.data.description || '',
      mode: configResponse.data.mode || 'single',
      trigger: configResponse.data.trigger || [],
      condition: configResponse.data.condition || [],
      action: configResponse.data.action || [],
      enabled: stateResponse.data.state === 'on',
      last_triggered: stateResponse.data.attributes.last_triggered || null,
    };
    
    res.json(automationData);
  } catch (error: any) {
    console.error(`Error fetching automation ${id}:`, error.message);
    res.status(500).json({ error: `Failed to fetch automation ${id}` });
  }
});

// Toggle automation (enable/disable)
app.post('/api/automations/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Get current state
    const stateResponse = await haClient.get<HomeAssistantEntity>(`/api/states/${id}`);
    const currentState = stateResponse.data.state;
    
    // Toggle state
    const newState = currentState === 'on' ? 'off' : 'on';
    
    // Call service to turn on/off
    const response = await haClient.post(`/api/services/automation/${newState}`, {
      entity_id: id
    });
    
    res.json({ id, state: newState });
  } catch (error: any) {
    console.error(`Error toggling automation ${id}:`, error.message);
    res.status(500).json({ error: `Failed to toggle automation ${id}` });
  }
});

// Trigger automation
app.post('/api/automations/:id/trigger', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Call service to trigger
    const response = await haClient.post(`/api/services/automation/trigger`, {
      entity_id: id
    });
    
    res.json({ id, triggered: true });
  } catch (error: any) {
    console.error(`Error triggering automation ${id}:`, error.message);
    res.status(500).json({ error: `Failed to trigger automation ${id}` });
  }
});

// Create/Update automation
app.post('/api/automations', async (req: Request, res: Response) => {
  try {
    const automationConfig = req.body;
    
    // Validate required fields
    if (!automationConfig.alias || !automationConfig.trigger || !automationConfig.action) {
      return res.status(400).json({ error: 'Missing required automation fields' });
    }
    
    // Create or update automation
    const response = await haClient.post('/api/config/automation/config', automationConfig);
    
    res.json({ 
      success: true, 
      id: `automation.${response.data.id || automationConfig.alias.toLowerCase().replace(/\s+/g, '_')}` 
    });
  } catch (error: any) {
    console.error('Error saving automation:', error.message);
    res.status(500).json({ error: 'Failed to save automation' });
  }
});

// Delete automation
app.delete('/api/automations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Extract automation ID without the domain prefix
    const automationId = id.replace('automation.', '');
    
    // Delete automation config
    const response = await haClient.delete(`/api/config/automation/config/${automationId}`);
    
    res.json({ success: true, id });
  } catch (error: any) {
    console.error(`Error deleting automation ${id}:`, error.message);
    res.status(500).json({ error: `Failed to delete automation ${id}` });
  }
});

// Start HTTP server
const httpServer = app.listen(PORT, () => {
  console.log(`MCP HTTP Server running on port ${PORT}`);
});

// Create WebSocket server for real-time updates
const wss = new WebSocketServer({ port: Number(WS_PORT) });

// Heartbeat mechanism to keep connections alive
function heartbeat(this: WebSocket) {
  (this as any).isAlive = true;
}

// Check for dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    if ((ws as any).isAlive === false) {
      console.log('Terminating inactive connection');
      return ws.terminate();
    }
    
    (ws as any).isAlive = false;
    ws.send('{"type":"ping"}');
  });
}, 30000);

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(interval);
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  
  // Initialize heartbeat state
  (ws as any).isAlive = true;
  ws.on('pong', heartbeat);
  
  // Handle ping messages explicitly
  ws.on('ping', () => {
    ws.pong();
  });
  
  // Send initial message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Home Assistant MCP Server'
  }));
  
  // Listen for state changes and service calls
  const stateChangeHandler = (data: StateChangeEvent) => {
    ws.send(JSON.stringify({
      type: 'stateChange',
      data
    }));
  };
  
  const serviceCallHandler = (data: ServiceCallEvent) => {
    ws.send(JSON.stringify({
      type: 'serviceCall',
      data
    }));
  };
  
  // Listen for automation events
  const automationToggledHandler = (data: { id: string, state: string }) => {
    ws.send(JSON.stringify({
      type: 'automationToggled',
      data
    }));
  };
  
  const automationTriggeredHandler = (data: { id: string }) => {
    ws.send(JSON.stringify({
      type: 'automationTriggered',
      data
    }));
  };
  
  const automationSavedHandler = (data: { id: string, config: any }) => {
    ws.send(JSON.stringify({
      type: 'automationSaved',
      data
    }));
  };
  
  const automationDeletedHandler = (data: { id: string }) => {
    ws.send(JSON.stringify({
      type: 'automationDeleted',
      data
    }));
  };
  
  eventBus.on('stateChange', stateChangeHandler);
  eventBus.on('serviceCall', serviceCallHandler);
  eventBus.on('automationToggled', automationToggledHandler);
  eventBus.on('automationTriggered', automationTriggeredHandler);
  eventBus.on('automationSaved', automationSavedHandler);
  eventBus.on('automationDeleted', automationDeletedHandler);
  
  // Handle client messages
  ws.on('message', async (message: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const msgString = message.toString();
      // Skip empty messages
      if (!msgString) {
        return;
      }
      
      // Handle ping/pong for clients that don't support native WebSocket ping
      if (msgString === 'ping') {
        ws.send('pong');
        return;
      }
      
      // Handle empty JSON objects (often used as pings)
      if (msgString === '{}') {
        ws.send('{}');
        return;
      }
      
      // Handle potential concatenated JSON objects
      const messages = splitConcatenatedJSON(msgString);
      
      // Process each message separately
      for (const jsonStr of messages) {
        let data: WebSocketMessage;
        try {
          data = JSON.parse(jsonStr) as WebSocketMessage;
        } catch (parseError: any) {
          console.error(`JSON parse error: ${parseError.message}`);
          console.error(`Raw message (first 100 chars): ${jsonStr.substring(0, 100)}`);
          ws.send(JSON.stringify({
            type: 'error',
            error: `Invalid JSON format: ${parseError.message}`,
            receivedMessage: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr
          }));
          continue; // Continue to process next message if any
        }
        
        // Handle ping message type
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', id: data.id }));
          continue;
        }
        
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'getState' && data.entityId) {
          try {
            const response = await haClient.get<HomeAssistantEntity>(`/api/states/${data.entityId}`);
            ws.send(JSON.stringify({
              type: 'stateResult',
              id: data.id,
              data: response.data
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to get state: ${error.message}`
            }));
          }
        } else if (data.type === 'callService' && data.domain && data.service) {
          try {
            const response = await haClient.post(
              `/api/services/${data.domain}/${data.service}`,
              data.serviceData || {}
            );
            ws.send(JSON.stringify({
              type: 'serviceResult',
              id: data.id,
              data: response.data
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to call service: ${error.message}`
            }));
          }
        } else if (data.type === 'getAutomations') {
          // Get all automations
          try {
            const response = await haClient.get<HomeAssistantEntity[]>('/api/states');
            const automations = response.data
              .filter(entity => entity.entity_id.startsWith('automation.'))
              .map(entity => ({
                id: entity.entity_id,
                alias: entity.attributes.friendly_name || entity.entity_id.split('.')[1],
                enabled: entity.state === 'on',
                last_triggered: entity.attributes.last_triggered || null,
              }));
            
            ws.send(JSON.stringify({
              type: 'automationsResult',
              id: data.id,
              data: automations
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to fetch automations: ${error.message}`
            }));
          }
        } else if (data.type === 'getAutomation' && data.automationId) {
          // Get automation details
          try {
            // First get the basic entity state
            const stateResponse = await haClient.get<HomeAssistantEntity>(`/api/states/${data.automationId}`);
            
            // Then get the automation config
            const configResponse = await haClient.get(`/api/config/automation/config/${data.automationId.replace('automation.', '')}`);
            
            // Combine the data
            const automationData = {
              id: stateResponse.data.entity_id,
              alias: stateResponse.data.attributes.friendly_name || stateResponse.data.entity_id.split('.')[1],
              description: configResponse.data.description || '',
              mode: configResponse.data.mode || 'single',
              trigger: configResponse.data.trigger || [],
              condition: configResponse.data.condition || [],
              action: configResponse.data.action || [],
              enabled: stateResponse.data.state === 'on',
              last_triggered: stateResponse.data.attributes.last_triggered || null,
            };
            
            ws.send(JSON.stringify({
              type: 'automationResult',
              id: data.id,
              data: automationData
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to fetch automation: ${error.message}`
            }));
          }
        } else if (data.type === 'toggleAutomation' && data.automationId) {
          // Toggle automation (enable/disable)
          try {
            // Get current state
            const stateResponse = await haClient.get<HomeAssistantEntity>(`/api/states/${data.automationId}`);
            const currentState = stateResponse.data.state;
            
            // Toggle state
            const newState = currentState === 'on' ? 'off' : 'on';
            
            // Call service to turn on/off
            await haClient.post(`/api/services/automation/${newState}`, {
              entity_id: data.automationId
            });
            
            ws.send(JSON.stringify({
              type: 'automationToggleResult',
              id: data.id,
              data: { id: data.automationId, state: newState }
            }));
            
            // Emit event for other clients
            eventBus.emit('automationToggled', {
              id: data.automationId,
              state: newState
            });
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to toggle automation: ${error.message}`
            }));
          }
        } else if (data.type === 'triggerAutomation' && data.automationId) {
          // Trigger automation
          try {
            // Call service to trigger
            await haClient.post(`/api/services/automation/trigger`, {
              entity_id: data.automationId
            });
            
            ws.send(JSON.stringify({
              type: 'automationTriggerResult',
              id: data.id,
              data: { id: data.automationId, triggered: true }
            }));
            
            // Emit event for other clients
            eventBus.emit('automationTriggered', {
              id: data.automationId
            });
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to trigger automation: ${error.message}`
            }));
          }
        } else if (data.type === 'saveAutomation' && data.automation) {
          // Create/Update automation
          try {
            const automationConfig = data.automation;
            
            // Validate required fields
            if (!automationConfig.alias || !automationConfig.trigger || !automationConfig.action) {
              ws.send(JSON.stringify({
                type: 'error',
                id: data.id,
                error: 'Missing required automation fields'
              }));
              return;
            }
            
            // Create or update automation
            const response = await haClient.post('/api/config/automation/config', automationConfig);
            
            const automationId = `automation.${response.data.id || automationConfig.alias.toLowerCase().replace(/\s+/g, '_')}`;
            
            ws.send(JSON.stringify({
              type: 'automationSaveResult',
              id: data.id,
              data: { success: true, id: automationId }
            }));
            
            // Emit event for other clients
            eventBus.emit('automationSaved', {
              id: automationId,
              config: automationConfig
            });
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to save automation: ${error.message}`
            }));
          }
        } else if (data.type === 'deleteAutomation' && data.automationId) {
          // Delete automation
          try {
            // Extract automation ID without the domain prefix
            const automationId = data.automationId.replace('automation.', '');
            
            // Delete automation config
            await haClient.delete(`/api/config/automation/config/${automationId}`);
            
            ws.send(JSON.stringify({
              type: 'automationDeleteResult',
              id: data.id,
              data: { success: true, id: data.automationId }
            }));
            
            // Emit event for other clients
            eventBus.emit('automationDeleted', {
              id: data.automationId
            });
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              id: data.id,
              error: `Failed to delete automation: ${error.message}`
            }));
          }
        } else {
          // Handle unknown commands gracefully
          ws.send(JSON.stringify({
            type: 'error',
            id: data.id,
            error: `Unknown command: ${data.type}`
          }));
        }
      }
    } catch (error: any) {
      console.error('Error processing WebSocket message:', error.message);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });
  
  // Clean up event listeners on disconnect
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    eventBus.off('stateChange', stateChangeHandler);
    eventBus.off('serviceCall', serviceCallHandler);
    eventBus.off('automationToggled', automationToggledHandler);
    eventBus.off('automationTriggered', automationTriggeredHandler);
    eventBus.off('automationSaved', automationSavedHandler);
    eventBus.off('automationDeleted', automationDeletedHandler);
  });
});

console.log(`WebSocket server running on port ${WS_PORT}`);

// Setup Home Assistant event subscription
async function subscribeToEvents(): Promise<void> {
  try {
    // Not implementing SSE directly - would require a more complex setup
    console.log('Event subscription would be implemented here with SSE');
    
    // Instead, we'll poll for state changes every 5 seconds
    setInterval(async () => {
      try {
        const response = await haClient.get<HomeAssistantEntity[]>('/api/states');
        const entities = response.data;
        
        // Process entities and emit events as needed
        // In a real implementation, you'd track previous states and compare
        entities.forEach((entity: HomeAssistantEntity) => {
          eventBus.emit('stateChange', {
            entityId: entity.entity_id,
            newState: entity
          } as StateChangeEvent);
        });
      } catch (error: any) {
        console.error('Error polling for states:', error.message);
      }
    }, 5000);
  } catch (error: any) {
    console.error('Error setting up event subscription:', error.message);
  }
}

// Start the event subscription
subscribeToEvents();

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown(): void {
  console.log('Shutting down MCP server...');
  clearInterval(interval);
  httpServer.close();
  wss.close();
  process.exit(0);
}
