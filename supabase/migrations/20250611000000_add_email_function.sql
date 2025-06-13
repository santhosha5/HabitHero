-- Create a function to send emails using Supabase's smtp.sendmail
create or replace function public.send_family_invite_email(
  recipient_email text,
  invite_code text,
  family_name text,
  inviter_name text default 'A family member'
)
returns json
language plpgsql
security definer
as $$
declare
  site_url text := current_setting('app.settings.site_url', true);
begin
  if site_url is null then
    site_url := 'http://localhost:3000';
  end if;

  perform net.http_post(
    url := 'https://api.supabase.com/v1/project/' || current_setting('app.settings.project_ref') || '/email/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'template_id', 'family-invite', -- You would need to create this template in Supabase
      'to', recipient_email,
      'subject', inviter_name || ' invited you to join their family on HabitHero',
      'data', jsonb_build_object(
        'invite_code', invite_code,
        'family_name', family_name,
        'inviter_name', inviter_name,
        'site_url', site_url
      )
    )
  );

  return json_build_object(
    'success', true,
    'message', 'Invitation email sent successfully'
  );
exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;
