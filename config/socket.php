<?php

return [
    /**
     * URL of the Node/socket.io server that will broadcast events.
     *
     * When the LAN machine is offline you can still run the Node server locally
     * on port 6001; in the guide we show starting it with `node socket-server.js`.
     */
    'url' => env('SOCKET_URL', 'http://127.0.0.1:6001'),
];
