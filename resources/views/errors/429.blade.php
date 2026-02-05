<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Too Many Requests - {{ config('app.name') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <style>
        body {
            font-family: 'Figtree', sans-serif;
            background-color: #f8fafc;
            color: #334155;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }

        .error-container {
            max-width: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 40px;
            text-align: center;
        }

        .error-code {
            font-size: 6rem;
            font-weight: 700;
            color: #f59e0b;
            margin: 0;
            line-height: 1;
        }

        .error-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin: 16px 0 8px 0;
        }

        .error-message {
            color: #64748b;
            margin-bottom: 24px;
            line-height: 1.6;
        }

        .retry-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }

        .retry-info strong {
            color: #92400e;
        }

        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .back-button:hover {
            background: #2563eb;
        }

        .icon {
            width: 20px;
            height: 20px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">429</div>
        <h1 class="error-title">Too Many Requests</h1>
        <p class="error-message">
            You're making requests too quickly. Please wait a moment before trying again.
        </p>

        <div class="retry-info">
            <strong>Retry after:</strong> <span id="retry-seconds">{{ $retry_after ?? 60 }}</span> seconds
        </div>

        <a href="{{ url()->previous() }}" class="back-button">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Go Back
        </a>
    </div>

    <script>
        // Get retry-after from response headers or use default
        let retryAfter = {{ $retry_after ?? 60 }};
        
        // Try to get from response headers if available
        if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType) {
            const navigationEntries = window.performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
                const retryAfterHeader = navigationEntries[0].responseHeaders?.['retry-after'] || 
                                        navigationEntries[0].responseHeaders?.['Retry-After'];
                if (retryAfterHeader) {
                    retryAfter = parseInt(retryAfterHeader);
                }
            }
        }
        
        const retryElement = document.getElementById('retry-seconds');
        retryElement.textContent = retryAfter;

        const countdown = setInterval(() => {
            retryAfter--;
            if (retryAfter > 0) {
                retryElement.textContent = retryAfter;
            } else {
                clearInterval(countdown);
                retryElement.parentElement.innerHTML = '<strong>You can try again now</strong>';
            }
        }, 1000);
    </script>
</body>
</html>