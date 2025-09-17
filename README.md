# Contact Center AI Coaching Application

An AI-powered coaching platform for contact center agents that leverages Telnyx WebRTC for call handling, Telnyx TeXML for call control, Telnyx AI Inference for transcript analysis, and Heygen Streaming Avatar for personalized coaching delivery.

## Overview

This application provides a complete contact center solution with automated coaching:

- **Inbound Call Handling**: Automatic call routing, recording, and SIP transfer to agents
- **Live Transcription**: Real-time transcription streaming with Server-Sent Events (SSE)
- **Agent Dashboard**: WebRTC-powered agent interface with live call controls
- **AI-Powered Analysis**: Automatic transcript analysis using Telnyx AI to generate coaching insights
- **Interactive Avatar Coaching**: HeyGen Streaming Avatar delivers personalized coaching with voice interaction

## Features

### 🎯 Core Functionality
- **Automated Inbound Flow**: Direct call control API integration with SIP transfer to agent
- **Agent Call Interface**: Real-time WebRTC call controls with inbound call alerts and live audio
- **Live Transcription Streaming**: Real-time transcription via Server-Sent Events (SSE) with speaker identification
- **Webhook Processing**: Unified webhook handler for all Telnyx call control events
- **AI Coaching Generation**: Personalized feedback based on call transcriptions using Telnyx AI Inference
- **Interactive Avatar Coaching**: Two-way voice chat with HeyGen avatars for immersive training sessions
- **Database Integration**: PostgreSQL storage with concurrent-safe transcript updates

### 🛠 Technical Stack
- **Frontend**: Next.js 15.5.3, React 19.1.0, Tailwind CSS
- **Voice Platform**: Telnyx WebRTC SDK, Call Control API, AI Inference API
- **Avatar Technology**: HeyGen Interactive Avatar SDK v2.1.0 with voice chat
- **Database**: PostgreSQL (Neon recommended) with connection pooling
- **Backend**: Next.js API Routes with SSE streaming and webhook handling

## Prerequisites

Before setting up the application, you'll need:

1. **Node.js 18+** and npm
2. **Telnyx Account** with:
   - Voice API access
   - AI Inference API access
   - SIP Connection configured
   - Webhook endpoints set up
3. **Heygen Account** with:
   - Streaming Avatar API access
   - Avatar ID configured

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demo-telnyx-heygen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**

   Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables in `.env.local`:
   ```env
   # Telnyx Configuration - Call Control API
   TELNYX_API_KEY=your_telnyx_api_key
   TELNYX_CONNECTION_ID=your_connection_id
   TELNYX_SIP_USER=sip:your_sip_username@sip.telnyx.com

   # Telnyx WebRTC Client (for Agent Dashboard)
   NEXT_PUBLIC_TELNYX_JSON_TOKEN=your_telnyx_jwt_token_for_webrtc

   # HeyGen Interactive Avatar Configuration
   NEXT_PUBLIC_HEYGEN_API_KEY=your_heygen_api_key
   HEYGEN_API_KEY=your_heygen_api_key
   NEXT_PUBLIC_HEYGEN_AVATAR_ID=Santa_Fireplace_Front_public

   # Database (Neon PostgreSQL recommended)
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

4. **Local Testing with ngrok**

   For local testing, use ngrok to expose your local server:
   ```bash
   # Install ngrok if you haven't already
   npm install -g ngrok

   # Expose your local server (in a separate terminal)
   ngrok http 3000

   # Copy the https URL and set it as WEBHOOK_BASE_URL in your .env
   ```

5. **Telnyx Configuration**

   **Call Control API Setup:**
   - Create a Call Control Application in your Telnyx console
   - Set the webhook URL to: `${YOUR_DOMAIN}/api/webhooks/telnyx/call-control`
   - Enable the following webhook events:
     - `call.initiated`
     - `call.answered`
     - `call.hangup`
     - `call.transcription` (for real-time transcription)
     - `call.transcription.saved` (for final transcripts)

   **WebRTC Setup:**
   - Create a SIP Connection in your Telnyx console
   - Generate a JWT token for WebRTC authentication
   - Note your SIP endpoint for call transfers

   **Database Setup:**
   - Create a PostgreSQL database (Neon recommended)
   - The application will automatically create required tables on first run

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Application Structure

```
src/
├── app/
│   ├── api/
│   │   ├── coaching/       # Coaching generation endpoints
│   │   └── webhooks/
│   │       └── telnyx/     # Unified Telnyx webhook handler
│   ├── dashboard/          # Agent call interface with inbound alerts
│   ├── coaching/           # Avatar coaching interface
│   └── page.js            # Homepage
├── components/
│   ├── Navigation.js       # App navigation
│   └── IncomingCallPopup.js # Inbound call alert UI
└── lib/
    ├── telnyx-client.js    # Telnyx WebRTC integration & call management
    └── heygen-avatar.js    # Heygen avatar management
