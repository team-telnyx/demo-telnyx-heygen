import { NextResponse } from "next/server";
import axios from "axios";
import {
	saveCallHangup,
	saveTranscript,
	saveCoachingSession,
	logCallEvent,
} from "@/lib/database";

export async function POST(request) {
	try {
		console.log("Telnyx webhook received");

		// Parse JSON webhook data
		const requestData = await request.json();
		console.log("Webhook JSON data:", requestData);

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
			case "call.hangup":
				// Only save calls that don't have client_state (incoming calls)
				if (!event.payload.client_state) {
					await handleCallHangup(event);
				}
				break;

			case "call.transcription.saved":
			case "call.recording.transcription.saved":
				await handleTranscriptionSaved(event);
				break;

			default:
				console.log("Unhandled event type:", eventType);
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
		console.log("Handling call hangup:", event.payload.call_session_id);

		const callData = {
			call_session_id: event.payload.call_session_id,
			call_control_id: event.payload.call_control_id,
			start_time: event.payload.start_time,
			end_time: event.payload.end_time || event.occurred_at,
			customer_phone: event.payload.from,
			agent_phone: event.payload.to
		};

		await saveCallHangup(callData);
		console.log("Call hangup data saved to database");

	} catch (error) {
		console.error("Error handling call hangup:", error);
	}
}

// Handle transcription saved event - save transcript to database
async function handleTranscriptionSaved(event) {
	try {
		console.log("Handling transcription saved:", event.payload.call_session_id);

		const transcriptData = {
			call_session_id: event.payload.call_session_id,
			transcript_text: event.payload.transcription_text
		};

		await saveTranscript(transcriptData);
		console.log("Transcript saved to database");

		// Generate coaching content after transcript is saved
		await generateAndSaveCoaching(
			event.payload.call_session_id,
			event.payload.transcription_text
		);

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
	}
}
