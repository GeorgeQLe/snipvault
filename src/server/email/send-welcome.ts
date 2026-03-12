import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name?: string | null) {
  try {
    const displayName = name || 'there';

    await resend.emails.send({
      from: 'SnipVault <noreply@snipvault.dev>',
      to: email,
      subject: 'Welcome to SnipVault!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">
        SnipVault
      </h1>
    </div>

    <div style="background-color: #171717; border: 1px solid #262626; border-radius: 12px; padding: 32px;">
      <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">
        Welcome, ${displayName}!
      </h2>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 16px 0;">
        Thanks for joining SnipVault. Your AI-powered code snippet manager is ready to use.
      </p>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
        Here's what you can do:
      </p>

      <ul style="color: #a3a3a3; line-height: 1.8; padding-left: 20px; margin: 0 0 24px 0;">
        <li>Save and organize code snippets with collections and tags</li>
        <li>Search through your snippets with AI-powered semantic search</li>
        <li>Import snippets from GitHub Gists</li>
        <li>Use the VS Code extension for seamless access</li>
      </ul>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}"
         style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Open SnipVault
      </a>
    </div>

    <p style="color: #525252; font-size: 12px; text-align: center; margin-top: 24px;">
      You're receiving this because you signed up for SnipVault.
    </p>
  </div>
</body>
</html>
      `.trim(),
    });
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
  }
}
