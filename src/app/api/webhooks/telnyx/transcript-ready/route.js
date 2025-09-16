import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    console.log('Transcript ready webhook received:', body);

    // Extract transcript data from webhook
    const { data } = body;
    const transcriptData = {
      callId: data.call_control_id,
      transcript: data.transcript_text || data.transcript,
      confidence: data.confidence,
      timestamp: data.timestamp
    };

    console.log('Processing transcript:', transcriptData);

    // Generate coaching content using Telnyx AI Inference
    if (transcriptData.transcript) {
      console.log('Generating coaching content for call:', transcriptData.callId);

      try {
        const coachingContent = await generateCoachingContent(transcriptData.transcript);
        console.log('Generated coaching content:', coachingContent);

        // TODO: Store coaching content and trigger avatar session

      } catch (error) {
        console.error('Error generating coaching content:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transcript processed'
    });

  } catch (error) {
    console.error('Error processing transcript webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript webhook' },
      { status: 500 }
    );
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
    return JSON.parse(aiResponse);

  } catch (error) {
    console.error('Error calling Telnyx AI:', error);
    throw error;
  }
}