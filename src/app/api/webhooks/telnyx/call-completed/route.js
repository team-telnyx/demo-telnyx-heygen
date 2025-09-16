import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    // TODO: Implement webhook signature verification
    // const isValid = verifyTelnyxSignature(body, signature, timestamp);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    console.log('Call completed webhook received:', body);

    // Extract call data from webhook
    const { data } = body;
    const callRecord = {
      id: data.call_control_id,
      agentId: data.client_state?.agent_id || 'unknown',
      customerId: data.from || data.to,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      status: 'completed'
    };

    // Process the call completion
    console.log('Processing call record:', callRecord);

    // Trigger coaching generation if transcript is available
    if (data.recording_url || data.transcript) {
      console.log('Triggering coaching generation for call:', callRecord.id);
      // TODO: Implement coaching generation
    }

    return NextResponse.json({
      success: true,
      message: 'Call completion processed'
    });

  } catch (error) {
    console.error('Error processing call completion webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}