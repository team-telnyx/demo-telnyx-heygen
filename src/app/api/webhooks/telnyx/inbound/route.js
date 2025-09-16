import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    console.log('Inbound call webhook received');

    // Log the incoming request data for debugging
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);

    let requestData = {};

    // Parse request data based on content type
    if (contentType?.includes('application/json')) {
      requestData = await request.json();
      console.log('Inbound call JSON data:', requestData);
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData);
      console.log('Inbound call form data:', requestData);
    } else {
      const textData = await request.text();
      console.log('Inbound call text data:', textData);
    }

    // Extract call ID from the request for potential transfer
    const callId = requestData.CallSid || requestData.call_control_id || requestData.call_session_id;
    console.log('Call ID:', callId);

    // Respond with TeXML to start recording with transcription
    const texmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Record
        playBeep="false"
        transcription="true"
        transcriptionEngine="A"
        transcriptionCallback="https://ef3efa948e9a.ngrok-free.app/api/webhooks/telnyx/transcription"/>
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

    // Return error response in XML format
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

// Transfer call using Telnyx Update Call API with Dial TeXML
async function transferCall(callId) {
  try {
    console.log('Starting call transfer for call:', callId);

    const dialTexmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Sip statusCallback="https://ef3efa948e9a.ngrok-free.app/api/webhooks/telnyx/call-status" statusCallbackEvent="answered" statusCallbackMethod="POST">sip:gencredUJitZF1yIkFR3WhYAZObcamLFKSHdHZtjOEZ378x1T@sip.telnyx.com</Sip>
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