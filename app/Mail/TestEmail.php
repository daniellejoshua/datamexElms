<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TestEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $emailMessage;

    public $emailTitle;

    /**
     * Create a new message instance.
     */
    public function __construct($message = 'This is a test email from Datamex ELMS!', $title = 'Test Email')
    {
        $this->emailMessage = $message;
        $this->emailTitle = $title;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->view('emails.test')
            ->subject($this->emailTitle)
            ->with([
                'emailMessage' => $this->emailMessage,
                'emailTitle' => $this->emailTitle,
            ]);
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
