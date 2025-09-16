'use client';

import { useState, useEffect } from 'react';
import { getTelnyxClient, CallManager } from '@/lib/telnyx-client';
import { TelnyxRTC } from '@telnyx/webrtc';
import AudioPlayer from '@/components/AudioPlayer';

export default function Dashboard() {
  const [telnyxClient, setTelnyxClient] = useState(null);
  const [callManager, setCallManager] = useState(null);
  const [callStatus, setCallStatus] = useState({ status: 'idle' });
  const [agentId] = useState('agent_001'); // In production, get from auth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [transcriptStream, setTranscriptStream] = useState(null);

  // Initialize SSE transcript stream
  useEffect(() => {
    // console.log('Dashboard mounted - Connecting to transcript stream...');

    const eventSource = new EventSource('/api/transcripts/stream');
    // console.log('EventSource created:', eventSource);

    eventSource.onopen = () => {
      // console.log('Transcript stream connected successfully');
    };

    eventSource.onmessage = (event) => {
      // console.log('Received SSE message:', event.data);
      try {
        const data = JSON.parse(event.data);
        // console.log('Parsed transcript data:', data);

        if (data.type === 'transcript' && data.transcript) {
          // console.log('Updating transcript:', data.transcript.length, 'characters');
          setTranscript(data.transcript);
        } else if (data.type === 'connected') {
          // console.log('Initial connection confirmed');
        }
      } catch (error) {
        console.error('Error parsing transcript stream data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Transcript stream error:', error);
      // Retry connection if it fails (common on page reload)
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed, will reconnect on next page load');
      }
    };

    setTranscriptStream(eventSource);

    return () => {
      // console.log('🔌 Closing transcript stream');
      eventSource.close();
    };
  }, []);

  // Initialize Telnyx client on component mount
  useEffect(() => {
    const initClient = async () => {
      try {
        const client = getTelnyxClient();
        if (client) {
          setTelnyxClient(client);

          const manager = new CallManager(client, agentId);
          setCallManager(manager);

          // Set up connection event listeners
          client.on('telnyx.ready', () => {
            setIsConnected(true);
            console.log('=== WEBRTC CLIENT READY ===');
            console.log('Client state:', client.connected);
            console.log('Client calls:', client.calls);
          });

          client.on('telnyx.error', (error) => {
            setIsConnected(false);
            console.error('Telnyx connection error:', error);
          });

          // Listen for notifications (exactly like Telnyx demo)
          const onNotification = (notification) => {
            console.log('=== WEBRTC NOTIFICATION RECEIVED ===', notification);

            if (notification.type !== "callUpdate") {
              console.log('Non-callUpdate notification:', notification.type);
              return;
            }
            if (!notification.call) {
              console.log('No call object in notification');
              return;
            }

            // Process call state like Telnyx demo
            console.log('Processing call update:', notification.call);
            notification.call = TelnyxRTC.telnyxStateCall(notification.call);
            setCurrentNotification(notification);

            console.log('Call state updated:', notification.call.state, 'Direction:', notification.call.direction);
          };

          client.on('telnyx.notification', onNotification);

          await client.connect();
        }
      } catch (error) {
        console.error('Error initializing Telnyx client:', error);
      }
    };

    initClient();

    return () => {
      if (telnyxClient) {
        telnyxClient.disconnect();
      }
    };
  }, [agentId]);

  // No longer needed - using notifications for real-time call state updates

  // Make outbound call
  const handleMakeCall = async () => {
    if (callManager && phoneNumber) {
      try {
        await callManager.makeCall(phoneNumber);
      } catch (error) {
        alert('Error making call: ' + error.message);
      }
    }
  };

  // Answer incoming call (simple like Telnyx demo)
  const handleAnswerCall = () => {
    if (currentNotification?.call) {
      console.log('Answering call:', currentNotification.call.id);
      currentNotification.call.answer();
    }
  };

  // Decline incoming call (simple like Telnyx demo)
  const handleDeclineCall = () => {
    if (currentNotification?.call) {
      console.log('Declining call:', currentNotification.call.id);
      currentNotification.call.hangup();
    }
  };

  // Hang up call (simple like Telnyx demo)
  const handleHangupCall = () => {
    if (currentNotification?.call) {
      console.log('Hanging up call:', currentNotification.call.id);
      currentNotification.call.hangup();
    }
  };

  // Hold/unhold call
  const handleToggleHold = () => {
    if (currentNotification?.call) {
      if (currentNotification.call.state === 'held') {
        currentNotification.call.unhold();
      } else {
        currentNotification.call.hold();
      }
    }
  };

  // Mute/unmute call
  const handleToggleMute = () => {
    if (currentNotification?.call) {
      if (currentNotification.call.muted) {
        currentNotification.call.unmute();
      } else {
        currentNotification.call.mute();
      }
    }
  };

  // Get AI insights for current conversation
  const handleGetInsights = async () => {
    if (!transcript || !currentNotification?.call?.id) return;

    try {
      const response = await fetch('/api/calls/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: currentNotification.call.id,
          currentTranscript: transcript,
          context: 'Live call in progress'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error('Error getting AI insights:', error);
    }
  };

  // Helper function to get current call state (like Telnyx demo)
  const getCurrentCallState = () => {
    if (!currentNotification || !currentNotification.call) {
      return 'idle';
    }
    return currentNotification.call.state;
  };

  // Helper function to check if we have an active call
  const hasActiveCall = () => {
    const state = getCurrentCallState();
    return ['active', 'held', 'ringing'].includes(state);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-background-secondary border border-border-light rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Agent Dashboard</h1>
            <div className="flex items-center gap-6">
              <span className="text-text-muted font-medium">Agent: <span className="text-foreground">{agentId}</span></span>
              <div className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide ${
                isConnected
                  ? 'bg-accent-green text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Call Controls */}
          <div className="lg:col-span-1">
            <div className="bg-background-secondary border border-border-light rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Call Controls</h2>

              {/* Incoming Call Display */}
              {getCurrentCallState() === 'ringing' && currentNotification?.call && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-lg font-bold text-blue-900 mb-2">📞 Incoming Call</div>
                  <div className="space-y-1 text-sm mb-3 text-black">
                    <div><strong>From:</strong> {currentNotification.call.options?.remoteCallerName || currentNotification.call.options?.remoteCallerNumber || 'Unknown'}</div>
                    <div><strong>Number:</strong> {currentNotification.call.options?.remoteCallerNumber}</div>
                    <div><strong>To:</strong> {currentNotification.call.options?.callerNumber}</div>
                    <div><strong>Call ID:</strong> {currentNotification.call.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnswerCall}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex-1"
                    >
                      ✓ Answer
                    </button>
                    <button
                      onClick={handleDeclineCall}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold flex-1"
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Call Status */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Status</div>
                <div className={`text-lg font-semibold ${
                  getCurrentCallState() === 'active' ? 'text-green-600' :
                  getCurrentCallState() === 'ringing' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {getCurrentCallState().charAt(0).toUpperCase() + getCurrentCallState().slice(1)}
                </div>
                {currentNotification?.call?.id && (
                  <div className="text-xs text-gray-500 mt-1">
                    Call ID: {currentNotification.call.id}
                  </div>
                )}
              </div>

              {/* Outbound Call */}
              {getCurrentCallState() === 'idle' && (
                <div className="mb-4">
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                  />
                  <button
                    onClick={handleMakeCall}
                    disabled={!phoneNumber || !isConnected}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Make Call
                  </button>
                </div>
              )}

              {/* Active Call Controls */}
              {(getCurrentCallState() === 'active' || getCurrentCallState() === 'held') && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleToggleHold}
                      className={`py-2 px-4 rounded-md ${
                        getCurrentCallState() === 'held'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {getCurrentCallState() === 'held' ? 'Unhold' : 'Hold'}
                    </button>
                    <button
                      onClick={handleToggleMute}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
                    >
                      Mute
                    </button>
                  </div>
                  <button
                    onClick={handleHangupCall}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  >
                    Hang Up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Transcript & AI Insights */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Live Assistance</h2>
                {getCurrentCallState() === 'active' && (
                  <button
                    onClick={handleGetInsights}
                    disabled={!transcript}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 text-sm"
                  >
                    Get AI Insights
                  </button>
                )}
              </div>

              {/* Mock Transcript Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Transcript (Live)
                </label>
                <textarea
                  value={transcript}
                  onChange={() => {}} // Read-only, controlled by SSE stream
                  placeholder={
                    getCurrentCallState() === 'active'
                      ? 'Live transcript will appear here during call...'
                      : 'Start a call to see live transcript'
                  }
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md resize-none bg-white text-black"
                  readOnly={true}
                />
              </div>

              {/* AI Insights */}
              {aiInsights && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">AI Insights</h3>

                  {aiInsights.suggestions && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Suggestions:</h4>
                      <ul className="text-sm text-blue-700 list-disc list-inside">
                        {aiInsights.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiInsights.nextSteps && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Next Steps:</h4>
                      <ul className="text-sm text-blue-700 list-disc list-inside">
                        {aiInsights.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs">
                    <span className="text-blue-600">
                      Sentiment: <strong>{aiInsights.customerSentiment}</strong>
                    </span>
                    <span className="text-blue-600">
                      Urgency: <strong>{aiInsights.urgency}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Player for Remote Stream */}
        {currentNotification?.call?.remoteStream && (
          <AudioPlayer
            mediaStream={currentNotification.call.remoteStream}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
}