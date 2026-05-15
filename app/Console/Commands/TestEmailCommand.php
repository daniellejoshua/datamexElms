<?php

namespace App\Console\Commands;

use App\Mail\TestEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email? : The email address to send test to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify email configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? 'test@example.com';

        $this->info("Sending test email to: {$email}");

        try {
            // Method 1: Using Mailable class
            Mail::to($email)->send(new TestEmail(
                message: 'This is a test email sent from Datamex ELMS using Laravel\'s built-in mail system.',
                title: 'Test Email from Datamex ELMS'
            ));

            $this->info('✅ Test email sent successfully using Mailable class!');

            // Method 2: Using raw mail (alternative)
            $this->newLine();
            $this->info('Testing raw email method...');

            Mail::raw('This is a raw text test email from Datamex ELMS.', function ($message) use ($email) {
                $message->to($email)
                    ->subject('Raw Test Email - Datamex ELMS');
            });

            $this->info('✅ Raw test email sent successfully!');

        } catch (\Exception $e) {
            $this->error('❌ Failed to send email: '.$e->getMessage());

            return 1;
        }

        $this->newLine();
        $this->info('📧 Check your inbox for the test emails!');
        $this->info('📝 If you don\'t see them, check your spam folder.');

        return 0;
    }
}
