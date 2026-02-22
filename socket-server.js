// simple socket.io server that accepts POSTs from Laravel and re-emits them
// run this on the same machine as the Laravel app (headteacher desktop).

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log('client connected', socket.id);
});

app.use(express.json());

// Laravel will POST { event: 'EventName', data: {...} }
app.post('/event', (req, res) => {
    const { event, data } = req.body;
    if (event) {
        io.emit(event, data);
    }
    res.sendStatus(204);
});

const PORT = process.env.PORT || 6001;
server.listen(PORT, () => {
    console.log('Socket server listening on port', PORT);
});
