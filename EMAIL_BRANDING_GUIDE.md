# Supabase Email Branding Guide (2026 Style)

To customize the "Reset Password" email sent to users, follow these steps in your Supabase Dashboard:

## 1. Navigate to Email Template
1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password**

## 2. Update Subject Line
Change `Subject` to something modern and friendly:
```
Reset your Mirhal password 🔐
```

## 3. Update Email Body (HTML)
Copy and paste this minimal, branded HTML template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
    <div style="max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center;">
            <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Mirhal</h1>
        </div>

        <!-- Content -->
        <div style="padding: 20px 40px 40px 40px; text-align: center;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">Reset your password</h2>
            <p style="color: #666666; font-size: 15px; line-height: 1.5; margin: 16px 0 32px 0;">
                We received a request to reset the password for your Mirhal account. Click the button below to proceed.
            </p>

            <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #ff7119; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; transition: opacity 0.2s;">
                Reset Password
            </a>

            <p style="color: #999999; font-size: 13px; margin-top: 32px; margin-bottom: 0;">
                If you didn't request this change, you can safely ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999999;">
            &copy; 2026 Mirhal Inc. All rights reserved.<br>
            Need help? Contact us at <a href="mailto:support@mirhal.com" style="color: #666666; text-decoration: underline;">support@mirhal.com</a>
        </div>
    </div>
</body>
</html>
```

## 4. Save
Click **Save** to apply the changes.

---

## Notes
- The link `{{ .ConfirmationURL }}` is automatically replaced by Supabase with the magic reset link.
- This template is responsive and works on mobile/desktop.
- Uses your brand color `#ff7119`.
