# Home Assistant MCP Server

A Master Control Protocol (MCP) server for Home Assistant that provides REST API and WebSocket access to control your smart home.

## Features

- REST API for controlling Home Assistant entities
- WebSocket interface for real-time updates
- Service call forwarding to Home Assistant
- Entity state monitoring and updates

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the example environment file and edit it with your Home Assistant details:
   ```
   cp .env.example .env
   ```
4. Edit the `.env` file and set:
   - `HA_URL`: Your Home Assistant URL (e.g., http://homeassistant.local:8123)
   - `HA_TOKEN`: Your Home Assistant Long-Lived Access Token (create one in HA Profile)
   - `PORT`: HTTP API port (default: 3000)
   - `WS_PORT`: WebSocket port (default: 8080)

## Usage

### Starting the Server

```
npm start
```

For development with auto-restart:
```
npm run dev
```

### REST API Endpoints

- `GET /health` - Server health check
- `GET /api/entities` - List all entities
- `GET /api/entities/:entityId` - Get state of a specific entity
- `POST /api/entities/:entityId` - Set state of an entity
  ```json
  {
    "state": "on",
    "attributes": {
      "brightness": 255
    }
  }
  ```
- `POST /api/services/:domain/:service` - Call a Home Assistant service
  ```json
  {
    "entity_id": "light.living_room",
    "brightness": 255
  }
  ```

### WebSocket API

Connect to the WebSocket server at `ws://your-server:8080`

#### Messages from client to server:

```json
{
  "type": "getState",
  "id": "request-123",
  "entityId": "light.living_room"
}
```

```json
{
  "type": "callService",
  "id": "request-456",
  "domain": "light",
  "service": "turn_on",
  "serviceData": {
    "entity_id": "light.living_room",
    "brightness": 255
  }
}
```

#### Messages from server to client:

```json
{
  "type": "stateChange",
  "data": {
    "entityId": "light.living_room",
    "newState": { ... }
  }
}
```

```json
{
  "type": "serviceResult",
  "id": "request-456",
  "data": { ... }
}
```

## Security

This server expects to run on your local network. Make sure to:

1. Not expose this server directly to the internet
2. Keep your `HA_TOKEN` secret
3. Use HTTPS/WSS if you need remote access (with proper reverse proxy) 