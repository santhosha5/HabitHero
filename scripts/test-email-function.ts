import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function testEmailFunction() {
  try {
    console.log('Testing email function...');
    
    const testData = {
      recipientEmail: 'test@example.com',
      inviteCode: 'TEST123',
      familyName: 'Test Family',
      inviterName: 'Test User'
    };

    console.log('Sending test data:', testData);

    const { data, error } = await supabaseAdmin.functions.invoke('send-invite-email', {
      body: testData
    });

    if (error) {
      console.error('Error from Edge Function:', error);
      return;
    }

    console.log('Response from Edge Function:', data);
  } catch (error) {
    console.error('Error testing email function:', error);
  }
}

testEmailFunction();
