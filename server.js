const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

wss.on('connection', (ws) => {
    let user = null, freq = null;
    ws.on('message', (data) => {
        try {
            const m = JSON.parse(data);
            if (m.type === 'join') {
                user = m.userName; freq = m.frequency;
                if (!rooms.has(freq)) rooms.set(freq, new Map());
                rooms.get(freq).set(ws, user);
                ws.send(JSON.stringify({ type: 'join-confirmed', frequency: freq }));
                broadcast(freq, { type: 'user-joined', userName: user }, ws);
            } else {
                broadcast(freq, { ...m, userName: user }, ws);
            }
        } catch (e) {}
    });
    ws.on('close', () => { if (freq && rooms.has(freq)) rooms.get(freq).delete(ws); });
});

function broadcast(f, m, ex) {
    if (!rooms.has(f)) return;
    rooms.get(f).forEach((_, c) => {
        if (c !== ex && c.readyState === WebSocket.OPEN) c.send(JSON.stringify(m));
    });
}

server.listen(process.env.PORT || 3000, () => console.log('📻 TALKfriends'));
