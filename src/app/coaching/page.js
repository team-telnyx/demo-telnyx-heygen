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
  const videoRef = useRef(null);

  // Initialize avatar on component mount
  useEffect(() => {
    initializeAvatar();

    return () => {
      // Cleanup on unmount
      endCoachingSession().catch(console.error);
    };
  }, []);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Coaching Center</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Agent: {agentId}</span>
              <div className={`px-3 py-1 rounded-full text-sm ${
                avatarStatus.isConnected
                  ? 'bg-green-100 text-green-800'
                  : avatarStatus.isInitialized
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {avatarStatus.isConnected ? 'Avatar Ready' :
                 avatarStatus.isInitialized ? 'Avatar Initialized' : 'Avatar Disconnected'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coaching Input */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Coaching</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Transcript
              </label>
              <textarea
                value={sampleTranscript}
                onChange={(e) => setSampleTranscript(e.target.value)}
                placeholder="Paste your call transcript here to generate AI coaching..."
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md resize-none"
              />
            </div>

            <button
              onClick={handleGenerateCoaching}
              disabled={isLoading || !sampleTranscript.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isLoading ? 'Generating...' : 'Generate AI Coaching'}
            </button>

            {/* Sample Transcript Button */}
            <button
              onClick={() => setSampleTranscript(`Agent: Hello, thank you for calling customer service. How can I help you today?

Customer: Hi, I'm having trouble with my internet connection. It's been really slow for the past few days.

Agent: I'm sorry to hear you're experiencing slow internet. Let me help you with that. Can you please provide me with your account number?

Customer: Sure, it's 12345678.

Agent: Thank you. I can see your account here. Let me run a quick diagnostic test on your connection. Please hold on for just a moment.

Customer: Okay.

Agent: I can see that there's been some congestion in your area. I'm going to reset your connection remotely and also schedule a technician to check the lines in your neighborhood.

Customer: That sounds great. When can the technician come?

Agent: I have availability tomorrow between 2-4 PM or Friday between 10 AM-12 PM. Which works better for you?

Customer: Tomorrow afternoon works perfectly.

Agent: Perfect! I've scheduled that for you. You should receive a confirmation text shortly. Is there anything else I can help you with today?

Customer: No, that's everything. Thank you so much for your help!

Agent: You're very welcome! Have a great day.`)}
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
                    <div className="text-4xl mb-4">🎅</div>
                    <div className="text-lg">
                      {isLoading ? 'Connecting to Santa...' :
                       avatarStatus.isInitialized ? 'Santa Avatar Ready' : 'Initializing Santa Avatar...'}
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