#!/bin/bash

# Source the environment variables
source /Users/santhoshadiga/Documents/habithero/supabase/functions/send-invite-email/.env 2>/dev/null || true

# Ensure environment variables are set
if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "Error: SERVICE_ROLE_KEY not set"
  exit 1
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo "Error: RESEND_API_KEY not set"
  exit 1
fi

# Test data - using verified email
TEST_DATA='{
  "recipientEmail": "santhosha.a5@gmail.com",
  "inviteCode": "TEST123",
  "familyName": "Test Family",
  "inviterName": "Test User"
}'

echo "Testing email function locally..."
echo "Request body: $TEST_DATA"

# Call the local function endpoint
curl -i \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d "$TEST_DATA" \
  https://dzzjjujcurshguovhmdc.supabase.co/functions/v1/send-invite-email
