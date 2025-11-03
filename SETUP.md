# Setup Guide - Unified Inbox

## Quick Setup Checklist

### 1. Environment Variables
Copy the example env file (create `.env` from the variables listed in README.md):
- `DATABASE_URL` - PostgreSQL connection string
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (e.g., +1234567890)
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp number (e.g., whatsapp:+1234567890)
- Pusher (Realtime):
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
  - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
- `BETTER_AUTH_SECRET` - Secret key (min 32 characters)
- `BETTER_AUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - (Optional) For Google OAuth
- `GOOGLE_CLIENT_SECRET` - (Optional) For Google OAuth

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Run the Application
```bash
# Development server
npm run dev

# In a separate terminal, run the scheduler (for scheduled messages)
npm run scheduler
```

### 4. Twilio Webhook Setup
1. Go to Twilio Console → Phone Numbers → Your Number
2. Set webhook URL for incoming messages: `https://your-domain.com/api/webhooks/twilio`
3. For WhatsApp Sandbox, configure in Twilio Console → Messaging → Try it out → Send a WhatsApp message

### 5. First User
1. Navigate to http://localhost:3000
2. You'll be redirected to `/login`
3. Click "Sign up" to create an account
4. After signup, you'll be redirected to the inbox

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`

### Twilio Errors
- Verify your Account SID and Auth Token are correct
- For trial accounts, you can only send to verified numbers
- Check Twilio Console for error logs

### Authentication Issues
- Ensure `BETTER_AUTH_SECRET` is at least 32 characters
- For Google OAuth, ensure redirect URLs are configured in Google Console

### Scheduler Not Running
- Make sure you're running `npm run scheduler` in a separate terminal
- Check that node-cron is installed: `npm install node-cron`

## Next Steps
- Configure email integration (Resend, SendGrid, or Nodemailer)
- Set up production database (Supabase, Railway, etc.)
- Configure social media integrations (Twitter, Facebook)


