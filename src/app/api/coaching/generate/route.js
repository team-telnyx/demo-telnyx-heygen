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

    // console.log('Generating coaching content for call:', callId);

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
  const coachingPrompt = `You are Santa Claus, who is acting as an expert contact center coach, analyze this customer service call transcript and provide detailed coaching feedback.

Transcript: "${transcript}"

You must respond with ONLY valid JSON in this exact format - no additional text, explanations, or formatting:

{
  "overall review": "Santas overall review of their performance. Remember that if someone has poor performance, you should start by saying. "Oh, looks like someone is on the Naughty List"
  "strengths": ["3-4 specific things the agent did well with examples"],
  "improvements": ["3-4 areas for improvement with specific examples"],
  "suggestions": ["4-5 actionable suggestions for future calls"],
  "overallScore": 85,
  "keyTakeaways": ["2-3 most important learning points"],
  "avatarScript": "A warm, encouraging 3-4 sentence script for the AI coaching avatar to deliver this feedback"
}

Focus on: Communication style, customer empathy, problem-solving approach, call resolution, and professional behavior. Be constructive and specific with examples from the transcript.

Respond with ONLY the JSON object - no other text.`;

  try {
    // console.log('=== TELNYX API DEBUG START ===');
    // console.log('API Key available:', !!process.env.TELNYX_API_KEY);
    // console.log('API Key length:', process.env.TELNYX_API_KEY ? process.env.TELNYX_API_KEY.length : 0);
    // console.log('API Key first 10 chars:', process.env.TELNYX_API_KEY ? process.env.TELNYX_API_KEY.substring(0, 10) + '...' : 'N/A');
    // console.log('Making request to: https://api.telnyx.com/v2/ai/chat/completions');
    // console.log('Request payload model:', 'Qwen/Qwen3-235B-A22B');
    // console.log('Transcript length:', transcript.length);
    // console.log('=== TELNYX API DEBUG END ===');

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

    // console.log('=== TELNYX API RESPONSE ===');
    // console.log('Response status:', response.status);
    // console.log('Response headers:', response.headers);
    // console.log('Response data keys:', Object.keys(response.data || {}));

    const aiResponse = response.data.choices[0].message.content;
    // console.log('=== AI RESPONSE ===');
    // console.log('AI response length:', aiResponse.length);
    // console.log('AI response preview:', aiResponse.substring(0, 200) + '...');
    // console.log('=== AI RESPONSE END ===');

    // Clean the AI response to extract JSON
    let cleanedResponse = aiResponse;

    // Remove <think> tags and their content
    cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Try to find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // console.log('=== CLEANED RESPONSE ===');
    // console.log('Cleaned response preview:', cleanedResponse.substring(0, 200) + '...');
    // console.log('=== CLEANED RESPONSE END ===');

    const feedback = JSON.parse(cleanedResponse);

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
    // console.log('=== TELNYX API ERROR DEBUG ===');
    console.error('Error generating coaching content:', error.message);
    // console.error('Error status:', error.response?.status);
    // console.error('Error status text:', error.response?.statusText);
    // console.error('Error response data:', error.response?.data);
    // console.error('Error response headers:', error.response?.headers);
    // console.error('Request URL:', error.config?.url);
    // console.error('Request method:', error.config?.method);
    // console.log('=== TELNYX API ERROR DEBUG END ===');
    throw error;
  }
}