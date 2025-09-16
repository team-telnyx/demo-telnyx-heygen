'use client';

import { useState, useEffect } from 'react';
import { getTelnyxClient, CallManager } from '@/lib/telnyx-client';

export default function Dashboard() {
  const [telnyxClient, setTelnyxClient] = useState(null);
  const [callManager, setCallManager] = useState(null);
  const [callStatus, setCallStatus] = useState({ status: 'idle' });
  const [agentId] = useState('agent_001'); // In production, get from auth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // Initialize Telnyx client on component mount
  useEffect(() => {
    let handleIncomingCall;

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
            console.log('Agent dashboard connected to Telnyx');
          });

          client.on('telnyx.error', (error) => {
            setIsConnected(false);
            console.error('Telnyx connection error:', error);
          });

          // Listen for incoming calls via custom event
          handleIncomingCall = (event) => {
            console.log('=== INCOMING CALL EVENT ===');
            console.log('Full event:', event);
            console.log('Event detail:', event.detail);
            console.log('=== INCOMING CALL EVENT END ===');

            const callData = event.detail;

            setIncomingCall({
              callId: callData.callID || callData.call_leg_id,
              from: callData.from || callData.caller_id_number,
              to: callData.to || callData.callee_id_number,
              fromName: callData.caller_id_name,
              toName: callData.callee_id_name,
              callEvent: callData
            });

            setCallStatus({
              status: 'ringing',
              callId: callData.callID || callData.call_leg_id
            });
          };

          window.addEventListener('telnyxIncomingCall', handleIncomingCall);

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
      // Clean up event listeners
      if (handleIncomingCall) {
        window.removeEventListener('telnyxIncomingCall', handleIncomingCall);
      }
    };
  }, [agentId]);

  // Update call status periodically
  useEffect(() => {
    if (callManager) {
      const interval = setInterval(() => {
        setCallStatus(callManager.getCallStatus());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callManager]);

  // Make outbound call
  const handleMakeCall = async () => {
    if (callManager && phoneNumber) {
      try {
        await callManager.makeCall(phoneNumber);
        setCallStatus(callManager.getCallStatus());
      } catch (error) {
        alert('Error making call: ' + error.message);
      }
    }
  };

  // Answer incoming call from popup
  const handleAnswerIncomingCall = async () => {
    if (callManager && incomingCall) {
      try {
        await callManager.answerCall(incomingCall.callEvent);
        setCallStatus(callManager.getCallStatus());
        setIncomingCall(null); // Hide popup
      } catch (error) {
        alert('Error answering call: ' + error.message);
      }
    }
  };

  // Decline incoming call from popup
  const handleDeclineIncomingCall = async () => {
    if (callManager && incomingCall) {
      try {
        await callManager.declineCall(incomingCall.callEvent);
        setCallStatus({ status: 'idle' });
        setIncomingCall(null); // Hide popup
      } catch (error) {
        alert('Error declining call: ' + error.message);
      }
    }
  };

  // Hang up call
  const handleHangup = async () => {
    if (callManager) {
      try {
        await callManager.hangupCall();
        setCallStatus(callManager.getCallStatus());

        // Clear insights when call ends
        setAiInsights(null);
        setTranscript('');
      } catch (error) {
        alert('Error hanging up: ' + error.message);
      }
    }
  };

  // Toggle hold
  const handleToggleHold = async () => {
    if (callManager) {
      try {
        await callManager.toggleHold();
        setCallStatus(callManager.getCallStatus());
      } catch (error) {
        alert('Error toggling hold: ' + error.message);
      }
    }
  };

  // Toggle mute
  const handleToggleMute = async () => {
    if (callManager) {
      try {
        await callManager.toggleMute();
        setCallStatus(callManager.getCallStatus());
      } catch (error) {
        alert('Error toggling mute: ' + error.message);
      }
    }
  };

  // Get AI insights for current conversation
  const handleGetInsights = async () => {
    if (!transcript || !callStatus.callId) return;

    try {
      const response = await fetch('/api/calls/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callStatus.callId,
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
              {incomingCall && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-lg font-bold text-blue-900 mb-2">📞 Incoming Call</div>
                  <div className="space-y-1 text-sm mb-3">
                    <div><strong>From:</strong> {incomingCall.fromName || incomingCall.from || 'Unknown'}</div>
                    {incomingCall.from && <div><strong>Number:</strong> {incomingCall.from}</div>}
                    {incomingCall.to && <div><strong>To:</strong> {incomingCall.toName || incomingCall.to}</div>}
                    <div><strong>Call ID:</strong> {incomingCall.callId}</div>
                    {incomingCall.callEvent?.direction && <div><strong>Direction:</strong> {incomingCall.callEvent.direction}</div>}
                    {incomingCall.callEvent?.state && <div><strong>State:</strong> {incomingCall.callEvent.state}</div>}
                  </div>
                  <details className="mb-3">
                    <summary className="text-xs text-gray-500 cursor-pointer">Show Raw Data</summary>
                    <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify({
                        callID: incomingCall.callEvent?.callID,
                        direction: incomingCall.callEvent?.direction,
                        state: incomingCall.callEvent?.state,
                        caller_id_name: incomingCall.callEvent?.caller_id_name,
                        caller_id_number: incomingCall.callEvent?.caller_id_number,
                        callee_id_name: incomingCall.callEvent?.callee_id_name,
                        callee_id_number: incomingCall.callEvent?.callee_id_number
                      }, null, 2)}
                    </pre>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnswerIncomingCall}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex-1"
                    >
                      ✓ Answer
                    </button>
                    <button
                      onClick={handleDeclineIncomingCall}
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
                  callStatus.status === 'active' ? 'text-green-600' :
                  callStatus.status === 'ringing' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {callStatus.status.charAt(0).toUpperCase() + callStatus.status.slice(1)}
                </div>
                {callStatus.callId && (
                  <div className="text-xs text-gray-500 mt-1">
                    Call ID: {callStatus.callId}
                  </div>
                )}
              </div>

              {/* Outbound Call */}
              {callStatus.status === 'idle' && (
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

              {/* Incoming Call */}
              {callStatus.status === 'ringing' && (
                <button
                  onClick={handleAnswerIncomingCall}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 mb-2"
                >
                  Answer Call
                </button>
              )}

              {/* Active Call Controls */}
              {(callStatus.status === 'active' || callStatus.status === 'held') && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleToggleHold}
                      className={`py-2 px-4 rounded-md ${
                        callStatus.status === 'held'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {callStatus.status === 'held' ? 'Unhold' : 'Hold'}
                    </button>
                    <button
                      onClick={handleToggleMute}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
                    >
                      Mute
                    </button>
                  </div>
                  <button
                    onClick={handleHangup}
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
                {callStatus.status === 'active' && (
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
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    callStatus.status === 'active'
                      ? 'Transcript will appear here during call...'
                      : 'Start a call to see live transcript'
                  }
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md resize-none"
                  readOnly={callStatus.status !== 'active'}
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
      </div>
    </div>
  );
}