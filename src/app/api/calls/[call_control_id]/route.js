import { NextResponse } from 'next/server';
import { getCallWithTranscript } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const { call_control_id } = params;

    if (!call_control_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Call control ID is required'
        },
        { status: 400 }
      );
    }

    const callData = await getCallWithTranscript(call_control_id);

    if (!callData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Call not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      call: callData
    });

  } catch (error) {
    console.error('Error fetching call details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch call details',
        details: error.message
      },
      { status: 500 }
    );
  }
}