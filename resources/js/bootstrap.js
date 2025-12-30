import axios from 'axios';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy.js';

window.axios = axios;
window.route = (name, params, absolute) => route(name, params, absolute, Ziggy);

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Add response interceptor to handle rate limiting
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
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
