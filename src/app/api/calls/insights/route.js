import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const { callId, currentTranscript, context } = await request.json();

    if (!currentTranscript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    console.log('Generating AI insights for call:', callId);

    const insights = await generateCallInsights(currentTranscript, context);

    return NextResponse.json({
      success: true,
      callId,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating call insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// Generate real-time insights using Telnyx AI Inference
async function generateCallInsights(transcript, context = '') {
  const insightPrompt = `
You are an AI assistant helping a contact center agent during a live call.
Analyze the current conversation and provide brief, actionable insights.

Current conversation transcript: "${transcript}"
${context ? `Additional context: ${context}` : ''}

Provide insights in this JSON format:
{
  "suggestions": ["2-3 brief suggestions for the agent"],
  "nextSteps": ["1-2 recommended next steps"],
  "customerSentiment": "positive|neutral|negative",
  "urgency": "low|medium|high"
}

Keep suggestions brief and actionable for real-time use.
`;

  try {
    const response = await axios.post(
      'https://api.telnyx.com/v2/ai/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: insightPrompt
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
    console.error('Error calling Telnyx AI for insights:', error);
    // Return fallback insights
    return {
      suggestions: ['Continue listening actively', 'Ask clarifying questions'],
      nextSteps: ['Gather more information'],
      customerSentiment: 'neutral',
      urgency: 'medium'
    };
  }
}