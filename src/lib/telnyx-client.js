// Telnyx WebRTC Client Management
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

    // Set up global event listeners
    setupTelnyxEventListeners(telnyxClient);
  }

  return telnyxClient;
};

// Set up event listeners for the Telnyx client
const setupTelnyxEventListeners = (client) => {
  client.on('telnyx.ready', () => {
    console.log('Telnyx client is ready');
  });

  client.on('telnyx.error', (error) => {
    console.error('Telnyx error:', error);
  });

  client.on('telnyx.notification', (notification) => {
    console.log('Telnyx notification:', notification);
  });

  // Global incoming call handler
  client.on('telnyx.call.received', (event) => {
    console.log('Incoming call received:', event);
    // Trigger custom event for the UI to handle
    window.dispatchEvent(new CustomEvent('telnyxIncomingCall', {
      detail: event
    }));
  });
};

// Get current client instance
export const getTelnyxClient = () => {
  return telnyxClient || initializeTelnyxClient();
};

// Call management functions
export class CallManager {
  constructor(client, agentId) {
    this.client = client;
    this.agentId = agentId;
    this.currentCall = null;
    this.callEvents = [];
  }

  // Make outbound call
  async makeCall(destination) {
    try {
      const call = this.client.newCall({
        destinationNumber: destination,
        callerNumber: '+17735143071', // Using the caller ID from env
        clientState: JSON.stringify({ agent_id: this.agentId })
      });

      this.setupCallEventListeners(call);
      this.currentCall = call;

      return call;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  }

  // Answer incoming call
  async answerCall(call) {
    try {
      if (typeof call === 'object' && call.answer) {
        // If we have a call object, answer it directly
        call.answer();
      } else {
        // If we have an event, get the call from the client
        const incomingCall = this.client.calls.find(c => c.id === call.call_leg_id);
        if (incomingCall) {
          incomingCall.answer();
          call = incomingCall;
        }
      }

      this.setupCallEventListeners(call);
      this.currentCall = call;

      return call;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  // Decline incoming call
  async declineCall(call) {
    try {
      if (typeof call === 'object' && call.hangup) {
        // If we have a call object, decline it directly
        call.hangup();
      } else {
        // If we have an event, get the call from the client
        const incomingCall = this.client.calls.find(c => c.id === call.call_leg_id);
        if (incomingCall) {
          incomingCall.hangup();
        }
      }
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  // Hang up current call
  async hangupCall() {
    if (this.currentCall) {
      try {
        this.currentCall.hangup();
        this.currentCall = null;
      } catch (error) {
        console.error('Error hanging up call:', error);
        throw error;
      }
    }
  }

  // Hold/unhold call
  async toggleHold() {
    if (this.currentCall) {
      try {
        if (this.currentCall.state === 'held') {
          this.currentCall.unhold();
        } else {
          this.currentCall.hold();
        }
      } catch (error) {
        console.error('Error toggling hold:', error);
        throw error;
      }
    }
  }

  // Mute/unmute call
  async toggleMute() {
    if (this.currentCall) {
      try {
        if (this.currentCall.muted) {
          this.currentCall.unmute();
        } else {
          this.currentCall.mute();
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
        throw error;
      }
    }
  }

  // Set up event listeners for a specific call
  setupCallEventListeners(call) {
    // Listen for call events on the main client, not the call object
    this.client.on('telnyx.call.received', (event) => {
      if (event.call_leg_id === call.id) {
        console.log('Call received:', event);
        this.handleCallEvent('received', event);
      }
    });

    this.client.on('telnyx.call.answered', (event) => {
      if (event.call_leg_id === call.id) {
        console.log('Call answered:', event);
        this.handleCallEvent('answered', event);
      }
    });

    this.client.on('telnyx.call.hangup', (event) => {
      if (event.call_leg_id === call.id) {
        console.log('Call ended:', event);
        this.handleCallEvent('hangup', event);
        this.currentCall = null;
      }
    });

    this.client.on('telnyx.call.held', (event) => {
      if (event.call_leg_id === call.id) {
        console.log('Call held:', event);
        this.handleCallEvent('held', event);
      }
    });

    this.client.on('telnyx.call.unheld', (event) => {
      if (event.call_leg_id === call.id) {
        console.log('Call unheld:', event);
        this.handleCallEvent('unheld', event);
      }
    });
  }

  // Handle call events and potentially trigger API calls
  handleCallEvent(eventType, event) {
    const callEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      callId: event.call_id,
      data: event
    };

    this.callEvents.push(callEvent);

    // Trigger API updates based on event type
    switch (eventType) {
      case 'answered':
        this.notifyCallStarted(event);
        break;
      case 'hangup':
        this.notifyCallEnded(event);
        break;
    }
  }

  // Notify backend of call start
  async notifyCallStarted(event) {
    try {
      const response = await fetch('/api/calls/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: event.call_id,
          agentId: this.agentId,
          customerId: event.remote_sdp?.from || 'unknown'
        })
      });

      if (!response.ok) {
        console.error('Failed to notify call started');
      }
    } catch (error) {
      console.error('Error notifying call started:', error);
    }
  }

  // Notify backend of call end
  async notifyCallEnded(event) {
    try {
      console.log('Call ended, processing for coaching...');
      // The webhook will handle coaching generation
    } catch (error) {
      console.error('Error notifying call ended:', error);
    }
  }

  // Get current call status
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