```

## Usage

### Inbound Call Flow

1. **Incoming Call**: Calls arrive at your Call Control application
2. **Webhook Processing**: `call.initiated` webhook triggers automatic agent dial
3. **SIP Transfer**: Call is bridged to configured SIP endpoint with transcription enabled
4. **Agent Alert**: Dashboard shows incoming call notification with caller details
5. **Call Handling**: Agent can answer, decline, hold, mute, or hang up calls
6. **Live Transcription**: Real-time transcript streams to dashboard via SSE
7. **Call Completion**: Final transcript and coaching generated automatically

### Agent Dashboard (`/dashboard`)

1. **WebRTC Connection**: Dashboard automatically connects using JWT token authentication
2. **Inbound Alerts**: Incoming calls display caller information with answer/decline options
3. **Live Transcription**: Real-time transcript updates via Server-Sent Events (SSE)
4. **Outbound Calls**: Enter phone number and click "Make Call" for outbound calls
5. **Call Controls**: Answer, decline, hold, mute, and hang up during active calls
6. **AI Insights**: Get real-time coaching suggestions during active calls
7. **Connection Status**: Live connection status and call state monitoring

### AI Coaching (`/coaching`)

1. **Generate Coaching**: Paste a call transcript and click "Generate AI Coaching"
2. **Review Feedback**: See strengths, improvements, and suggestions generated by Telnyx AI
3. **Avatar Session**: Click "Start Avatar Coaching" to begin interactive training
4. **Voice Interaction**: Speak directly with the HeyGen avatar for two-way coaching conversation
5. **Real-time Responses**: Avatar provides personalized feedback based on your performance

## API Endpoints

### Coaching System
- `POST /api/coaching/generate` - Generate coaching content from transcript
- `POST /api/coaching/sessions` - Save coaching session data

### Call Control Webhooks
- `POST /api/webhooks/telnyx/call-control` - Handles Telnyx Call Control events:
  - **call.initiated**: Automatically dials agent SIP endpoint with transcription
  - **call.answered**: Logs call connection events
  - **call.hangup**: Saves call completion data
  - **call.transcription**: Streams real-time transcript segments
  - **call.transcription.saved**: Processes final call transcripts

### Live Data Streaming
- `GET /api/transcripts/stream` - Server-Sent Events endpoint for live transcription
- `GET /api/calls/history` - Retrieve call history with transcripts
- `POST /api/calls/insights` - Generate real-time AI insights during calls

### Database Operations
- Concurrent-safe transcript updates using PostgreSQL UPSERT
- Call session tracking with unique identifiers
- Coaching session storage with avatar script generation

## Development

### Testing
```bash
npm test          # Run Playwright tests
npm run test:ui   # Run tests with UI
```

### Building
```bash
npm run build     # Build for production
npm start         # Start production server
```

## Configuration Notes

### Telnyx Setup
1. **Call Control Application**: Create a Call Control app in your Telnyx console
2. **SIP Connection**: Create a SIP connection for agent endpoints
3. **Webhook Configuration**: Set webhook URL to your Call Control endpoint
4. **WebRTC Authentication**: Generate JWT tokens for client authentication
5. **AI Inference Access**: Enable AI Inference API for coaching generation
6. **Real-time Transcription**: Enable transcription with speaker identification

### HeyGen Setup
1. **Account Creation**: Create a HeyGen account with Interactive Avatar access
2. **API Key Generation**: Generate API keys for avatar interaction
3. **Avatar Configuration**: Select and configure your avatar (default: Santa_Fireplace_Front_public)
4. **Voice Chat Setup**: Ensure voice interaction permissions are enabled
5. **Streaming Configuration**: Configure WebSocket streaming for real-time interaction

### Database Setup
1. **PostgreSQL Database**: Create a PostgreSQL database (Neon recommended for production)
2. **Connection Pooling**: Configure connection pooling for concurrent operations
3. **Table Creation**: Tables are auto-created on first application run
4. **Environment Variables**: Set DATABASE_URL with full connection string

### Security Configuration
- **Webhook Security**: Implement signature verification in production
- **HTTPS Requirements**: Use HTTPS for all webhook and SSE endpoints
- **JWT Token Security**: Secure storage of Telnyx JWT tokens
- **CORS Configuration**: Proper CORS settings for WebRTC connections
- **Environment Variables**: Secure handling of API keys and database credentials

## Troubleshooting

### Common Issues

**WebRTC Authentication Failed**
- Verify `NEXT_PUBLIC_TELNYX_JSON_TOKEN` is set correctly
- Ensure JWT token has proper WebRTC permissions
- Check that SIP connection is active in Telnyx console
- Confirm all required environment variables are deployed

**Live Transcription Not Working**
- Check that `call.transcription` webhooks are enabled in Telnyx console
- Verify SSE connection in browser developer tools (Network tab)
- Ensure transcription is enabled in call options with speaker identification
- Check database connection and transcript table structure

**Avatar Voice Chat Issues**
- Confirm HeyGen API key has Interactive Avatar permissions
- Check browser microphone permissions
- Verify WebSocket connection to HeyGen services
- Ensure avatar ID exists and is accessible

**Database Connection Errors**
- Verify `DATABASE_URL` format and credentials
- Check PostgreSQL connection limits and pooling
- Ensure database network accessibility
- Verify SSL/TLS requirements for connection

**SSE Stream Disconnections**
- Check for browser connection limits (typically 6 per domain)
- Verify heartbeat mechanism is functioning
- Monitor server logs for connection errors
- Ensure proper error handling in client EventSource

**Webhook Not Receiving Events**
- Test webhook URLs are publicly accessible (use ngrok for local testing)
- Check Call Control application webhook configuration in Telnyx console
- Verify webhook endpoints return 200 status for all event types
- Enable webhook logging to debug event delivery issues

## Production Deployment

### Vercel Deployment (Recommended)

1. **Repository Connection**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Configure all required environment variables in Vercel dashboard:
   ```
   TELNYX_API_KEY
   TELNYX_CONNECTION_ID
   TELNYX_SIP_USER
   NEXT_PUBLIC_TELNYX_JSON_TOKEN
   NEXT_PUBLIC_HEYGEN_API_KEY
   HEYGEN_API_KEY
   NEXT_PUBLIC_HEYGEN_AVATAR_ID
   DATABASE_URL
   ```
3. **Database Setup**: Use Neon PostgreSQL for production database
4. **Webhook Configuration**: Update Telnyx webhooks to use production domain
5. **SSL/TLS**: Vercel automatically provides HTTPS
6. **Domain Configuration**: Set up custom domain if needed

### Security Considerations

1. **JWT Token Security**: Ensure WebRTC JWT tokens are properly scoped
2. **Webhook Verification**: Implement Telnyx webhook signature verification
3. **Database Security**: Use connection pooling and encrypted connections
4. **API Key Management**: Rotate API keys regularly
5. **CORS Configuration**: Restrict origins in production
6. **Rate Limiting**: Implement rate limiting for API endpoints

### Monitoring and Maintenance

1. **Error Tracking**: Use Vercel Analytics or external error tracking
2. **Database Monitoring**: Monitor PostgreSQL performance and connections
3. **SSE Connection Monitoring**: Track Server-Sent Events connection health
4. **Call Quality Monitoring**: Monitor WebRTC connection quality
5. **Avatar Usage Tracking**: Monitor HeyGen API usage and limits
6. **Webhook Delivery**: Monitor webhook delivery success rates

### Scaling Considerations

1. **Database Connections**: Configure appropriate connection pool sizes
2. **SSE Connections**: Monitor concurrent SSE connection limits
3. **WebRTC Scaling**: Consider load balancing for multiple agents
4. **Avatar Concurrency**: Monitor HeyGen concurrent session limits
5. **Caching**: Implement caching for coaching content and transcripts

## License

This project is a demonstration/MVP and is provided as-is for educational purposes.
