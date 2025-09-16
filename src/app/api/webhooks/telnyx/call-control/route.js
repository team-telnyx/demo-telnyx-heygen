import { NextResponse } from "next/server";
import axios from "axios";
import {
  createCall,
  updateCallStatus,
  saveTranscript,
  saveCoachingSession,
  logCallEvent
} from '@/lib/database';

export async function POST(request) {
  try {
    console.log("Telnyx webhook received");

    // Parse JSON webhook data
    const requestData = await request.json();
    console.log("Webhook JSON data:", requestData);

    // Extract event data from Telnyx webhook structure
    const event = requestData.data;
    const eventType = event?.event_type;

    console.log("Event type:", eventType);
    console.log("Event data:", event);

    // Log all events to database
    if (event?.call_control_id && eventType) {
      await logCallEvent(event.call_control_id, eventType, event).catch(console.error);
    }

    // Handle different webhook events
    switch (eventType) {
      case "call.initiated":
        await handleCallInitiated(event);
        break;

      case "call.answered":
        await handleCallAnswered(event);
        break;

      case "call.bridged":
        await handleCallBridged(event);
        break;

      case "call.hangup":
        await handleCallHangup(event);
        break;

      case "call.recording.saved":
        await handleRecordingSaved(event);
        break;

      case "call.transcription.available":
        await handleTranscriptionAvailable(event);
        break;

      default:
        console.log("Unhandled event type:", eventType);
        break;
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received",
      eventType,
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing webhook:", error);

    return NextResponse.json({
      success: true,
      message: "Webhook received"
    }, { status: 200 });
  }
}

// Telnyx API configuration
const TELNYX_CONFIG = {
  baseURL: "https://api.telnyx.com/v2",
  headers: {
    "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
};

// Create axios instance for Telnyx API calls
const telnyxAPI = axios.create(TELNYX_CONFIG);

const toBase64 = (data) => Buffer.from(data).toString("base64");
const fromBase64 = (data) => Buffer.from(data, "base64").toString();

// Handle call initiated event
async function handleCallInitiated(event) {
  try {
    console.log("Handling call initiated:", event.call_control_id);

    // Save call to database
    const callData = {
      call_control_id: event.call_control_id,
      call_session_id: event.call_session_id,
      agent_id: event.client_state ? fromBase64(event.client_state) : 'unknown',
      customer_phone: event.from,
      agent_phone: event.to,
      direction: event.direction,
      start_time: event.occurred_at || new Date().toISOString(),
      client_state: event.client_state
    };

    await createCall(callData);
    console.log("Call record created in database");

    // Dial w/ answer on bridge
    const callOptions = {
      bridge_on_answer: "true",
      to: process.env.TELNYX_SIP_USER,
      client_state: toBase64("inbound"),
    };

    // Make dial API call
    const response = await telnyxAPI.post('/calls', callOptions);
    console.log("Dial call response:", response.data);

  } catch (error) {
    console.error("Error handling call initiated:", error);
  }
}

// Handle call answered event
async function handleCallAnswered(event) {
  try {
    console.log("Handling call answered:", event.call_control_id);

    // Update call status in database
    await updateCallStatus(event.call_control_id, 'answered');

    // Start recording with transcription
    const callOptions = {
      format: "wav",
      channels: "dual",
      client_state: toBase64("record-transcribe"),
      play_beep: false,
      transcription: true,
      transcription_engine: "A",
      transcription_speaker_diarization: true
    };

    // Make record start API call
    const response = await telnyxAPI.post(`/calls/${event.call_control_id}/actions/record_start`, callOptions);
    console.log("Record start response:", response.data);

  } catch (error) {
    console.error("Error handling call answered:", error);
  }
}

// Handle call bridged event
async function handleCallBridged(event) {
  try {
    console.log("Handling call bridged:", event.call_control_id);
    await updateCallStatus(event.call_control_id, 'bridged');
  } catch (error) {
    console.error("Error handling call bridged:", error);
  }
}

// Handle call hangup event
async function handleCallHangup(event) {
  try {
    console.log("Handling call hangup:", event.call_control_id);

    const additionalData = {
      end_time: event.occurred_at || new Date().toISOString(),
    };

    // Calculate duration if start_time is available
    if (event.call_duration) {
      additionalData.duration = event.call_duration;
    }

    await updateCallStatus(event.call_control_id, 'completed', additionalData);
  } catch (error) {
    console.error("Error handling call hangup:", error);
  }
}

// Handle recording saved event
async function handleRecordingSaved(event) {
  try {
    console.log("Handling recording saved:", event.call_control_id);

    const additionalData = {
      recording_url: event.recording_url
    };

    await updateCallStatus(event.call_control_id, 'recorded', additionalData);
  } catch (error) {
    console.error("Error handling recording saved:", error);
  }
}

// Handle transcription available event
async function handleTranscriptionAvailable(event) {
  try {
    console.log("Handling transcription available:", event.call_control_id);

    // Save transcript to database
    const transcriptData = {
      call_control_id: event.call_control_id,
      transcript_text: event.transcript_text,
      confidence: event.confidence,
      language: event.language || 'en',
      speaker_labels: event.speaker_labels
    };

    await saveTranscript(transcriptData);
    console.log("Transcript saved to database");

    // Generate coaching content using Telnyx AI
    await generateAndSaveCoaching(event.call_control_id, event.transcript_text);

  } catch (error) {
    console.error("Error handling transcription available:", error);
  }
}

// Generate and save coaching content
async function generateAndSaveCoaching(call_control_id, transcript) {
  try {
    const coachingPrompt = `
Analyze this customer service call transcript and provide coaching feedback for the agent:

Transcript: "${transcript}"

Please provide coaching feedback in the following JSON format:
{
  "strengths": ["List 2-3 things the agent did well"],
  "improvements": ["List 2-3 areas for improvement"],
  "suggestions": ["List 2-3 specific actionable suggestions"],
  "overallScore": 85,
  "avatarScript": "A brief, encouraging script for the AI avatar to deliver this coaching (2-3 sentences)"
}

Focus on communication skills, problem-solving approach, customer empathy, and call resolution effectiveness.
`;

    const response = await axios.post(
      'https://api.telnyx.com/v2/ai/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: coachingPrompt
          }
        ],
        model: 'meta-llama/Llama-3.2-3B-Instruct'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Clean the response
    let cleanedResponse = aiResponse;
    cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const coachingContent = JSON.parse(cleanedResponse);

    // Save coaching session to database
    const sessionData = {
      call_control_id,
      agent_id: 'unknown', // Will be updated when we have proper agent tracking
      coaching_content: coachingContent,
      avatar_script: coachingContent.avatarScript
    };

    await saveCoachingSession(sessionData);
    console.log("Coaching session saved to database");

  } catch (error) {
    console.error("Error generating coaching content:", error);
  }
}