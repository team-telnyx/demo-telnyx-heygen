import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

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

    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT
          t.*,
          c.customer_phone,
          c.agent_phone,
          c.start_time,
          c.end_time,
          c.duration
        FROM transcripts t
        LEFT JOIN calls c ON t.call_control_id = c.call_control_id
        WHERE t.call_control_id = $1;
      `, [call_control_id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Transcript not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        transcript: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transcript',
        details: error.message
      },
      { status: 500 }
    );
  }
}