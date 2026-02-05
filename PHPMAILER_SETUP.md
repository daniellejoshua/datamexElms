# Laravel Email Setup Guide for Datamex ELMS

## ✅ Laravel Built-in Mail Setup (Recommended)

Laravel has excellent built-in mail functionality that is more secure, better integrated, and easier to maintain than PHPMailer.

### 1. Email Configuration (.env file)
```env
# Gmail SMTP Configuration (Already configured)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="admin@datamex-elms.edu.ph"
MAIL_FROM_NAME="Datamex ELMS"
```

### 2. Gmail Setup Steps
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - App passwords → Generate a new app password
   - Use this password in MAIL_PASSWORD (not your regular password)

### 3. Test Your Email Setup

Run the test command:
```bash
vendor/bin/sail artisan email:test your-email@example.com
```

This will send two test emails:
- One using the Mailable class (HTML template)
- One using raw text

### 4. How to Send Emails in Your Code

#### Using Mailable Class (Recommended):
```php
use App\Mail\TestEmail;
use Illuminate\Support\Facades\Mail;

// Send email
Mail::to('recipient@example.com')->send(new TestEmail(
    message: 'Your custom message',
    title: 'Custom Subject'
));
```

#### Using Raw Mail:
```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Email content here', function ($message) {
    $message->to('recipient@example.com')
            ->subject('Subject Here');
});
```

#### Using HTML Templates:
```php
Mail::send('emails.template', $data, function ($message) {
    $message->to('recipient@example.com')
            ->subject('Subject Here');
});
```

### 5. Available Email Templates
- `resources/views/emails/test.blade.php` - Basic HTML email template

### 6. Alternative Email Providers

#### Outlook/Hotmail:
```env
MAIL_HOST=smtp.live.com
MAIL_PORT=587
```

#### Yahoo:
```env
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
```

#### Custom SMTP:
```env
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
```

## 📧 What You Have Now:

1. ✅ **Mailable Class**: `app/Mail/TestEmail.php`
2. ✅ **Email Template**: `resources/views/emails/test.blade.php`
3. ✅ **Test Command**: `php artisan email:test`
4. ✅ **Mail Service**: `app/Services/MailService.php` (for advanced features)

## 🚀 Next Steps:

1. **Update .env** with your real Gmail credentials
2. **Test the setup** using the artisan command
3. **Create more email templates** as needed
4. **Use in your controllers** for notifications, password resets, etc.

Laravel's mail system is production-ready and handles queuing, attachments, and more!