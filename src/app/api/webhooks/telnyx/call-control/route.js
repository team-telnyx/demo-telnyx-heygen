import { NextResponse } from "next/server";
import axios from "axios";
import {
	saveCallInitiated,
	saveCallHangup,
	saveTranscript,
	saveCoachingSession,
	logCallEvent,
	appendTranscription,
} from "@/lib/database";
import { transcriptStreamManager } from "@/lib/transcript-stream";

export async function POST(request) {
	try {
		// console.log("Telnyx webhook received");

		// Parse JSON webhook data
		const requestData = await request.json();
		// console.log("Webhook JSON data:", requestData);

		// Extract event data from Telnyx webhook structure
		const event = requestData.data;
		const eventType = event?.event_type;

		// console.log("Event type:", eventType);
		// console.log("Event data:", event);

		// Log all events to database
		if (event?.payload?.call_control_id && eventType) {
			await logCallEvent(event.payload.call_control_id, eventType, event).catch(
				console.error
			);
		}

		// Handle different webhook events
		switch (eventType) {
			case "call.initiated":
				if (event.payload.direction === "incoming") {
					await handleCallInitiated(event);
				} else {
					// console.log("Outbound call initiated");
				}
				break;

			case "call.answered":
				// if (event.payload.client_state) {
				// 	await handleCallAnswered(event);
				// } else {
				// 	console.log("Call answered without client state");
				// }
				break;

			case "call.hangup":
				// Only save calls that don't have client_state (incoming calls)
				if (!event.payload.client_state) {
					await handleCallHangup(event);
				}
				break;

			case "call.transcription":
				// Handle real-time transcription data
				await handleRealtimeTranscription(event);
				break;

			case "call.transcription.saved":
			case "call.recording.transcription.saved":
				await handleTranscriptionSaved(event);
				break;

			default:
				// console.log("Unhandled event type:", eventType);
				break;
		}

		return NextResponse.json(
			{
				success: true,
				message: "Webhook received",
				eventType,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing webhook:", error);

		return NextResponse.json(
			{
				success: true,
				message: "Webhook received",
			},
			{ status: 200 }
		);
	}
}

// Telnyx API configuration
const TELNYX_CONFIG = {
	baseURL: "https://api.telnyx.com/v2",
	headers: {
		Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
		"Content-Type": "application/json",
		Accept: "application/json",
	},
};

// Create axios instance for Telnyx API calls
const telnyxAPI = axios.create(TELNYX_CONFIG);

const toBase64 = (data) => Buffer.from(data).toString("base64");
const fromBase64 = (data) => Buffer.from(data, "base64").toString();

// Handle call hangup event - save call data to database
async function handleCallHangup(event) {
	try {
		// console.log("Handling call hangup:", event.payload.call_session_id);

		const callData = {
			call_session_id: event.payload.call_session_id,
			call_control_id: event.payload.call_control_id,
			start_time: event.payload.start_time,
			end_time: event.payload.end_time || event.occurred_at,
			customer_phone: event.payload.from,
			agent_phone: event.payload.to
		};

		await saveCallHangup(callData);
		// console.log("Call hangup data saved to database");

		// Clear active call from stream manager
		transcriptStreamManager.clearActiveCall();

	} catch (error) {
		console.error("Error handling call hangup:", error);
	}
}

// Handle call initiated event - dial out to agent
async function handleCallInitiated(event) {
	try {
		// console.log("Handling call initiated:", event.payload.call_control_id);

		// Dial to agent/SIP endpoint
		const callOptions = {
			connection_id: process.env.TELNYX_CONNECTION_ID,
			link_to: event.payload.call_control_id,
			bridge_intent: true,
			bridge_on_answer: true,
			to: process.env.TELNYX_SIP_USER,
			from: event.payload.from,
			client_state: toBase64("inbound"),
			transcription: true,
			transcription_config: {
				transcription_engine: "B",
				transcription_model: "openai/whisper-large-v3-turbo",
				transcription_tracks: "both"
			}
		};

		// Make dial API call
		const response = await telnyxAPI.post("/calls", callOptions);
		console.log("Dial call response:", response.data);

		// Save call record to database using the dial response data
		if (response.data && response.data.data) {
			const callData = {
				call_session_id: response.data.data.call_session_id,
				call_control_id: response.data.data.call_control_id,
				customer_phone: event.payload.from,
				agent_phone: event.payload.to,
				start_time: new Date().toISOString()
			};

			await saveCallInitiated(callData);
			console.log("Call record created in database for session:", response.data.data.call_session_id);

			// Set as active call in stream manager
			transcriptStreamManager.setActiveCall(response.data.data.call_session_id);
		}
	} catch (error) {
		console.error("Error handling call initiated:", error);
	}
}

// Handle call answered event - start recording and transcription
async function handleCallAnswered(event) {
	try {
		console.log("Handling call answered:", event.payload.call_control_id);

		// Start recording with transcription
		const recordOptions = {
			format: "wav",
			channels: "dual",
			client_state: toBase64("record-transcribe"),
			play_beep: false,
			transcription: true,
			transcription_engine: "A",
			transcription_language: "en-US",
      // transcription_speaker_diarization: true,
      // transcription_max_speaker_count: 1

		};

		// Make record start API call
		const response = await telnyxAPI.post(
			`/calls/${event.payload.call_control_id}/actions/record_start`,
			recordOptions
		);
		console.log("Record start response:", response.data);
	} catch (error) {
		console.error("Error handling call answered:", error);
	}
}

// Handle transcription saved event - save transcript to database
async function handleTranscriptionSaved(event) {
	try {
		// console.log("Handling transcription saved:", event.payload.call_session_id);

		const transcriptData = {
			call_session_id: event.payload.call_session_id,
			transcript_text: event.payload.transcription_text
		};

		await saveTranscript(transcriptData);
		console.log("Transcript saved to database");

		// Note: Coaching will be generated manually by selecting a previous call
		// await generateAndSaveCoaching(
		//   event.payload.call_session_id,
		//   event.payload.transcription_text
		// );

	} catch (error) {
		console.error("Error handling transcription saved:", error);
	}
}


// Generate and save coaching content
async function generateAndSaveCoaching(call_session_id, transcript) {
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
			"https://api.telnyx.com/v2/ai/chat/completions",
			{
				messages: [
					{
						role: "user",
						content: coachingPrompt,
					},
				],
				model: "meta-llama/Llama-3.2-3B-Instruct",
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		const aiResponse = response.data.choices[0].message.content;

		// Clean the response
		let cleanedResponse = aiResponse;
		cleanedResponse = cleanedResponse.replace(
			/<think>[\s\S]*?<\/think>/gi,
			""
		);
		const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			cleanedResponse = jsonMatch[0];
		}

		const coachingContent = JSON.parse(cleanedResponse);

		// Save coaching session to database
		const sessionData = {
			call_session_id,
			agent_id: "unknown", // Will be updated when we have proper agent tracking
			coaching_content: coachingContent,
			avatar_script: coachingContent.avatarScript,
		};

		await saveCoachingSession(sessionData);
		console.log("Coaching session saved to database");
	} catch (error) {
		console.error("Error generating coaching content:", error);

		// Log detailed error information
		if (error.response) {
			console.error("Error response status:", error.response.status);
			console.error("Error response headers:", error.response.headers);
			console.error("Error response data:", error.response.data);
		} else if (error.request) {
			console.error("No response received:", error.request);
		} else {
			console.error("Error message:", error.message);
		}
	}
}

// Handle real-time transcription event - append transcript segments to database
async function handleRealtimeTranscription(event) {
	try {
		// console.log("Handling real-time transcription:", event.payload.call_session_id);
		// console.log("Full transcription event:", JSON.stringify(event, null, 2));

		// Extract transcription data from webhook payload
		const transcriptionData = event.payload.transcription_data;

		if (!transcriptionData || !transcriptionData.transcript) {
			// console.log("No transcript data found in transcription event");
			return;
		}

		const transcriptionSegment = transcriptionData.transcript.trim();
		const callSessionId = event.payload.call_session_id;
		const transcriptionTrack = transcriptionData.transcription_track;
		const isFinal = transcriptionData.is_final;

		// console.log("Transcription segment:", transcriptionSegment);
		// console.log("Call session ID:", callSessionId);
		// console.log("Track:", transcriptionTrack);
		console.log("Is final:", isFinal);

		// Only process final transcripts to avoid duplicates
		if (isFinal && transcriptionSegment) {
			// Format with speaker indication and newline for readability
			// inbound = agent leg, outbound = caller/customer
			const speakerLabel = transcriptionTrack === "inbound" ? "Agent:" : "Customer:";
			const formattedSegment = `\n${speakerLabel} ${transcriptionSegment}`;

			// Append the transcription segment to the existing transcript
			await appendTranscription(callSessionId, formattedSegment);
			// console.log("Real-time transcription segment appended to database");

			// Push to live stream
			transcriptStreamManager.appendTranscript(callSessionId, formattedSegment);
		} else {
			// console.log("Skipping non-final or empty transcription segment");
		}

	} catch (error) {
		console.error("Error handling real-time transcription:", error);
	}
}
