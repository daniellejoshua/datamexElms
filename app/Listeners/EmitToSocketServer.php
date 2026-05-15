<?php

namespace App\Listeners;

use App\Events\PaymentRecorded;
use Illuminate\Support\Facades\Http;

class EmitToSocketServer
{
    /**
     * Handle the event.
     */
    public function handle(PaymentRecorded $event): void
    {
        try {
            Http::retry(3, 100)
                ->post(config('socket.url').'/event', [
                    'event' => 'PaymentRecorded',
                    'data' => ['payment' => $event->payment->load('student')],
                ]);
        } catch (\Exception $e) {
            // swallow; real-time is best-effort
        }
    }
}
