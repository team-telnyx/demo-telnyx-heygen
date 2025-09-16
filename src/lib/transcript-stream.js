// Simple in-memory store for live transcript streaming
// For MVP: single call at a time

class TranscriptStreamManager {
  constructor() {
    // Store active call transcript
    this.activeCall = null;
    this.activeTranscript = '';

    // Store SSE connections
    this.connections = new Set();
  }

  // Set active call
  setActiveCall(callSessionId) {
    // console.log('Setting active call:', callSessionId);
    this.activeCall = callSessionId;
    this.activeTranscript = '';
    this.broadcastUpdate();
  }

  // Append transcript segment
  appendTranscript(callSessionId, segment) {
    // console.log('appendTranscript called with:', { callSessionId, segment, activeCall: this.activeCall });
    if (this.activeCall === callSessionId) {
      this.activeTranscript += segment;
      // console.log('Broadcasting transcript update for call:', callSessionId, 'Full transcript:', this.activeTranscript);
      this.broadcastUpdate();
    } else {
      // console.log('Skipping transcript append - no active call match');
    }
  }

  // Clear active call
  clearActiveCall() {
    // console.log('Clearing active call:', this.activeCall);
    this.activeCall = null;
    this.activeTranscript = '';
    this.broadcastUpdate();
  }

  // Add SSE connection
  addConnection(response) {
    // console.log('Adding SSE connection');
    this.connections.add(response);

    // Send current transcript immediately
    if (this.activeCall && this.activeTranscript) {
      this.sendToConnection(response, {
        type: 'transcript',
        callSessionId: this.activeCall,
        transcript: this.activeTranscript
      });
    }
  }

  // Remove SSE connection
  removeConnection(response) {
    // console.log('Removing SSE connection');
    this.connections.delete(response);
  }

  // Send data to specific connection
  sendToConnection(response, data) {
    try {
      if (response.closed) {
        this.removeConnection(response);
        return;
      }
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending to SSE connection:', error);
      this.removeConnection(response);
    }
  }

  // Broadcast to all connections
  broadcastUpdate() {
    const data = {
      type: 'transcript',
      callSessionId: this.activeCall,
      transcript: this.activeTranscript,
      timestamp: new Date().toISOString()
    };

    this.connections.forEach(response => {
      this.sendToConnection(response, data);
    });
  }

  // Get current state
  getCurrentState() {
    return {
      activeCall: this.activeCall,
      transcript: this.activeTranscript,
      connectionCount: this.connections.size
    };
  }
}

// Export singleton instance
export const transcriptStreamManager = new TranscriptStreamManager();