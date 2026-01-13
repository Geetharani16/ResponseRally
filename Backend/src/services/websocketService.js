const WebSocket = require('ws');

let wss = null;
let clients = new Map(); // sessionId -> Set of clients

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    const sessionId = extractSessionId(req.url);
    console.log(`\n>>> WebSocket connection established for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    
    if (sessionId) {
      registerClient(sessionId, ws);
      console.log(`>>> Client registered for session: ${sessionId}`);
    } else {
      console.warn(`>>> WebSocket connection without valid session ID`);
    }
    
    ws.on('close', () => {
      console.log(`>>> WebSocket connection closed for session: ${sessionId}`);
      unregisterClient(sessionId, ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error for session:', sessionId, error);
    });
  });
}

function extractSessionId(url) {
  try {
    const urlObj = new URL(url, 'ws://localhost');
    return urlObj.searchParams.get('sessionId');
  } catch (error) {
    return null;
  }
}

function registerClient(sessionId, ws) {
  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }
  clients.get(sessionId).add(ws);
}

function unregisterClient(sessionId, ws) {
  const clientSet = clients.get(sessionId);
  if (clientSet) {
    clientSet.delete(ws);
    if (clientSet.size === 0) {
      clients.delete(sessionId);
    }
  }
}

function emitToSession(sessionId, event, data) {
  const clientSet = clients.get(sessionId);
  if (clientSet && clientSet.size > 0) {
    const message = JSON.stringify({ event, data });
    console.log(`>>> Emitting WebSocket event '${event}' to ${clientSet.size} client(s) for session: ${sessionId}`);
    clientSet.forEach((client, index) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        console.log(`>>> Message sent to client ${index + 1}/${clientSet.size}`);
      } else {
        console.log(`>>> Skipping client ${index + 1}/${clientSet.size} - not in OPEN state`);
      }
    });
  } else {
    console.log(`>>> No active WebSocket clients for session: ${sessionId} when emitting event: ${event}`);
  }
}

function broadcast(event, data) {
  if (wss) {
    const message = JSON.stringify({ event, data });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = {
  setupWebSocket,
  emitToSession,
  broadcast,
  extractSessionId
};