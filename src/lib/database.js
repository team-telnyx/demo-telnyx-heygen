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
    // Create calls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        call_control_id VARCHAR(255) UNIQUE NOT NULL,
        call_session_id VARCHAR(255),
        agent_id VARCHAR(100),
        customer_phone VARCHAR(50),
        agent_phone VARCHAR(50),
        direction VARCHAR(20),
        status VARCHAR(50) DEFAULT 'initiated',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        duration INTEGER,
        recording_url TEXT,
        client_state TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create transcripts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        call_control_id VARCHAR(255) NOT NULL,
        transcript_text TEXT NOT NULL,
        confidence DECIMAL(3,2),
        language VARCHAR(10) DEFAULT 'en',
        speaker_labels JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (call_control_id) REFERENCES calls(call_control_id) ON DELETE CASCADE
      );
    `);

    // Create coaching_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coaching_sessions (
        id SERIAL PRIMARY KEY,
        call_control_id VARCHAR(255) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        coaching_content JSONB NOT NULL,
        avatar_script TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (call_control_id) REFERENCES calls(call_control_id) ON DELETE CASCADE
      );
    `);

    // Create call_logs table for detailed event tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id SERIAL PRIMARY KEY,
        call_control_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (call_control_id) REFERENCES calls(call_control_id) ON DELETE CASCADE
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
export async function createCall(callData) {
  const client = await pool.connect();

  try {
    const {
      call_control_id,
      call_session_id,
      agent_id,
      customer_phone,
      agent_phone,
      direction,
      start_time,
      client_state
    } = callData;

    const result = await client.query(`
      INSERT INTO calls (
        call_control_id, call_session_id, agent_id, customer_phone,
        agent_phone, direction, start_time, client_state
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (call_control_id)
      DO UPDATE SET
        call_session_id = EXCLUDED.call_session_id,
        agent_id = EXCLUDED.agent_id,
        customer_phone = EXCLUDED.customer_phone,
        agent_phone = EXCLUDED.agent_phone,
        direction = EXCLUDED.direction,
        start_time = EXCLUDED.start_time,
        client_state = EXCLUDED.client_state,
        updated_at = NOW()
      RETURNING *;
    `, [call_control_id, call_session_id, agent_id, customer_phone, agent_phone, direction, start_time, client_state]);

    return result.rows[0];
  } catch (error) {
    console.error('Error creating call record:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateCallStatus(call_control_id, status, additionalData = {}) {
  const client = await pool.connect();

  try {
    const updates = ['status = $2', 'updated_at = NOW()'];
    const values = [call_control_id, status];
    let paramIndex = 3;

    // Add optional fields to update
    if (additionalData.end_time) {
      updates.push(`end_time = $${paramIndex++}`);
      values.push(additionalData.end_time);
    }
    if (additionalData.duration) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(additionalData.duration);
    }
    if (additionalData.recording_url) {
      updates.push(`recording_url = $${paramIndex++}`);
      values.push(additionalData.recording_url);
    }

    const result = await client.query(`
      UPDATE calls
      SET ${updates.join(', ')}
      WHERE call_control_id = $1
      RETURNING *;
    `, values);

    return result.rows[0];
  } catch (error) {
    console.error('Error updating call status:', error);
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
      call_control_id,
      transcript_text,
      confidence,
      language = 'en',
      speaker_labels
    } = transcriptData;

    const result = await client.query(`
      INSERT INTO transcripts (call_control_id, transcript_text, confidence, language, speaker_labels)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [call_control_id, transcript_text, confidence, language, speaker_labels]);

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
      call_control_id,
      agent_id,
      coaching_content,
      avatar_script
    } = sessionData;

    const result = await client.query(`
      INSERT INTO coaching_sessions (call_control_id, agent_id, coaching_content, avatar_script)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [call_control_id, agent_id, JSON.stringify(coaching_content), avatar_script]);

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
export async function getCallById(call_control_id) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT * FROM calls WHERE call_control_id = $1;
    `, [call_control_id]);

    return result.rows[0];
  } catch (error) {
    console.error('Error getting call by ID:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getCallWithTranscript(call_control_id) {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        c.*,
        t.transcript_text,
        t.confidence,
        t.language,
        t.speaker_labels,
        cs.coaching_content,
        cs.avatar_script,
        cs.completed as coaching_completed
      FROM calls c
      LEFT JOIN transcripts t ON c.call_control_id = t.call_control_id
      LEFT JOIN coaching_sessions cs ON c.call_control_id = cs.call_control_id
      WHERE c.call_control_id = $1;
    `, [call_control_id]);

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
      LEFT JOIN transcripts t ON c.call_control_id = t.call_control_id
      LEFT JOIN coaching_sessions cs ON c.call_control_id = cs.call_control_id
      WHERE c.agent_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2;
    `, [agent_id, limit]);

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