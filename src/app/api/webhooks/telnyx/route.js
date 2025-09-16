import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    const userAgent = request.headers.get('user-agent') || '';

    console.log('Telnyx webhook received');
    console.log('Content-Type:', contentType);
    console.log('User-Agent:', userAgent);

    let requestData = {};

    // Parse request data based on content type
    if (contentType?.includes('application/json')) {
      requestData = await request.json();
      console.log('Webhook JSON data:', requestData);
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData);
      console.log('Webhook form data:', requestData);
    } else {
      const textData = await request.text();
      console.log('Webhook text data:', textData);
      requestData = { rawText: textData };
    }

    // Determine webhook type based on content
    const webhookType = determineWebhookType(requestData, userAgent);
    console.log('Determined webhook type:', webhookType);

    switch (webhookType) {
      case 'inbound':
        return await handleInboundCall(requestData);
      case 'transcription':
        return await handleTranscription(requestData);
      case 'call-status':
        return await handleCallStatus(requestData);
      default:
        return await handleGenericWebhook(requestData);
    }

  } catch (error) {
    console.error('Error processing Telnyx webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Determine webhook type based on request data
function determineWebhookType(requestData, userAgent) {
  // Check for transcription indicators
  if (requestData.TranscriptionText || requestData.transcript_text) {
    return 'transcription';
  }

  // Check for call status indicators
  if (requestData.CallStatus) {
    return 'call-status';
  }

  // Check for inbound call indicators
  if (requestData.CallSid && !requestData.TranscriptionText && !requestData.CallStatus) {
    return 'inbound';
  }

  // Default to generic
  return 'generic';
}

// Handle inbound call webhooks
async function handleInboundCall(requestData) {
  try {
    console.log('Processing inbound call webhook');

    // Extract call ID from the request for potential transfer
    const callId = requestData.CallSid || requestData.call_control_id || requestData.call_session_id;
    console.log('Call ID:', callId);

    // Get webhook base URL from environment
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Respond with TeXML to start recording with transcription
    const texmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Record
        playBeep="false"
        transcription="true"
        transcriptionEngine="A"
        transcriptionCallback="${webhookBaseUrl}/api/webhooks/telnyx/transcription"/>
</Response>`;

    console.log('Responding with TeXML to start recording');

    // After responding, schedule the transfer call
    if (callId) {
      console.log('Scheduling call transfer for:', callId);
      // Use setTimeout to allow the Record response to be processed first
      setTimeout(() => {
        transferCall(callId).catch(error => {
          console.error('Error in scheduled transfer:', error);
        });
      }, 2000); // 2 second delay to ensure Record is processed
    }

    return new NextResponse(texmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml'
      }
    });

  } catch (error) {
    console.error('Error processing inbound webhook:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Error processing call.</Say>
</Response>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    );
  }
}

// Handle call status webhooks
async function handleCallStatus(requestData) {
  try {
    console.log('Processing call status webhook');

    // Extract call status data
    const callStatusData = {
      callId: requestData.CallSid || requestData.call_control_id || requestData.call_session_id,
      callStatus: requestData.CallStatus,
      callDuration: requestData.CallDuration,
      recordingUrl: requestData.RecordingUrl,
      from: requestData.From,
      to: requestData.To,
      direction: requestData.Direction,
      startTime: requestData.StartTime,
      endTime: requestData.EndTime,
      accountSid: requestData.AccountSid,
      timestamp: requestData.timestamp || new Date().toISOString()
    };

    console.log('Processed call status data:', callStatusData);

    // Handle different call statuses
    switch (callStatusData.callStatus?.toLowerCase()) {
      case 'ringing':
        console.log('Call ringing:', callStatusData.callId);
        break;

      case 'answered':
      case 'in-progress':
        console.log('Call answered/in-progress:', callStatusData.callId);
        break;

      case 'completed':
      case 'hangup':
        console.log('Call completed:', callStatusData.callId);
        // Could trigger post-call processes here
        await handleCallCompleted(callStatusData);
        break;

      case 'busy':
        console.log('Call busy:', callStatusData.callId);
        break;

      case 'no-answer':
        console.log('Call no answer:', callStatusData.callId);
        break;

      case 'failed':
        console.log('Call failed:', callStatusData.callId);
        break;

      default:
        console.log('Unknown call status:', callStatusData.callStatus, 'for call:', callStatusData.callId);
    }

    // Return JSON response
    return NextResponse.json({
      success: true,
      message: 'Call status processed successfully',
      callId: callStatusData.callId,
      status: callStatusData.callStatus
    });

  } catch (error) {
    console.error('Error processing call status webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process call status webhook' },
      { status: 500 }
    );
  }
}

// Handle transcription webhooks
async function handleTranscription(requestData) {
  try {
    console.log('Processing transcription webhook');

    // Extract transcription data
    const transcriptionData = {
      callId: requestData.CallSid || requestData.CallSidLegacy,
      transcript: requestData.TranscriptionText || requestData.transcript_text,
      recordingUrl: requestData.RecordingUrl,
      callStatus: requestData.CallStatus,
      from: requestData.From,
      to: requestData.To,
      transcriptionSid: requestData.TranscriptionSid,
      accountSid: requestData.AccountSid
    };

    console.log('Processed transcription data:', transcriptionData);

    // Generate coaching content if we have a transcript
    if (transcriptionData.transcript) {
      console.log('Generating coaching content for call:', transcriptionData.callId);

      try {
        const coachingContent = await generateCoachingContent(transcriptionData.transcript);
        console.log('Generated coaching content:', coachingContent);

        // TODO: Store coaching content and trigger avatar session
        // Could integrate with HeyGen avatar here for automatic coaching delivery

      } catch (error) {
        console.error('Error generating coaching content:', error);
      }
    }

    // Return appropriate response format
    if (contentType?.includes('xml')) {
      // Return TwiML response for XML webhooks
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Transcription received and coaching generated.</Say>
</Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'application/xml' }
        }
      );
    } else {
      // Return JSON response
      return NextResponse.json({
        success: true,
        message: 'Transcription processed successfully',
        callId: transcriptionData.callId
      });
    }

  } catch (error) {
    console.error('Error processing transcription webhook:', error);

    const contentType = request.headers.get('content-type');
    if (contentType?.includes('xml')) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Error processing transcription.</Say>
</Response>`,
        {
          status: 500,
          headers: { 'Content-Type': 'application/xml' }
        }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to process transcription webhook' },
        { status: 500 }
      );
    }
  }
}

