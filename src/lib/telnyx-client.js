// Telnyx WebRTC Client Management - Clean implementation based on Telnyx demo
import { TelnyxRTC } from '@telnyx/webrtc';

let telnyxClient = null;

// Initialize Telnyx client
export const initializeTelnyxClient = () => {
  if (!process.env.NEXT_PUBLIC_TELNYX_JSON_TOKEN) {
    console.error('NEXT_PUBLIC_TELNYX_JSON_TOKEN is required');
    return null;
  }

  if (!telnyxClient) {
    telnyxClient = new TelnyxRTC({
      login_token: process.env.NEXT_PUBLIC_TELNYX_JSON_TOKEN
    });

    console.log('Telnyx client initialized');
  }

  return telnyxClient;
};

// Get current client instance
export const getTelnyxClient = () => {
  return telnyxClient || initializeTelnyxClient();
};

// Simple call management functions
export class CallManager {
  constructor(client, agentId) {
    this.client = client;
    this.agentId = agentId;
    this.currentCall = null;
  }

  // Make outbound call
  async makeCall(destination) {
    try {
      const call = this.client.newCall({
        destinationNumber: destination,
        callerNumber: '+17735143071',
        clientState: JSON.stringify({ agent_id: this.agentId })
      });

      this.currentCall = call;
      return call;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  }

  // Get current call status for legacy compatibility
  getCallStatus() {
    if (!this.currentCall) {
      return { status: 'idle' };
    }

    return {
      status: this.currentCall.state || 'active',
      callId: this.currentCall.id,
      duration: this.currentCall.duration || 0,
      startTime: this.currentCall.startTime || new Date()
    };
  }
}