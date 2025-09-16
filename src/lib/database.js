import { Pool } from 'pg';

// Create a connection pool for Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create calls table with session_id as primary key
    await client.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL,
        call_session_id VARCHAR(255) PRIMARY KEY,
        call_control_id VARCHAR(255),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        customer_phone VARCHAR(50),
        agent_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create transcripts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        call_session_id VARCHAR(255) UNIQUE NOT NULL,
        transcript_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (call_session_id) REFERENCES calls(call_session_id) ON DELETE CASCADE
      );
    `);

    // Create coaching_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coaching_sessions (
        id SERIAL PRIMARY KEY,
        call_session_id VARCHAR(255) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        coaching_content JSONB NOT NULL,
        avatar_script TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (call_session_id) REFERENCES calls(call_session_id) ON DELETE CASCADE
      );
    `);

    // Create call_logs table for detailed event tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id SERIAL PRIMARY KEY,
        call_control_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Call management functions
export async function saveCallHangup(callData) {
  const client = await pool.connect();

  try {
    const {
      call_session_id,
      call_control_id,
      start_time,
      end_time,
      customer_phone,
      agent_phone
    } = callData;

    const result = await client.query(`
      INSERT INTO calls (
        call_session_id, call_control_id, start_time, end_time,
        customer_phone, agent_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (call_session_id)
      DO UPDATE SET
        call_control_id = EXCLUDED.call_control_id,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        customer_phone = EXCLUDED.customer_phone,
        agent_phone = EXCLUDED.agent_phone,
        updated_at = NOW()
      RETURNING *;
    `, [call_session_id, call_control_id, start_time, end_time, customer_phone, agent_phone]);

    return result.rows[0];
  } catch (error) {
    console.error('Error saving call hangup:', error);
    throw error;
  } finally {
    client.release();
  }
}


// Transcript management
export async function saveTranscript(transcriptData) {
  const client = await pool.connect();

  try {
    const {
      call_session_id,
      transcript_text
    } = transcriptData;

    const result = await client.query(`
      INSERT INTO transcripts (call_session_id, transcript_text)
      VALUES ($1, $2)
      ON CONFLICT (call_session_id) DO UPDATE SET
        transcript_text = EXCLUDED.transcript_text,
        created_at = NOW()
      RETURNING *;
    `, [call_session_id, transcript_text]);

    return result.rows[0];
  } catch (error) {
    console.error('Error saving transcript:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Coaching session management
export async function saveCoachingSession(sessionData) {
  const client = await pool.connect();

  try {
    const {
      call_session_id,
      agent_id,
      coaching_content,
      avatar_script
    } = sessionData;

    const result = await client.query(`
      INSERT INTO coaching_sessions (call_session_id, agent_id, coaching_content, avatar_script)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [call_session_id, agent_id, JSON.stringify(coaching_content), avatar_script]);

    return result.rows[0];
  } catch (error) {
    console.error('Error saving coaching session:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Event logging
export async function logCallEvent(call_control_id, event_type, event_data) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      INSERT INTO call_logs (call_control_id, event_type, event_data)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [call_control_id, event_type, JSON.stringify(event_data)]);

    return result.rows[0];
  } catch (error) {
    console.error('Error logging call event:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Query functions
export async function getCallBySessionId(call_session_id) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT * FROM calls WHERE call_session_id = $1;
    `, [call_session_id]);

    return result.rows[0];
  } catch (error) {
    console.error('Error getting call by session ID:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getCallWithTranscript(call_session_id) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        c.*,
        t.transcript_text,
        cs.coaching_content,
        cs.avatar_script,
        cs.completed as coaching_completed
      FROM calls c
      LEFT JOIN transcripts t ON c.call_session_id = t.call_session_id
      LEFT JOIN coaching_sessions cs ON c.call_session_id = cs.call_session_id
      WHERE c.call_session_id = $1;
    `, [call_session_id]);

    return result.rows[0];
  } catch (error) {
    console.error('Error getting call with transcript:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getRecentCalls(agent_id, limit = 10) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        c.*,
        t.transcript_text,
        cs.completed as coaching_completed
      FROM calls c
      LEFT JOIN transcripts t ON c.call_session_id = t.call_session_id
      LEFT JOIN coaching_sessions cs ON c.call_session_id = cs.call_session_id
      ORDER BY c.created_at DESC
      LIMIT $1;
    `, [limit]);

    return result.rows;
  } catch (error) {
    console.error('Error getting recent calls:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Cleanup and connection management
export async function closePool() {
  await pool.end();
}

export { pool };