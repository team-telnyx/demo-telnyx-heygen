import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const { callId, transcript, agentId } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    console.log('Generating coaching content for call:', callId);

    const coachingSession = await generateCoachingSession(transcript, callId, agentId);

    return NextResponse.json({
      success: true,
      coachingSession
    });

  } catch (error) {
    console.error('Error generating coaching session:', error);
    return NextResponse.json(
      { error: 'Failed to generate coaching session' },
      { status: 500 }
    );
  }
}

async function generateCoachingSession(transcript, callId, agentId) {
  const coachingPrompt = `
As an expert contact center coach, analyze this customer service call transcript and provide detailed coaching feedback:

Transcript: "${transcript}"

Provide comprehensive coaching feedback in this JSON format:
{
  "strengths": ["3-4 specific things the agent did well with examples"],
  "improvements": ["3-4 areas for improvement with specific examples"],
  "suggestions": ["4-5 actionable suggestions for future calls"],
  "overallScore": 85,
  "keyTakeaways": ["2-3 most important learning points"],
  "avatarScript": "A warm, encouraging 3-4 sentence script for the AI coaching avatar to deliver this feedback"
}

Focus on:
- Communication style and clarity
- Customer empathy and rapport building
- Problem-solving approach
- Call resolution effectiveness
- Professional behavior

Be constructive and specific with examples from the transcript.
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
    const feedback = JSON.parse(aiResponse);

    // Create coaching session object
    const coachingSession = {
      id: `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callId,
      agentId,
      feedback,
      completed: false,
      createdAt: new Date().toISOString()
    };

    return coachingSession;

  } catch (error) {
    console.error('Error generating coaching content:', error);
    throw error;
  }
}