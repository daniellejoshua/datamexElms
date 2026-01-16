<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequestLogger
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->path() === 'admin/teachers/1' && $request->method() === 'POST') {
            \Log::info('=== REQUEST LOGGER: Teacher Update Request Detected ===');
            \Log::info('Method: '.$request->method());
            \Log::info('Path: '.$request->path());
            \Log::info('Route Name: '.($request->route() ? $request->route()->getName() : 'none'));
            \Log::info('Route Action: '.($request->route() ? $request->route()->getActionName() : 'none'));
            \Log::info('Request Data: ', $request->all());
        }

        $response = $next($request);

        if ($request->path() === 'admin/teachers/1' && $request->method() === 'POST') {
            \Log::info('=== RESPONSE AFTER CONTROLLER ===');
            \Log::info('Status Code: '.$response->status());
            if ($response instanceof \Illuminate\Http\RedirectResponse) {
                \Log::info('Redirect Location: '.$response->headers->get('Location'));
                \Log::info('Flash Data: ', session()->all());
            }
        }

        return $response;
    }
}
