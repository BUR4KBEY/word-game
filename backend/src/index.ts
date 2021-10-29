import { config } from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import onConnection from './utils/setup-socket';

config();

const server = http.createServer();
export const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on('connect', onConnection);

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running at ${port}.`));
