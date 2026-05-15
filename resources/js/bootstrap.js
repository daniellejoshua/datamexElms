import axios from 'axios';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy.js';

window.axios = axios;
// wrapper around Ziggy's route helper.  We default to *relative*
// URLs to avoid leaking whatever host the assets were built with (e.g.
// "http://localhost" in CI).  When an absolute URL is explicitly
// requested we respect the caller's intent.
window.route = (name, params = {}, absolute = false) => {
    let url = route(name, params, absolute, Ziggy);

    if (typeof window !== 'undefined' && !absolute) {
        // strip off protocol+host if present
        const idx = url.indexOf('://');
        if (idx !== -1) {
            const pathStart = url.indexOf('/', idx + 3);
            url = pathStart !== -1 ? url.slice(pathStart) : '/';
        }
    }

    return url;
};

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Function to get current CSRF token
const getCsrfToken = () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    return token ? token.content : null;
};

// Configure CSRF token for Laravel
const token = getCsrfToken();
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
} else {
    console.error('CSRF token not found');
}

// Add request interceptor to always use the latest CSRF token
window.axios.interceptors.request.use(
    (config) => {
        const token = getCsrfToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle rate limiting and CSRF token expiration
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            // CSRF token expired - page expired
            import('sonner').then(({ toast }) => {
                toast.error('Your session has expired. Please refresh the page.', {
                    duration: 5000,
                    style: {
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                    },
                });
            });
            
            // Optionally auto-refresh after a delay
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
        
        if (error.response?.status === 429) {
            // Rate limited
            const retryAfter = error.response.headers['retry-after'];
            const message = retryAfter
                ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
                : 'Too many requests. Please wait a moment before trying again.';

            // Import toast dynamically to avoid circular dependencies
            import('sonner').then(({ toast }) => {
                toast.error(message, {
                    duration: 5000,
                    style: {
                        border: '1px solid #10b981',
                        backgroundColor: '#f0fdf4',
                        color: '#166534'
                    },
                });
            });
        }
        return Promise.reject(error);
    }
);

// -----------------------------------------------------------------------------
// Laravel Echo configuration for LAN websocket server
// -----------------------------------------------------------------------------
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// connection can be turned off completely (e.g. in prod where no socket
// server is running) by setting VITE_PUSHER_ENABLED=false in the environment.
const pushEnabled = import.meta.env.VITE_PUSHER_ENABLED !== 'false';

if (pushEnabled) {
    // default behaviour: connect back to the same host the page was loaded from
    // this allows a phone on the same LAN to connect to the headteacher's machine
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
        wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
        // when the page is served over HTTPS we must use TLS or browsers will
        // block connections (also avoids mixed‑content warnings).  on LAN the
        // app often runs over HTTP so leave this false by default.
        forceTLS: window.location.protocol === 'https:',
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
    });
}

// -----------------------------------------------------------------------------
// If you choose to run a standalone Node/socket.io server instead of
// the Laravel websockets package, the client can connect directly here and
// listen for events.  The LAN guide shows how to run `socket-server.js`.
// -----------------------------------------------------------------------------
import { io } from 'socket.io-client';

if (pushEnabled) {
    // Use secure WebSocket when page is loaded over HTTPS to avoid mixed-content
    // errors; otherwise default to plain WS for local LAN usage.
    const socketProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketPort = import.meta.env.VITE_PUSHER_PORT || 6001;

    window.Socket = io(`${socketProtocol}://${window.location.hostname}:${socketPort}`, {
        transports: ['websocket'],
    });

    // forward socket.io events into browser custom events for ease of use
    window.Socket.on('PaymentRecorded', (data) => {
        window.dispatchEvent(
            new CustomEvent('payment-recorded', { detail: data }),
        );
    });
}

// forward socket.io events into browser custom events for ease of use
window.Socket.on('PaymentRecorded', (data) => {
    window.dispatchEvent(
        new CustomEvent('payment-recorded', { detail: data }),
    );
});
