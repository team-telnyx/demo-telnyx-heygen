// Data Models for Contact Center AI Coaching Application

/**
 * Call Record Model
 * @typedef {Object} CallRecord
 * @property {string} id - Unique call identifier
 * @property {string} agentId - Agent identifier
 * @property {string} [customerId] - Customer identifier (optional)
 * @property {Date} startTime - Call start timestamp
 * @property {Date} endTime - Call end timestamp
 * @property {number} duration - Call duration in seconds
 * @property {string} transcript - Call transcript text
 * @property {string[]} aiInsights - AI-generated insights during call
 * @property {boolean} coachingGenerated - Whether coaching content has been created
 * @property {'completed'|'processing'|'error'} status - Call processing status
 */

/**
 * Coaching Session Model
 * @typedef {Object} CoachingSession
 * @property {string} id - Unique session identifier
 * @property {string} callId - Associated call ID
 * @property {string} agentId - Agent identifier
 * @property {CoachingFeedback} feedback - Structured coaching feedback
 * @property {string} avatarScript - Script for Heygen avatar delivery
 * @property {boolean} completed - Whether session has been completed
 * @property {Date} createdAt - Session creation timestamp
 */

/**
 * Coaching Feedback Model
 * @typedef {Object} CoachingFeedback
 * @property {string[]} strengths - Agent strengths identified
 * @property {string[]} improvements - Areas for improvement
 * @property {string[]} suggestions - Specific actionable suggestions
 */

/**
 * Agent Model
 * @typedef {Object} Agent
 * @property {string} id - Agent identifier
 * @property {string} name - Agent display name
 * @property {string} email - Agent email
 * @property {Date} lastLogin - Last login timestamp
 * @property {AgentStats} stats - Performance statistics
 */

/**
 * Agent Statistics Model
 * @typedef {Object} AgentStats
 * @property {number} totalCalls - Total calls handled
 * @property {number} averageCallDuration - Average call duration in seconds
 * @property {number} coachingSessions - Total coaching sessions completed
 * @property {number} improvementScore - Overall improvement score (0-100)
 */

// Helper functions for data validation and creation
export const createCallRecord = (data) => ({
  id: data.id || generateId(),
  agentId: data.agentId,
  customerId: data.customerId || null,
  startTime: new Date(data.startTime),
  endTime: new Date(data.endTime),
  duration: data.duration,
  transcript: data.transcript || '',
  aiInsights: data.aiInsights || [],
  coachingGenerated: false,
  status: data.status || 'processing'
});

export const createCoachingSession = (callRecord, feedback, avatarScript) => ({
  id: generateId(),
  callId: callRecord.id,
  agentId: callRecord.agentId,
  feedback,
  avatarScript,
  completed: false,
  createdAt: new Date()
});

// Simple ID generation for MVP (in production, use proper UUID)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export { generateId };