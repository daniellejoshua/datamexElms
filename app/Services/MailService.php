<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class MailService
{
    protected $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->configureMailer();
    }

    /**
     * Configure PHPMailer settings
     */
    protected function configureMailer()
    {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = config('mail.mailers.smtp.host', 'smtp.gmail.com');
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = config('mail.mailers.smtp.username');
            $this->mailer->Password = config('mail.mailers.smtp.password');
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = config('mail.mailers.smtp.port', 587);

            // Default sender
            $this->mailer->setFrom(
                config('mail.from.address', 'admin@datamex-elms.edu.ph'),
                config('mail.from.name', 'Datamex ELMS')
            );

        } catch (Exception $e) {
            throw new \Exception('Mailer configuration failed: '.$e->getMessage());
        }
    }

    /**
     * Send a simple text email
     */
    public function sendTextEmail(string $to, string $subject, string $body, array $options = [])
    {
        try {
            $this->resetMailer();

            $this->mailer->addAddress($to);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->isHTML(false);

            // Add CC if provided
            if (isset($options['cc'])) {
                foreach ((array) $options['cc'] as $cc) {
                    $this->mailer->addCC($cc);
                }
            }

            // Add BCC if provided
            if (isset($options['bcc'])) {
                foreach ((array) $options['bcc'] as $bcc) {
                    $this->mailer->addBCC($bcc);
                }
            }

            return $this->mailer->send();

        } catch (Exception $e) {
            throw new \Exception('Failed to send email: '.$this->mailer->ErrorInfo);
        }
    }

    /**
     * Send an HTML email
     */
    public function sendHtmlEmail(string $to, string $subject, string $htmlBody, ?string $textBody = null, array $options = [])
    {
        try {
            $this->resetMailer();

            $this->mailer->addAddress($to);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlBody;
            $this->mailer->isHTML(true);

            // Add text alternative if provided
            if ($textBody) {
                $this->mailer->AltBody = $textBody;
            }

            // Add CC if provided
            if (isset($options['cc'])) {
                foreach ((array) $options['cc'] as $cc) {
                    $this->mailer->addCC($cc);
                }
            }

            // Add BCC if provided
            if (isset($options['bcc'])) {
                foreach ((array) $options['bcc'] as $bcc) {
                    $this->mailer->addBCC($bcc);
                }
            }

            // Add attachments if provided
            if (isset($options['attachments'])) {
                foreach ($options['attachments'] as $attachment) {
                    if (is_array($attachment)) {
                        $this->mailer->addAttachment($attachment['path'], $attachment['name'] ?? '');
                    } else {
                        $this->mailer->addAttachment($attachment);
                    }
                }
            }

            return $this->mailer->send();

        } catch (Exception $e) {
            throw new \Exception('Failed to send HTML email: '.$this->mailer->ErrorInfo);
        }
    }

    /**
     * Send email using Laravel's Mail facade (alternative method)
     */
    public function sendUsingLaravel(string $to, string $subject, string $view, array $data = [], array $options = [])
    {
        try {
            $mailData = array_merge($data, [
                'subject' => $subject,
            ]);

            Mail::send($view, $mailData, function ($message) use ($to, $subject, $options) {
                $message->to($to)
                    ->subject($subject);

                // Add CC if provided
                if (isset($options['cc'])) {
                    $message->cc($options['cc']);
                }

                // Add BCC if provided
                if (isset($options['bcc'])) {
                    $message->bcc($options['bcc']);
                }

                // Add attachments if provided
                if (isset($options['attachments'])) {
                    foreach ($options['attachments'] as $attachment) {
                        if (is_array($attachment)) {
                            $message->attach($attachment['path'], ['as' => $attachment['name'] ?? '']);
                        } else {
                            $message->attach($attachment);
                        }
                    }
                }
            });

            return true;

        } catch (\Exception $e) {
            throw new \Exception('Failed to send Laravel email: '.$e->getMessage());
        }
    }

    /**
     * Send bulk emails
     */
    public function sendBulkEmail(array $recipients, string $subject, string $body, bool $isHtml = false, array $options = [])
    {
        $results = [];
        $errors = [];

        foreach ($recipients as $recipient) {
            try {
                if ($isHtml) {
                    $this->sendHtmlEmail($recipient, $subject, $body, null, $options);
                } else {
                    $this->sendTextEmail($recipient, $subject, $body, $options);
                }
                $results[] = $recipient;
            } catch (\Exception $e) {
                $errors[$recipient] = $e->getMessage();
            }
        }

        return [
            'successful' => $results,
            'failed' => $errors,
        ];
    }

    /**
     * Reset mailer for reuse
     */
    protected function resetMailer()
    {
        $this->mailer->clearAddresses();
        $this->mailer->clearCCs();
        $this->mailer->clearBCCs();
        $this->mailer->clearAttachments();
    }

    /**
     * Test email configuration
     */
    public function testConnection(?string $testEmail = null)
    {
        try {
            $this->resetMailer();

            $testEmail = $testEmail ?? config('mail.from.address');

            $this->mailer->addAddress($testEmail);
            $this->mailer->Subject = 'Test Email - Datamex ELMS';
            $this->mailer->Body = 'This is a test email to verify your mail configuration is working correctly.';
            $this->mailer->isHTML(false);

            return $this->mailer->send();

        } catch (Exception $e) {
            throw new \Exception('Test email failed: '.$this->mailer->ErrorInfo);
        }
    }
}
