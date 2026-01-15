import axios from 'axios';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy.js';

window.axios = axios;
window.route = (name, params, absolute) => route(name, params, absolute, Ziggy);

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