// Generic webhook handler for unknown types
async function handleGenericWebhook(requestData) {
  try {
    console.log('Processing generic webhook');
    console.log('Generic webhook data:', requestData);

    return NextResponse.json({
      success: true,
      message: 'Webhook received'
    });

  } catch (error) {
    console.error('Error processing generic webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Transfer call using Telnyx Update Call API with Dial TeXML
async function transferCall(callId) {
  try {
    console.log('Starting call transfer for call:', callId);

    // Get webhook base URL from environment
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const dialTexmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Sip statusCallback="${webhookBaseUrl}/api/webhooks/telnyx/call-status" statusCallbackEvent="answered" statusCallbackMethod="POST">sip:gencredUJitZF1yIkFR3WhYAZObcamLFKSHdHZtjOEZ378x1T@sip.telnyx.com</Sip>
    </Dial>
</Response>`;

    // Use URLSearchParams for form-encoded data
    const params = new URLSearchParams();
    params.append('Texml', dialTexmlContent);

    const response = await axios.post(
      `https://api.telnyx.com/v2/texml/Accounts/${process.env.TELNYX_ACCOUNT_SID}/Calls/${callId}`,
      params,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Successfully transferred call:', callId);
    console.log('Transfer response:', response.data);

    return response.data;

  } catch (error) {
    console.error('Error transferring call:', error);
    if (error.response) {
      console.error('Transfer response status:', error.response.status);
      console.error('Transfer response data:', error.response.data);
    }
    throw error;
  }
}

// Parse XML call status webhook (TwiML/TeXML format)
function parseCallStatusXML(xmlText) {
  try {
    // Basic XML parsing for call status data
    const callIdMatch = xmlText.match(/<CallSid>(.*?)<\/CallSid>/i);
    const statusMatch = xmlText.match(/<CallStatus>(.*?)<\/CallStatus>/i);
    const durationMatch = xmlText.match(/<CallDuration>(.*?)<\/CallDuration>/i);
    const recordingMatch = xmlText.match(/<RecordingUrl>(.*?)<\/RecordingUrl>/i);
    const fromMatch = xmlText.match(/<From>(.*?)<\/From>/i);
    const toMatch = xmlText.match(/<To>(.*?)<\/To>/i);
    const directionMatch = xmlText.match(/<Direction>(.*?)<\/Direction>/i);
    const startTimeMatch = xmlText.match(/<StartTime>(.*?)<\/StartTime>/i);
    const endTimeMatch = xmlText.match(/<EndTime>(.*?)<\/EndTime>/i);

    return {
      callId: callIdMatch ? callIdMatch[1] : null,
      callStatus: statusMatch ? statusMatch[1] : null,
      callDuration: durationMatch ? parseInt(durationMatch[1]) : null,
      recordingUrl: recordingMatch ? recordingMatch[1] : null,
      from: fromMatch ? fromMatch[1] : null,
      to: toMatch ? toMatch[1] : null,
      direction: directionMatch ? directionMatch[1] : null,
      startTime: startTimeMatch ? startTimeMatch[1] : null,
      endTime: endTimeMatch ? endTimeMatch[1] : null
    };
  } catch (error) {
    console.error('Error parsing call status XML:', error);
    return {};
  }
}

// Parse XML transcription webhook (TwiML format)
function parseTranscriptionXML(xmlText) {
  try {
    // Basic XML parsing for transcription data
    const transcriptMatch = xmlText.match(/<TranscriptionText>(.*?)<\/TranscriptionText>/i);
    const callIdMatch = xmlText.match(/<CallSid>(.*?)<\/CallSid>/i);
    const statusMatch = xmlText.match(/<CallStatus>(.*?)<\/CallStatus>/i);
    const recordingMatch = xmlText.match(/<RecordingUrl>(.*?)<\/RecordingUrl>/i);
    const fromMatch = xmlText.match(/<From>(.*?)<\/From>/i);
    const toMatch = xmlText.match(/<To>(.*?)<\/To>/i);

    return {
      callId: callIdMatch ? callIdMatch[1] : null,
      transcript: transcriptMatch ? transcriptMatch[1] : null,
      callStatus: statusMatch ? statusMatch[1] : null,
      recordingUrl: recordingMatch ? recordingMatch[1] : null,
      from: fromMatch ? fromMatch[1] : null,
      to: toMatch ? toMatch[1] : null
    };
  } catch (error) {
    console.error('Error parsing transcription XML:', error);
    return {};
  }
}

// Generate coaching content using Telnyx AI Inference
async function generateCoachingContent(transcript) {
  const coachingPrompt = `
Analyze this customer service call transcript and provide coaching feedback for the agent:

Transcript: "${transcript}"

Please provide coaching feedback in the following JSON format:
{
  "strengths": ["List 2-3 things the agent did well"],
  "improvements": ["List 2-3 areas for improvement"],
  "suggestions": ["List 2-3 specific actionable suggestions"],
  "avatarScript": "A brief, encouraging script for the AI avatar to deliver this coaching (2-3 sentences)"
}

Focus on communication skills, problem-solving approach, customer empathy, and call resolution effectiveness.
`;

  try {
    const response = await axios.post(
      'https://api.telnyx.com/v2/ai/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: coachingPrompt
          }
        ],
        model: 'Qwen/Qwen3-235B-A22B'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Clean the response like in the main coaching endpoint
    let cleanedResponse = aiResponse;
    cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    return JSON.parse(cleanedResponse);

  } catch (error) {
    console.error('Error calling Telnyx AI:', error);
    throw error;
  }
}

// Handle completed call processing
async function handleCallCompleted(callStatusData) {
  try {
    console.log('Processing completed call:', callStatusData.callId);

    // Store call completion data
    const callRecord = {
      callId: callStatusData.callId,
      from: callStatusData.from,
      to: callStatusData.to,
      duration: callStatusData.callDuration,
      startTime: callStatusData.startTime,
      endTime: callStatusData.endTime,
      recordingUrl: callStatusData.recordingUrl,
      status: 'completed',
      processedAt: new Date().toISOString()
    };

    console.log('Call record created:', callRecord);

    // In production, you might:
    // 1. Save to database
    // 2. Trigger analytics
    // 3. Send notifications
    // 4. Generate reports

    return callRecord;

  } catch (error) {
    console.error('Error handling completed call:', error);
    throw error;
  }
}