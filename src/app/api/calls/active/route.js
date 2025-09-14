import { NextResponse } from 'next/server';

// In-memory storage for active calls (for MVP)
let activeCalls = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (agentId) {
      // Get active calls for specific agent
      const agentCalls = Array.from(activeCalls.values())
        .filter(call => call.agentId === agentId);

      return NextResponse.json({
        success: true,
        calls: agentCalls
      });
    }

    // Get all active calls
    return NextResponse.json({
      success: true,
      calls: Array.from(activeCalls.values())
    });

  } catch (error) {
    console.error('Error getting active calls:', error);
    return NextResponse.json(
      { error: 'Failed to get active calls' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const callData = await request.json();

    const activeCall = {
      id: callData.callId,
      agentId: callData.agentId,
      customerId: callData.customerId,
      startTime: new Date(),
      status: 'active',
      aiInsights: []
    };

    activeCalls.set(activeCall.id, activeCall);

    return NextResponse.json({
      success: true,
      call: activeCall
    });

  } catch (error) {
    console.error('Error creating active call:', error);
    return NextResponse.json(
      { error: 'Failed to create active call' },
      { status: 500 }
    );
  }
}