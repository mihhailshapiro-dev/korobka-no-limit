const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const app = express();

// Раздаём статику из корня (index.html и т.п.)
app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket сервер на том же домене
const wss = new WebSocket.Server({ server });
let nextId = 1;
wss.on('connection', (ws) => {
  const id = String(nextId++);
  let room = 'public';
  ws.on('message', (buf) => {
    try {
      const msg = JSON.parse(buf.toString());
      if (msg.type === 'hello') {
        room = msg.room || 'public';
        ws.send(JSON.stringify({ type: 'welcome', id }));
        return;
      }
      if (msg.type === 'state') {
        // Шлём всем другим
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'state', id, payload: msg.payload, room }));
          }
        });
      }
    } catch (e) {}
  });
  ws.on('close', () => {});
});
