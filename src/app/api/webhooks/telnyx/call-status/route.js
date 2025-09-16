import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    let callStatusData = {};

    console.log('Call status webhook received');
    console.log('Content-Type:', contentType);

    // Handle XML format (TwiML/TeXML-style) call status webhooks
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xmlText = await request.text();
      console.log('Received XML call status webhook:', xmlText);

      // Parse XML to extract call status data
      callStatusData = parseCallStatusXML(xmlText);
    }
    // Handle JSON format call status webhooks
    else if (contentType?.includes('application/json')) {
      const body = await request.json();
      console.log('Received JSON call status webhook:', body);

      // Extract from Telnyx JSON format
      callStatusData = {
        callId: body.CallSid || body.call_control_id || body.call_session_id,
        callStatus: body.CallStatus,
        callDuration: body.CallDuration,
        recordingUrl: body.RecordingUrl,
        from: body.From,
        to: body.To,
        direction: body.Direction,
        startTime: body.StartTime,
        endTime: body.EndTime,
        accountSid: body.AccountSid,
        timestamp: body.timestamp || new Date().toISOString()
      };
    }
    // Handle form-encoded data
    else {
      const formData = await request.formData();
      console.log('Received form call status webhook:', Object.fromEntries(formData));

      callStatusData = {
        callId: formData.get('CallSid') || formData.get('call_control_id'),
        callStatus: formData.get('CallStatus'),
        callDuration: formData.get('CallDuration'),
        recordingUrl: formData.get('RecordingUrl'),
        from: formData.get('From'),
        to: formData.get('To'),
        direction: formData.get('Direction'),
        startTime: formData.get('StartTime'),
        endTime: formData.get('EndTime'),
        accountSid: formData.get('AccountSid')
      };
    }

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

    // Return appropriate response format
    if (contentType?.includes('xml')) {
      // Return TwiML response for XML webhooks
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Call status received.</Say>
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
        message: 'Call status processed successfully',
        callId: callStatusData.callId,
        status: callStatusData.callStatus
      });
    }

  } catch (error) {
    console.error('Error processing call status webhook:', error);

    const contentType = request.headers.get('content-type');
    if (contentType?.includes('xml')) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Error processing call status.</Say>
</Response>`,
        {
          status: 500,
          headers: { 'Content-Type': 'application/xml' }
        }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to process call status webhook' },
        { status: 500 }
      );
    }
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