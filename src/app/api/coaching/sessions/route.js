import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id') || 'agent_001';
    const limit = parseInt(searchParams.get('limit')) || 10;

    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT
          cs.*,
          c.customer_phone,
          c.agent_phone,
          c.start_time,
          c.duration,
          t.transcript_text
        FROM coaching_sessions cs
        LEFT JOIN calls c ON cs.call_control_id = c.call_control_id
        LEFT JOIN transcripts t ON cs.call_control_id = t.call_control_id
        WHERE cs.agent_id = $1
        ORDER BY cs.created_at DESC
        LIMIT $2;
      `, [agent_id, limit]);

      return NextResponse.json({
        success: true,
        sessions: result.rows,
        count: result.rows.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching coaching sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coaching sessions',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { call_control_id, agent_id, coaching_content, avatar_script } = await request.json();

    if (!call_control_id || !agent_id || !coaching_content) {
      return NextResponse.json(
        {
          success: false,
          error: 'call_control_id, agent_id, and coaching_content are required'
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const result = await client.query(`
        INSERT INTO coaching_sessions (call_control_id, agent_id, coaching_content, avatar_script)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [call_control_id, agent_id, JSON.stringify(coaching_content), avatar_script]);

      return NextResponse.json({
        success: true,
        session: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating coaching session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create coaching session',
        details: error.message
      },
      { status: 500 }
    );
  }
}