import axios from 'axios';
window.axios = axios;

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
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                    },
                });
            });
        }
        return Promise.reject(error);
    }
);
