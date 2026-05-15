import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Refresh CSRF token before each request
router.on('before', () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token && window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    }
});

// Global Inertia error handling (rate limiting is now handled by middleware)
router.on('error', (event) => {
    // Handle CSRF token expiry
    if (event.detail?.response?.status === 419) {
        toast.error('Your session has expired. Please refresh the page.', {
            duration: 2000,
        });
        // Refresh the page to get a new CSRF token
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        // Prevent the default error handling
        event.preventDefault();
        return;
    }

    // Handle rate limiting errors
    if (event.detail?.response?.status === 429) {
        const message = 'Rate limit exceeded. Please wait a moment before trying again.';
        toast.error(message, {
            duration: 5000,
            style: {
                border: '1px solid #10b981',
                backgroundColor: '#f0fdf4',
                color: '#166534'
            },
        });
        // Prevent the default error handling
        event.preventDefault();
        return;
    }

    // Handle redirects that might come from rate limiting
    if (event.detail?.response?.status === 302 || event.detail?.response?.status === 301) {
        // This is a redirect, let Inertia handle it normally
        return;
    }

    // Handle other errors normally
    console.log('Inertia error:', event.detail);
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    // disable the automatic progress bar/modal since we use toasts for feedback
    progress: false,
});
