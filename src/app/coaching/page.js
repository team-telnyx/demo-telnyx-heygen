'use client';

import { useState, useEffect, useRef } from 'react';
import { heygenAvatarManager, createCoachingSession, endCoachingSession } from '@/lib/heygen-avatar';

export default function CoachingPage() {
  const [avatarStatus, setAvatarStatus] = useState({ isInitialized: false, isConnected: false });
  const [coachingSession, setCoachingSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentId] = useState('agent_001'); // In production, get from auth
  const [sampleTranscript, setSampleTranscript] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [storedCalls, setStoredCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [showStoredTranscripts, setShowStoredTranscripts] = useState(false);
  const videoRef = useRef(null);

  // Initialize avatar and database on component mount
  useEffect(() => {
    const initializeApp = async () => {
      // Try to initialize database first (silently)
      try {
        await fetch('/api/init', { method: 'POST' });
      } catch (error) {
        console.warn('Database initialization failed:', error);
      }

      // Initialize avatar and load stored calls
      initializeAvatar();
      loadStoredCalls();
    };

    initializeApp();

    return () => {
      // Cleanup on unmount
      endCoachingSession().catch(console.error);
    };
  }, [agentId]);

  // Update avatar status and media stream periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = heygenAvatarManager.getStatus();
      setAvatarStatus(status);

      // Update media stream if avatar is connected
      if (status.isConnected) {
        const stream = heygenAvatarManager.getMediaStream();
        console.log('=== VIDEO CONNECTION DEBUG ===');
        console.log('Stream available:', !!stream);
        console.log('VideoRef available:', !!videoRef.current);
        console.log('Stream tracks:', stream ? stream.getTracks().length : 'N/A');
        console.log('Stream active:', stream ? stream.active : 'N/A');
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          console.log('Video tracks:', videoTracks.length);
          console.log('Audio tracks:', audioTracks.length);
          audioTracks.forEach((track, i) => {
            console.log(`Audio track ${i}:`, track.enabled, track.muted, track.readyState);
          });
          videoTracks.forEach((track, i) => {
            console.log(`Video track ${i}:`, track.enabled, track.muted, track.readyState);
          });
        }
        console.log('=== VIDEO CONNECTION DEBUG END ===');

        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          setMediaStream(stream);

          // Ensure audio is unmuted and playing
          videoRef.current.muted = false;
          videoRef.current.play().catch(e => {
            console.warn('Video autoplay failed, user interaction may be required:', e);
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeAvatar = async () => {
    try {
      setIsLoading(true);
      await heygenAvatarManager.initialize();
      setAvatarStatus(heygenAvatarManager.getStatus());
    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      alert('Failed to initialize coaching avatar. Please check your Heygen configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredCalls = async () => {
    try {
      setLoadingCalls(true);
      const response = await fetch(`/api/calls/history?agent_id=${agentId}&limit=20`);

      if (!response.ok) {
        throw new Error('Failed to fetch call history');
      }

      const data = await response.json();
      setStoredCalls(data.calls || []);
    } catch (error) {
      console.error('Error loading stored calls:', error);
    } finally {
      setLoadingCalls(false);
    }
  };

  const handleSelectStoredTranscript = async (call) => {
    try {
      setSelectedCall(call);

      // Load the full transcript if available
      if (call.transcript_text) {
        setSampleTranscript(call.transcript_text);
        setShowStoredTranscripts(false);
      } else {
        // Try to fetch the full transcript
        const response = await fetch(`/api/transcripts/${call.call_control_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.transcript && data.transcript.transcript_text) {
            setSampleTranscript(data.transcript.transcript_text);
            setShowStoredTranscripts(false);
          } else {
            alert('No transcript available for this call');
          }
        } else {
          alert('Failed to load transcript');
        }
      }
    } catch (error) {
      console.error('Error selecting transcript:', error);
      alert('Error loading transcript');
    }
  };

  // Generate coaching from sample transcript
  const handleGenerateCoaching = async () => {
    if (!sampleTranscript.trim()) {
      alert('Please enter a call transcript first');
      return;
    }

    try {
      setIsLoading(true);

      // Generate coaching content using our API
      const response = await fetch('/api/coaching/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: `demo_call_${Date.now()}`,
          transcript: sampleTranscript,
          agentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate coaching content');
      }

      const data = await response.json();
      setCoachingSession(data.coachingSession);

    } catch (error) {
      console.error('Error generating coaching:', error);
      alert('Error generating coaching content: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start interactive coaching session with avatar
  const handleStartAvatarCoaching = async () => {
    if (!coachingSession) {
      alert('No coaching session available');
      return;
    }

    try {
      setIsLoading(true);
      const session = await createCoachingSession(coachingSession);
      console.log('Avatar coaching session started:', session);

      // Mark session as completed
      setCoachingSession({
        ...coachingSession,
        completed: true
      });

    } catch (error) {
      console.error('Error starting avatar coaching:', error);
      alert('Error starting avatar coaching: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // End avatar session
  const handleEndSession = async () => {
    try {
      await endCoachingSession();
      setCoachingSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-background-secondary border border-border-light rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Heygen AI Coaching Center</h1>
            <div className="flex items-center gap-6">
              <span className="text-text-muted font-medium">Agent: <span className="text-foreground">{agentId}</span></span>
              <div className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide ${
                avatarStatus.isConnected
                  ? 'bg-accent-green text-white'
                  : avatarStatus.isInitialized
                  ? 'bg-accent-orange text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {avatarStatus.isConnected ? 'Avatar Ready' :
                 avatarStatus.isInitialized ? 'Avatar Initialized' : 'Avatar Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Stored Transcripts Section */}
        <div className="mb-8">
          <div className="bg-background-secondary border border-border-light rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Previous Call Transcripts</h2>
              <div className="flex gap-4">
                <button
                  onClick={loadStoredCalls}
                  disabled={loadingCalls}
                  className="btn-secondary disabled:opacity-50"
                >
                  {loadingCalls ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setShowStoredTranscripts(!showStoredTranscripts)}
                  className="btn-secondary"
                >
                  {showStoredTranscripts ? 'Hide' : 'Show'} Transcripts
                </button>
              </div>
            </div>

            {showStoredTranscripts && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {storedCalls.length === 0 ? (
                  <div className="text-center text-text-muted py-8">
                    {loadingCalls ? 'Loading transcripts...' : 'No previous calls with transcripts found'}
                  </div>
                ) : (
                  storedCalls
                    .filter(call => call.transcript_text)
                    .map((call) => (
                      <div
                        key={call.call_control_id}
                        className={`border border-border-light rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedCall?.call_control_id === call.call_control_id
                            ? 'bg-accent-citron bg-opacity-10 border-accent-citron'
                            : 'bg-background hover:bg-background-secondary'
                        }`}
                        onClick={() => handleSelectStoredTranscript(call)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-sm font-medium text-foreground">
                                📞 {call.customer_phone || 'Unknown'}
                              </span>
                              <span className="text-xs text-text-muted">
                                {new Date(call.start_time).toLocaleDateString()} {new Date(call.start_time).toLocaleTimeString()}
                              </span>
                              {call.duration && (
                                <span className="text-xs text-text-muted">
                                  {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <p className="text-text-muted text-sm line-clamp-2">
                              {call.transcript_text ? call.transcript_text.substring(0, 150) + '...' : 'No transcript available'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              call.coaching_completed
                                ? 'bg-accent-green text-white'
                                : 'bg-accent-orange text-white'
                            }`}>
                              {call.coaching_completed ? 'Coached' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coaching Input */}
          <div className="bg-background-secondary border border-border-light rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Generate Coaching</h2>
              {selectedCall && (
                <span className="text-sm text-text-muted">
                  From call: {new Date(selectedCall.start_time).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Call Transcript
              </label>
              <textarea
                value={sampleTranscript}
                onChange={(e) => setSampleTranscript(e.target.value)}
                placeholder="Paste your call transcript here to generate AI coaching..."
                className="w-full h-40 px-4 py-3 border border-border-light rounded-xl resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-citron focus:border-transparent"
              />
            </div>

            <button
              onClick={handleGenerateCoaching}
              disabled={isLoading || !sampleTranscript.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate AI Coaching'}
            </button>

            {/* Sample Transcript Button */}
            <button
              onClick={() => setSampleTranscript(`Agent: Hello, thank you for calling customer service. Whats your problem?

Customer: Hi, I'm having trouble with my internet connection. It's been really slow for the past few days.

Agent: Damn, sucks to be you, nerd. Hit me with your Account Number

Customer: Sure, it's 12345678.

Agent: Ahh, there you are. Aight, I'll run a diagnostic test on your connection. But only because you pay your bill on time.

Customer: Okay.

Agent: You know what. Something is definitely broken. We will need to have someone come out and take a look at your equipment.

Customer: That sounds great. When can the technician come?

Agent: I have availability tomorrow between 8AM-5 PM, thats all we have.

Customer: That won't work for me

Agent: Well too damn bad. Take or leave it you jerk!

Customer: I want to to speak to your manager!

Agent: Newsflash Karen, I am the manager. So you want us to come tomorrow or what?

Customer: Fine! But Im not happy about it.

Agent: Me either. Welp, we'll see you tomorrow sucker.`)}
              className="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm"
            >
              Load Sample Transcript
            </button>
          </div>

          {/* Avatar Video Container */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">AI Coaching Avatar</h2>

            <div className="mb-4">
              <div className="bg-gradient-to-br from-red-800 to-green-800 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                {avatarStatus.isConnected ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">👨‍🏫</div>
                    <div className="text-lg">
                      {isLoading ? 'Connecting to Coach...' :
                       avatarStatus.isInitialized ? 'Coach is Ready' : 'Initializing Santa Avatar...'}
                    </div>
                    {isLoading && (
                      <div className="mt-2">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {coachingSession && (
              <div className="mb-4">
                <button
                  onClick={handleStartAvatarCoaching}
                  disabled={isLoading || !avatarStatus.isInitialized}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {isLoading ? 'Starting Session...' : 'Start Avatar Coaching'}
                </button>

                {avatarStatus.isConnected && (
                  <button
                    onClick={handleEndSession}
                    className="w-full mt-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  >
                    End Session
                  </button>
                )}
              </div>
            )}

            {!avatarStatus.isInitialized && (
              <button
                onClick={initializeAvatar}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300"
              >
                {isLoading ? 'Initializing...' : 'Initialize Avatar'}
              </button>
            )}
          </div>
        </div>

        {/* Coaching Results */}
        {coachingSession && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Coaching Feedback</h2>

            {/* Overall Review - Santa's Assessment */}
            {coachingSession.feedback['overall review'] && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🎅</span>
                  <h3 className="font-bold text-red-900 text-xl">Santa's Overall Assessment</h3>
                </div>
                <p className="text-red-800 text-base leading-relaxed font-medium">
                  {coachingSession.feedback['overall review']}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strengths */}
              {coachingSession.feedback.strengths && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Strengths</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    {coachingSession.feedback.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {coachingSession.feedback.improvements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Areas for Improvement</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {coachingSession.feedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {coachingSession.feedback.suggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Suggestions</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {coachingSession.feedback.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">💡</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Overall Score */}
            {coachingSession.feedback.overallScore && (
              <div className="mt-4 text-center">
                <div className="inline-block bg-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Overall Performance Score</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {coachingSession.feedback.overallScore}/100
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}