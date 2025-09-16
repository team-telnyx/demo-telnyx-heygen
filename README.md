# Contact Center AI Coaching Application

An AI-powered coaching platform for contact center agents that leverages Telnyx WebRTC for call handling, Telnyx TeXML for call control, Telnyx AI Inference for transcript analysis, and Heygen Streaming Avatar for personalized coaching delivery.

## Overview

This application provides a complete contact center solution with automated coaching:

- **Inbound Call Handling**: Automatic recording, transcription, and SIP transfer using TeXML
- **Real-time Call Interface**: Agent dashboard with WebRTC integration and inbound call alerts
- **AI-Powered Analysis**: Automatic transcript analysis using Telnyx AI Inference to generate coaching insights
- **Interactive Coaching**: Heygen Streaming Avatar delivers personalized feedback and training sessions

## Features

### 🎯 Core Functionality
- **Automated Inbound Flow**: TeXML-based call recording and SIP transfer
- **Agent Call Interface**: Real-time WebRTC call controls with inbound call alerts
- **Webhook Processing**: Unified webhook handler for all Telnyx events
- **AI Coaching Generation**: Personalized feedback based on call transcriptions
- **Avatar Coaching Sessions**: Interactive training delivery via Heygen avatars

### 🛠 Technical Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Voice Platform**: Telnyx WebRTC SDK, TeXML Call Scripting & AI Inference API
- **Avatar Technology**: Heygen Streaming Avatar SDK v2.1.0
- **Backend**: Next.js API Routes with consolidated webhook handling

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
   # Telnyx Configuration
   TELNYX_API_KEY=your_telnyx_api_key
   TELNYX_ACCOUNT_SID=your_telnyx_account_sid
   NEXT_PUBLIC_TELNYX_JSON_TOKEN=your_telnyx_jwt_token

   # Heygen Configuration
   NEXT_PUBLIC_HEYGEN_API_KEY=your_heygen_api_key
   NEXT_PUBLIC_HEYGEN_AVATAR_ID=Santa_Fireplace_Front_public

   # Webhook Configuration
   WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.app  # For local testing
   # WEBHOOK_BASE_URL=https://your-app.vercel.app     # For production
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

   **TeXML Application Setup:**
   - Configure your TeXML application to use: `${WEBHOOK_BASE_URL}/api/webhooks/telnyx`
   - The webhook handler will automatically route based on request content

   **WebRTC Setup:**
   - Create a SIP connection in your Telnyx console
   - Note your SIP credentials for WebRTC calls

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

1. **Incoming Call**: Calls arrive at your TeXML application endpoint
2. **Automatic Recording**: TeXML responds with Record instruction for transcription
3. **Call Transfer**: After 2 seconds, call is transferred to SIP agent endpoint
4. **Agent Alert**: Dashboard shows incoming call with Answer/Decline buttons
5. **Call Handling**: Agent can answer, hold, mute, or hang up calls
6. **Transcription**: Completed calls automatically generate transcripts and coaching

### Agent Dashboard (`/dashboard`)

1. **WebRTC Connection**: Dashboard automatically connects to Telnyx WebRTC
2. **Inbound Alerts**: Incoming calls display caller information with answer/decline options
3. **Outbound Calls**: Enter phone number and click "Make Call" for outbound
4. **Call Controls**: Use Hold, Mute, and Hang Up during active calls
5. **Real-time Status**: See call status, duration, and connection info

### AI Coaching (`/coaching`)

1. **Generate Coaching**: Paste a call transcript and click "Generate AI Coaching"
2. **Review Feedback**: See strengths, improvements, and suggestions generated by AI
3. **Avatar Session**: Click "Start Avatar Coaching" to begin interactive training
4. **Interactive Experience**: The Heygen avatar will deliver coaching content

## API Endpoints

### Coaching System
- `POST /api/coaching/generate` - Generate coaching content from transcript

### Unified Webhook Handler
- `POST /api/webhooks/telnyx` - Handles all Telnyx webhook types:
  - **Inbound calls**: Returns TeXML for recording and transfer
  - **Call status**: Processes call state changes
  - **Transcriptions**: Generates AI coaching from transcripts
  - **Generic events**: Handles unknown webhook types

### TeXML Integration
- Automatic call recording with transcription
- SIP call transfer to agent endpoints
- Status callbacks for call state tracking

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
1. Create a SIP Connection in your Telnyx console
2. Configure your connection with webhook URLs
3. Enable call recording and transcription if needed
4. Set up AI Inference API access

### Heygen Setup
1. Create a Heygen account and get API access
2. Configure your avatar and obtain the Avatar ID
3. Set up streaming permissions for your application

### Webhook Security
- Implement webhook signature verification in production
- Use HTTPS for all webhook endpoints
- Configure proper CORS settings

## Troubleshooting

### Common Issues

**Telnyx Connection Failed**
- Verify your API keys and public key are correct
- Check that your SIP connection is active
- Ensure webhook URLs are accessible

**Avatar Not Loading**
- Confirm Heygen API key and Avatar ID are set
- Check browser console for WebRTC/media permissions
- Verify Heygen account has streaming avatar access

**Webhook Not Receiving Events**
- Test webhook URLs are publicly accessible
- Check Telnyx console webhook configuration
- Verify webhook endpoints return 200 status

## Production Deployment

For production deployment:

1. **Environment Variables**: Set all required environment variables
2. **Database**: Replace file-based storage with PostgreSQL/MongoDB
3. **Authentication**: Implement proper user authentication
4. **SSL/TLS**: Use HTTPS for all endpoints
5. **Webhook Security**: Implement signature verification
6. **Monitoring**: Add logging and error tracking
7. **Scaling**: Consider containerization with Docker

## License

This project is a demonstration/MVP and is provided as-is for educational purposes.
