# Unified Inbox - Multi-Channel Customer Outreach Platform

A comprehensive Next.js application that aggregates messages from SMS (Twilio), WhatsApp (Twilio API), and optionally email and social media into a single unified inbox for seamless customer engagement.

## 🎯 Key Features

- **Unified Inbox**: Centralized view of all messages across channels, threaded by contact
- **Multi-Channel Support**: SMS, WhatsApp (with optional Email, Twitter/X, Facebook Messenger)
- **Real-Time Collaboration**: Live updates via Ably, team notes with visibility controls
- **Message Scheduling**: Schedule messages for future delivery
- **Analytics Dashboard**: Track engagement metrics, response times, and channel performance
- **Contact Management**: Unified contact profiles with full history and notes
- **Role-Based Access**: Viewer, Editor, and Admin roles with appropriate permissions
- **Authentication**: Better Auth with email/password and Google OAuth support

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Better Auth (credentials + Google OAuth)
- **Real-Time**: Pusher Channels for WebSocket updates
- **Integrations**: Twilio SDK (SMS/WhatsApp)
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud like Supabase)
- Twilio account with a trial number (for SMS/WhatsApp)
- Ably account (for real-time features)
- Google OAuth credentials (optional, for Google sign-in)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd unified-inbox
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox?schema=public"

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Ably (for real-time features)
ABLY_API_KEY=your_ably_api_key_here

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_here_min_32_characters
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Environment
NODE_ENV=development

# Next.js
NEXT_PUBLIC_TWILIO_TRIAL_NUMBER=+1234567890
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed demo data
npx prisma db seed
```

### 4. Configure Twilio

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase or use a trial phone number
4. For WhatsApp, set up the [WhatsApp Sandbox](https://www.twilio.com/docs/whatsapp/quickstart)

### 5. Configure Pusher

1. Sign up at [Pusher](https://pusher.com/)
2. Create a Channels app and note App ID, Key, Secret, Cluster
3. Add these to `.env`:
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
   - Client env: `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Run Message Scheduler (Optional)

In a separate terminal, run the scheduler to process scheduled messages:

```bash
npm run scheduler
```

Or set up a cron job to run this script periodically.

## 📱 Usage

### Sending Messages

1. Navigate to the **Inbox** page
2. Click on a contact or use the message composer
3. Select a channel (SMS, WhatsApp, Email)
4. Type your message and click **Send** or **Schedule**

### Scheduling Messages

1. In the message composer, set a date/time in the future
2. Click **Schedule** to queue the message
3. View scheduled messages in the **Dashboard**

### Adding Notes

1. Open a contact's details
2. Scroll to the Notes section
3. Add a note with Public or Private visibility
4. Notes are visible to team members based on visibility settings

### Viewing Analytics

1. Navigate to the **Dashboard** (`/dashboard`)
2. View metrics including:
   - Total messages and contacts
   - Average response time
   - Channel distribution
   - Message volume over time

## 🏗 Architecture

### Database Schema

```mermaid
erDiagram
    User ||--o{ Message : sends
    User ||--o{ Note : creates
    User }o--|| Team : belongs_to
    Team ||--o{ Contact : manages
    Contact ||--o{ Message : receives
    Contact ||--o{ Note : has
    Contact ||--o{ ScheduledMessage : has
    
    User {
        string id
        string email
        enum role
        string teamId
    }
    
    Contact {
        string id
        string name
        string phone
        string email
        json social
    }
    
    Message {
        string id
        string contactId
        string senderId
        enum channel
        enum direction
        string body
        datetime createdAt
    }
    
    Note {
        string id
        string userId
        string contactId
        string body
        enum visibility
    }
    
    ScheduledMessage {
        string id
        string contactId
        enum channel
        string body
        datetime scheduledAt
        enum status
    }
```

### Integration Comparison

| Channel | Latency | Cost/Msg | Reliability | Status |
|---------|---------|----------|-------------|--------|
| SMS (Twilio) | < 5s | ~$0.0075 | 99.9% | ✅ Active |
| WhatsApp (Twilio) | < 10s | ~$0.005 | 99.5% | ✅ Active |
| Email | < 30s | ~$0.0001 | 95% | ⚪ Optional |
| Twitter/X | ~5-15s | Free | 90% | ⚪ Optional |
| Facebook Messenger | ~3-10s | Free | 92% | ⚪ Optional |

**Notes:**
- SMS and WhatsApp are production-ready with Twilio integration
- Email requires Resend API or IMAP setup
- Social media integrations require OAuth app setup

### Key Architectural Decisions

1. **Unified Message Table**: All messages from different channels are normalized into a single `Message` table with a `channel` enum, simplifying queries and analytics.

2. **Contact-Centric Design**: Messages are grouped by contact, making it easy to view full conversation history across channels.

3. **Real-Time Updates**: Ably is used for WebSocket connections, allowing live updates when new messages arrive or notes are added.

4. **Role-Based Access**: Users have roles (VIEWER, EDITOR, ADMIN) that control access to features. Private notes are only visible to their creators.

5. **Factory Pattern for Integrations**: The integration factory (`/lib/integrations/factory.ts`) allows easy addition of new channels without modifying existing code.

6. **Optimistic Updates**: React Query handles optimistic UI updates for better UX.

7. **Scheduled Message Processing**: A separate scheduler script processes scheduled messages, allowing for horizontal scaling.

## 🔒 Security

- Environment variables for sensitive data
- Role-based access control (RBAC)
- Private notes encryption (via Prisma middleware)
- Webhook signature verification (for Twilio)
- OAuth 2.0 for social integrations

## 📝 API Endpoints

### Messages
- `GET /api/messages` - List all messages
- `POST /api/send` - Send a message

### Contacts
- `GET /api/contacts` - List contacts (with search)
- `GET /api/contacts/[id]` - Get contact details
- `POST /api/contacts` - Create contact

### Notes
- `POST /api/notes` - Create a note

### Scheduling
- `GET /api/schedule` - List scheduled messages
- `POST /api/schedule` - Schedule a message

### Analytics
- `GET /api/analytics` - Get analytics data

### Webhooks
- `POST /api/webhooks/twilio` - Receive Twilio webhooks

### Auth
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `GET /api/auth/sign-in/google` - Google OAuth

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t unified-inbox .
docker run -p 3000:3000 --env-file .env unified-inbox
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Twilio for SMS/WhatsApp APIs
- Ably for real-time infrastructure
- Better Auth for authentication
- Next.js team for the excellent framework

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for unified customer communication**
