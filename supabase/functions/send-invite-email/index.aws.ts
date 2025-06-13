import { serve } from "https://deno.land/std@0.181.0/http/server.ts"
import { createClient } from "npm:@aws-sdk/client-ses"

const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ses = new createClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { recipientEmail, inviteCode, familyName, inviterName } = await req.json()
    const senderName = inviterName || 'A family member'
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:3000'

    const params = {
      Source: 'HabitHero <no-reply@yourdomain.com>',
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Data: `${senderName} invited you to join their family on HabitHero`,
        },
        Body: {
          Html: {
            Data: `
              <h1>You've been invited to join ${familyName} on HabitHero!</h1>
              <p>${senderName} has invited you to join their family group.</p>
              <p>Your invite code is: <strong>${inviteCode}</strong></p>
              <p><a href="${siteUrl}/family/join?code=${inviteCode}">Click here to join</a></p>
            `,
          },
        },
      },
    }

    const result = await ses.sendEmail(params)
    return new Response(JSON.stringify({ success: true, messageId: result.MessageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
