import { NextResponse } from 'next/server';
import { initializeDatabase, pool } from '@/lib/database';

// Check database connection and table status
export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Check if tables exist
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('calls', 'transcripts', 'coaching_sessions', 'call_logs')
        ORDER BY table_name;
      `);

      const existingTables = result.rows.map(row => row.table_name);
      const requiredTables = ['calls', 'transcripts', 'coaching_sessions', 'call_logs'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      return NextResponse.json({
        success: true,
        connection: 'healthy',
        existingTables,
        missingTables,
        isInitialized: missingTables.length === 0
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        connection: 'failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Initialize database tables
export async function POST() {
  try {
    await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error.message
      },
      { status: 500 }
    );
  }
}