import { NextResponse } from 'next/server';
import { getRecentCalls } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id') || 'agent_001';
    const limit = parseInt(searchParams.get('limit')) || 10;

    const calls = await getRecentCalls(agent_id, limit);

    return NextResponse.json({
      success: true,
      calls,
      count: calls.length
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch call history',
        details: error.message
      },
      { status: 500 }
    );
  }
}