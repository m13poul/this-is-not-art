# Mondrian Synchronization Server

WebSocket server that broadcasts Mondrian generation parameters to all connected clients for synchronized rendering.

## Features

- Real-time WebSocket communication using Socket.IO
- Broadcasts generation parameters (seed, depth, color chance, line weight)
- Audio synchronization
- Client count tracking
- Health check endpoint

## Installation

```bash
npm install
```

## Development

Run the server in development mode with auto-reload:

```bash
npm run dev
```

## Production

Build and run:

```bash
npm run build
npm start
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 3001)

## Endpoints

### HTTP

- `GET /health` - Health check with client count and uptime

### WebSocket Events

**Server → Client:**

- `welcome` - Initial connection with client ID
- `generate` - New composition parameters
- `audio` - Audio frequencies to play
- `sync` - Time synchronization response
- `users` - Connected user count

**Client → Server:**

- `join` - Client connection
- `sync_request` - Request time sync
- `disconnect` - Client disconnect

## Testing

Health check:

```bash
curl http://localhost:3001/health
```

## Deployment

Recommended platforms:

- Render.com
- Railway.app
- Fly.io
- DigitalOcean

All support WebSockets and have free/cheap tiers.
