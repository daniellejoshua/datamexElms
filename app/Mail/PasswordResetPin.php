<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetPin extends Mailable
{
    use Queueable, SerializesModels;

    public $pin;

    public $context;

    /**
     * Create a new message instance.
     */
    public function __construct($pin, $context = 'password')
    {
        $this->pin = $pin;
        $this->context = $context;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match ($this->context) {
            'archive' => 'Archive Confirmation PIN - '.config('app.name'),
            default => 'Password Reset PIN - '.config('app.name'),
        };

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-pin',
            with: [
                'pin' => $this->pin,
                'context' => $this->context,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
