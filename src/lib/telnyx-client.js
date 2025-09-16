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

    // Handle callUpdate notifications for incoming calls
    if (notification.type === 'callUpdate' && notification.call) {
      const call = notification.call;
      console.log('Call update received:', call);
      console.log('Call direction:', call.direction, 'Call state:', call.state);

      // Check if this is a ringing call (temporarily remove direction check for testing)
      if (call.state === 'ringing') {
        console.log('RINGING CALL DETECTED! Direction:', call.direction, 'State:', call.state);
        console.log('Incoming call detected via callUpdate:', call);
        console.log('Call options:', call.options);

        // Trigger custom event for the UI to handle
        try {
          const eventDetail = {
            callID: call.id,
            caller_id_name: call.options?.remoteCallerName,
            caller_id_number: call.options?.remoteCallerNumber,
            callee_id_name: call.options?.callerName,
            callee_id_number: call.options?.callerNumber,
            call_leg_id: call.id,
            from: call.options?.remoteCallerNumber,
            to: call.options?.callerNumber,
            direction: call.direction,
            state: call.state,
            callObject: call,
            rawEvent: notification
          };

          console.log('Dispatching telnyxIncomingCall event with detail:', eventDetail);

          window.dispatchEvent(new CustomEvent('telnyxIncomingCall', {
            detail: eventDetail
          }));

          console.log('Event dispatched successfully');
        } catch (error) {
          console.error('Error dispatching incoming call event:', error);
        }
      }
    }
  });

  // Global incoming call handler - handle both WebSocket JSON-RPC and legacy events
  client.on('telnyx_rtc.invite', (event) => {
    console.log('Incoming call received (JSON-RPC invite):', event);
    // Trigger custom event for the UI to handle
    window.dispatchEvent(new CustomEvent('telnyxIncomingCall', {
      detail: {
        callID: event.params?.callID,
        caller_id_name: event.params?.caller_id_name,
        caller_id_number: event.params?.caller_id_number,
        callee_id_name: event.params?.callee_id_name,
        callee_id_number: event.params?.callee_id_number,
        telnyx_call_control_id: event.params?.telnyx_call_control_id,
        telnyx_session_id: event.params?.telnyx_session_id,
        voice_sdk_id: event.params?.voice_sdk_id,
        call_leg_id: event.params?.callID,
        from: event.params?.caller_id_number,
        to: event.params?.callee_id_number,
        rawEvent: event
      }
    }));
  });

  // Legacy incoming call handler (fallback)
  client.on('telnyx.call.received', (event) => {
    console.log('Incoming call received (legacy):', event);
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
  async answerCall(callEvent) {
    try {
      console.log('Attempting to answer call:', callEvent);

      let call;

      // Check if we have the actual call object from callUpdate event
      if (callEvent.callObject && typeof callEvent.callObject.answer === 'function') {
        console.log('Using call object from callUpdate event');
        call = callEvent.callObject;
        call.answer();
      } else if (typeof callEvent === 'object' && callEvent.answer) {
        // If we have a call object directly, answer it
        call = callEvent;
        call.answer();
      } else if (callEvent.rawEvent?.params) {
        // Handle JSON-RPC invite format
        const params = callEvent.rawEvent.params;

        // Find the call using the callID from the JSON-RPC message
        const incomingCall = this.client.calls.find(c =>
          c.id === params.callID ||
          c.telnyx_call_control_id === params.telnyx_call_control_id
        );

        if (incomingCall) {
          incomingCall.answer();
          call = incomingCall;
        } else {
          // Create a new call instance if not found
          console.log('Creating call instance for incoming call');
          call = this.client.newCall({
            callId: params.callID,
            telnyx_call_control_id: params.telnyx_call_control_id,
            telnyx_session_id: params.telnyx_session_id
          });
          call.answer();
        }
      } else {
        // Try to find by call ID
        const callId = callEvent.callID || callEvent.call_leg_id;
        const incomingCall = this.client.calls.find(c => c.id === callId);
        if (incomingCall) {
          incomingCall.answer();
          call = incomingCall;
        }
      }

      if (call) {
        this.setupCallEventListeners(call);
        this.currentCall = call;
        console.log('Call answered successfully:', call.id);
      } else {
        throw new Error('Could not find call object to answer');
      }

      return call;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  // Decline incoming call
  async declineCall(callEvent) {
    try {
      console.log('Attempting to decline call:', callEvent);

      // Check if we have the actual call object from callUpdate event
      if (callEvent.callObject && typeof callEvent.callObject.hangup === 'function') {
        console.log('Using call object from callUpdate event to decline');
        callEvent.callObject.hangup();
      } else if (typeof callEvent === 'object' && callEvent.hangup) {
        // If we have a call object directly, decline it
        callEvent.hangup();
      } else if (callEvent.rawEvent?.params) {
        // Handle JSON-RPC invite format
        const params = callEvent.rawEvent.params;

        // Find the call using the callID from the JSON-RPC message
        const incomingCall = this.client.calls.find(c =>
          c.id === params.callID ||
          c.telnyx_call_control_id === params.telnyx_call_control_id
        );

        if (incomingCall) {
          incomingCall.hangup();
        } else {
          // Send decline via call control if call object not found
          console.log('Declining call via call control API');
          // Use Telnyx Call Control API to reject the call
          await this.client.call_control_reject({
            call_control_id: params.telnyx_call_control_id
          });
        }
      } else {
        // Try to find by call ID
        const callId = callEvent.callID || callEvent.call_leg_id;
        const incomingCall = this.client.calls.find(c => c.id === callId);
        if (incomingCall) {
          incomingCall.hangup();
        }
      }

      console.log('Call declined successfully');
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