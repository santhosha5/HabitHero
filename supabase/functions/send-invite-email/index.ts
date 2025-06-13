import { serve } from "https://deno.land/std@0.181.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_API_URL = "https://api.resend.com/emails"
const MAX_EMAILS_PER_HOUR = 20 // Rate limit

// Update the email configuration to use Resend's test mode
const EMAIL_DOMAIN = 'onboarding@resend.dev'
const FROM_EMAIL = `HabitHero <${EMAIL_DOMAIN}>`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email validation schema
const EmailRequestSchema = z.object({
  recipientEmail: z.string().email(),
  inviteCode: z.string().min(6),
  familyName: z.string().min(1),
  inviterName: z.string().optional()
})

type EmailRequest = z.infer<typeof EmailRequestSchema>

interface ResendEmailResponse {
  id?: string
  error?: {
    message: string
    name: string
    statusCode: number
  }
}

// Rate limiting map
const emailsSentMap = new Map<string, { count: number; timestamp: number }>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const hourAgo = now - 3600000 // 1 hour in milliseconds
  const record = emailsSentMap.get(email)
  
  if (!record || record.timestamp < hourAgo) {
    return false
  }
  
  return record.count >= MAX_EMAILS_PER_HOUR
}

function trackEmailSent(email: string) {
  const now = Date.now()
  const record = emailsSentMap.get(email)
  
  if (!record || record.timestamp < now - 3600000) {
    emailsSentMap.set(email, { count: 1, timestamp: now })
  } else {
    emailsSentMap.set(email, {
      count: record.count + 1,
      timestamp: record.timestamp
    })
  }
}

function generateEmailHtml(data: EmailRequest, siteUrl: string): string {
  const { familyName, inviteCode, inviterName } = data
  const senderName = inviterName || 'A family member'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${familyName} on HabitHero</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          h1 { color: #2563eb; margin-bottom: 20px; }
          .invite-code { 
            background: #f3f4f6; 
            padding: 10px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 1.2em; 
            margin: 20px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { 
            margin-top: 30px; 
            font-size: 0.9em; 
            color: #6b7280; 
          }
        </style>
      </head>
      <body>
        <h1>You've been invited to join ${familyName} on HabitHero! 🎉</h1>
        <p>${senderName} has invited you to join their family group. Join them to share habits, track progress, and motivate each other!</p>
        <div class="invite-code">Your invite code: <strong>${inviteCode}</strong></div>
        <a href="${siteUrl}/family/join?code=${inviteCode}" class="cta-button">Join Family</a>
        <div class="footer">
          <p>If you can't click the button, copy and paste this link into your browser:</p>
          <p>${siteUrl}/family/join?code=${inviteCode}</p>
        </div>
      </body>
    </html>
  `
}

const resend = new Resend(RESEND_API_KEY);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    if (!RESEND_API_KEY) {
      throw new Error('Missing Resend API key')
    }

    console.log('Environment check:', {
      hasResendKey: !!RESEND_API_KEY,
      emailDomain: EMAIL_DOMAIN,
      siteUrl: Deno.env.get('PUBLIC_SITE_URL')
    })

    const rawBody = await req.json()
    console.log('Request body:', JSON.stringify(rawBody, null, 2))

    // Validate request body
    const parseResult = EmailRequestSchema.safeParse(rawBody)
    if (!parseResult.success) {
      throw new Error(
        `Invalid request data: ${parseResult.error.errors.map((e: { message: string }) => e.message).join(', ')}`
      )
    }

    const { recipientEmail } = parseResult.data

    // Check rate limit
    if (isRateLimited(recipientEmail)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:3000'
    console.log('Sending email via Resend API...')
    
    // Track email attempt before sending
    trackEmailSent(recipientEmail)

    const emailPayload = {
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Join ${parseResult.data.familyName} on HabitHero`,
      html: generateEmailHtml(parseResult.data, siteUrl)
    }

    console.log('Email payload:', JSON.stringify(emailPayload, null, 2))

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Join ${parseResult.data.familyName} on HabitHero`,
      html: emailPayload.html,
    });

    if (error) {
      console.error('Resend API error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log('Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true, data: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in Edge Function:', error)
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})