<!DOCTYPE html>
<html>
<head>
    <title>@if($context === 'archive') Archive Confirmation PIN @else Password Reset PIN @endif - {{ config('app.name') }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: transparent;
            color: #333;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            color: #dc2626;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
            color: #6b7280;
        }
        .content {
            padding: 40px 30px;
            background: white;
        }
        .pin-section {
            text-align: center;
            margin: 30px 0;
        }
        .pin-label {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .pin-box {
            background: #dc2626;
            border-radius: 12px;
            padding: 25px;
            display: inline-block;
            margin: 20px 0;
            border: 2px solid #2563eb;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }
        .pin-number {
            font-size: 36px;
            font-weight: 700;
            color: white;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 13px;
        }
        .security-note {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .security-note p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>@if($context === 'archive') Secure Archive Confirmation @else Secure Password Reset @endif</h1>
            <p>@if($context === 'archive') Archive Operation Verification @else Account Security Verification @endif</p>
        </div>

        <div class="content">
            <p>Hello,</p>

            @if($context === 'archive')
                <p>You have initiated an archive operation for your {{ config('app.name') }} account. For your security, we require verification using the 6-digit PIN below:</p>
            @else
                <p>You have requested to update your password for your {{ config('app.name') }} account. For your security, we require verification using the 6-digit PIN below:</p>
            @endif

            <div class="pin-section">
                <div class="pin-label">Your Verification PIN</div>
                <div class="pin-box">
                    <span class="pin-number">{{ $pin }}</span>
                </div>
            </div>

            <div class="security-note">
                <p><strong>Security Notice:</strong> This PIN is valid for 10 minutes and can only be used once. Never share this PIN with anyone.</p>
            </div>

            <div class="warning-box">
                <p><strong>Important:</strong> @if($context === 'archive') If you did not request this archive operation @else If you did not request this password change @endif, please contact our support team immediately or ignore this email.</p>
            </div>

            <p>@if($context === 'archive') If you have any questions about this archive operation @else If you have any questions about your account security @endif, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>The {{ config('app.name') }} @if($context === 'archive') Archive Team @else Security Team @endif</p>
        </div>

        <div class="footer">
            <p><strong>{{ config('app.name') }}</strong></p>
            <p>This is an automated security email. Please do not reply to this message.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>