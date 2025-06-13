#!/bin/bash

# Source production environment if it exists
if [ -f .env.production ]; then
  export $(cat .env.production | xargs)
fi

# Override test data for production verification
TEST_DATA='{
  "recipientEmail": "delivered@resend.dev",
  "inviteCode": "PRODTST",
  "familyName": "Production Test Family",
  "inviterName": "Production Test User"
}'

echo "Testing production email configuration..."
echo "Using domain: $REACT_APP_EMAIL_DOMAIN"
echo "Using site URL: $REACT_APP_PUBLIC_SITE_URL"
echo "Request body: $TEST_DATA"

# Call the deployed function
curl -i \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d "$TEST_DATA" \
  https://dzzjjujcurshguovhmdc.supabase.co/functions/v1/send-invite-email
