# HomeOps Email Templates - Import Guide

## Templates Created
I've created branded email templates for your HomeOps.AI project that match your purple gradient branding and dark theme:

1. **confirmation.html** - Signup verification email
2. **recovery.html** - Password reset email
3. **Magic Link** and other templates (in progress)

## How to Import These Templates

### Option 1: Supabase Dashboard (Recommended)

1. Go to your project dashboard: https://supabase.com/dashboard/project/syfswllamnyunfpmnslg/auth/templates
2. For each email template:
   - Click on the template you want to update (e.g., "Confirm signup")
   - Copy the HTML content from the files I created
   - Paste it into the "Content" field
   - Update the subject line to match HomeOps branding
   - Click "Save"

### Option 2: Management API (Advanced)

If you have a Supabase access token, you can use the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="syfswllamnyunfpmnslg"

# Update confirmation email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
      "mailer_subjects_confirmation": "Welcome to HomeOps! Confirm your account",
      "mailer_templates_confirmation_content": "<!-- HTML content from confirmation.html -->"
  }'
```

### Option 3: Local Development Config

If you're using Supabase CLI for local development, create a `supabase/config.toml` file:

```toml
[auth.email.template.confirmation]
subject = "Welcome to HomeOps! Confirm your account"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your HomeOps password"
content_path = "./supabase/templates/recovery.html"
```

Then restart your local Supabase:
```bash
supabase stop && supabase start
```

## Template Features

✅ **HomeOps.AI Branding** - Purple gradient header with logo
✅ **Dark Theme** - Matches your application's dark styling
✅ **Responsive Design** - Works on mobile and desktop
✅ **Security Notes** - Clear security messaging for users
✅ **Alternative Authentication** - Both buttons and OTP codes
✅ **Professional Footer** - Contact info and company branding

## Recommended Subject Lines

- **Confirmation**: "Welcome to HomeOps! Confirm your account"
- **Recovery**: "Reset your HomeOps password"
- **Magic Link**: "Your secure HomeOps login link"
- **Invite**: "You're invited to join HomeOps"
- **Email Change**: "Confirm your new email address"

## Next Steps

1. Import the templates using Option 1 (Dashboard) - it's the easiest
2. Test the templates by creating a test account
3. Customize any additional messaging or branding as needed
4. Consider setting up custom domain email sending for production

Would you like me to create the remaining templates (magic link, invite, email change) as well?