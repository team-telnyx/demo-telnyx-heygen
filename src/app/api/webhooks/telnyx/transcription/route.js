import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    let transcriptionData = {};

    // Handle XML format (TwiML-style) transcription webhooks
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xmlText = await request.text();
      console.log('Received XML transcription webhook:', xmlText);

      // Parse XML to extract transcription data
      transcriptionData = parseTranscriptionXML(xmlText);
    }
    // Handle JSON format transcription webhooks
    else if (contentType?.includes('application/json')) {
      const body = await request.json();
      console.log('Received JSON transcription webhook:', body);

      // Extract from Telnyx JSON format
      transcriptionData = {
        callId: body.CallSid || body.CallSidLegacy,
        transcript: body.TranscriptionText,
        recordingUrl: body.RecordingUrl,
        callStatus: body.CallStatus,
        from: body.From,
        to: body.To,
        transcriptionSid: body.TranscriptionSid,
        accountSid: body.AccountSid
      };
    }
    // Handle form-encoded data
    else {
      const formData = await request.formData();
      console.log('Received form transcription webhook:', Object.fromEntries(formData));

      transcriptionData = {
        callId: formData.get('CallSid') || formData.get('CallSidLegacy'),
        transcript: formData.get('TranscriptionText'),
        recordingUrl: formData.get('RecordingUrl'),
        callStatus: formData.get('CallStatus'),
        from: formData.get('From'),
        to: formData.get('To'),
        transcriptionSid: formData.get('TranscriptionSid'),
        accountSid: formData.get('AccountSid')
      };
    }

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