# Setting up Email for HabitHero

## Production Email Setup with Resend

1. Domain Verification
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Click "Add Domain"
   - Enter your domain (e.g., habithero.com)
   - Add the following DNS records to your domain:

   ```
   Type: TXT
   Name: @
   Value: resend-domain-verification=your-verification-code
   ```

   ```
   Type: MX
   Name: @
   Value: mail.resend.com
   Priority: 10
   ```

   ```
   Type: DKIM
   Name: dkim._domainkey
   Value: (provided by Resend)
   ```

2. Environment Variables
   Set the following environment variables in Supabase:
   ```bash
   EMAIL_DOMAIN=notifications@habithero.com
   PUBLIC_SITE_URL=https://habithero.com
   ```

3. Testing Production Setup
   ```bash
   # Update test script with production values
   PUBLIC_SITE_URL=https://habithero.com \
   EMAIL_DOMAIN=notifications@habithero.com \
   ./scripts/test-email.sh
   ```

## Development Setup

For development, use the Resend test email (delivered@resend.dev) and onboarding domain:
```bash
EMAIL_DOMAIN=onboarding@resend.dev
PUBLIC_SITE_URL=http://localhost:3000
```

## Email Templates

The invitation email template includes:
- Personalized greeting with inviter's name
- Family name and invite code
- Direct join link
- Mobile-responsive design
- Fallback text for accessibility

## Rate Limiting

The email service includes:
- Rate limit of 20 emails per hour per recipient
- Automatic cleanup of rate limit records
- Error handling for rate limit exceeds
