'use client';

export default function IncomingCallPopup({ incomingCall, onAnswer, onDecline }) {
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Call Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl text-white">📞</span>
              </div>
            </div>
          </div>

          {/* Call Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h2>
            <p className="text-lg text-gray-600 mb-1">
              From: <strong>{incomingCall.from || 'Unknown Number'}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Call ID: {incomingCall.callId}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={onDecline}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors"
            >
              <span className="text-xl">📞</span>
              Decline
            </button>
            <button
              onClick={onAnswer}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors animate-pulse"
            >
              <span className="text-xl">📞</span>
              Answer
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-xs text-gray-400">
            Ringing...
          </div>
        </div>
      </div>
    </div>
  );
}