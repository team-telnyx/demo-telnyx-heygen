import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Contact Center AI Coaching
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Enhance agent performance with AI-powered coaching using real call transcripts
            and interactive Heygen avatars for personalized training after every customer interaction.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Agent Dashboard
            </Link>
            <Link
              href="/coaching"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              AI Coaching
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">📞</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Call Interface</h3>
            <p className="text-gray-600">
              Handle calls with Telnyx WebRTC integration, displaying AI insights
              and transcripts during live customer interactions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Automatically analyze call transcripts using Telnyx AI Inference
              to generate personalized coaching feedback and suggestions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Interactive Avatar Coaching</h3>
            <p className="text-gray-600">
              Receive coaching through Heygen's streaming avatar technology
              for engaging, personalized training experiences.
            </p>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">Handle Calls</h4>
              <p className="text-sm text-gray-600">Agents use the dashboard to make and receive calls via Telnyx WebRTC</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">Process Transcripts</h4>
              <p className="text-sm text-gray-600">Webhooks capture call data and transcripts for analysis</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">Generate Coaching</h4>
              <p className="text-sm text-gray-600">AI analyzes performance and creates personalized feedback</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">Deliver Training</h4>
              <p className="text-sm text-gray-600">Avatar presents coaching content in an engaging format</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-gray-900 text-white rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Built With</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Frontend</h4>
              <p className="text-sm text-gray-300">Next.js, React, Tailwind CSS</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Voice Platform</h4>
              <p className="text-sm text-gray-300">Telnyx WebRTC & AI Inference</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Avatar Technology</h4>
              <p className="text-sm text-gray-300">Heygen Streaming Avatar</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Deployment</h4>
              <p className="text-sm text-gray-300">Next.js API Routes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
