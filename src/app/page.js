import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <h1 className="text-6xl font-bold text-foreground mb-8 tracking-tight">
            Contact Center AI Coaching
          </h1>
          <p className="text-xl text-text-muted mb-12 max-w-4xl mx-auto leading-relaxed">
            Enhance agent performance with AI-powered coaching using real call transcripts
            and interactive Heygen avatars for personalized training after every customer interaction.
          </p>
          <div className="flex gap-6 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary"
            >
              Agent Dashboard
            </Link>
            <Link
              href="/coaching"
              className="btn-secondary"
            >
              AI Coaching
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="bg-background-secondary border border-border-light rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-accent-citron rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Real-time Call Interface</h3>
            <p className="text-text-muted leading-relaxed">
              Handle calls with Telnyx WebRTC integration, displaying AI insights
              and transcripts during live customer interactions.
            </p>
          </div>

          <div className="bg-background-secondary border border-border-light rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-accent-orange rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">AI-Powered Analysis</h3>
            <p className="text-text-muted leading-relaxed">
              Automatically analyze call transcripts using Telnyx AI Inference
              to generate personalized coaching feedback and suggestions.
            </p>
          </div>

          <div className="bg-background-secondary border border-border-light rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-accent-green rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Interactive Avatar Coaching</h3>
            <p className="text-text-muted leading-relaxed">
              Receive coaching through Heygen's streaming avatar technology
              for engaging, personalized training experiences.
            </p>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-background-secondary border border-border-light rounded-2xl p-12 mb-24">
          <h2 className="text-3xl font-semibold mb-12 text-center text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-accent-citron rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-foreground">1</span>
              </div>
              <h4 className="font-semibold mb-3 text-foreground text-lg">Handle Calls</h4>
              <p className="text-text-muted">Agents use the dashboard to make and receive calls via Telnyx WebRTC</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-semibold mb-3 text-foreground text-lg">Process Transcripts</h4>
              <p className="text-text-muted">Webhooks capture call data and transcripts for analysis</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-semibold mb-3 text-foreground text-lg">Generate Coaching</h4>
              <p className="text-text-muted">AI analyzes performance and creates personalized feedback</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-background">4</span>
              </div>
              <h4 className="font-semibold mb-3 text-foreground text-lg">Deliver Training</h4>
              <p className="text-text-muted">Avatar presents coaching content in an engaging format</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-foreground text-background rounded-2xl p-12">
          <h2 className="text-3xl font-semibold mb-12 text-center">Built With</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-lg">Frontend</h4>
              <p className="text-background opacity-75">Next.js, React, Tailwind CSS</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-lg">Voice Platform</h4>
              <p className="text-background opacity-75">Telnyx WebRTC & AI Inference</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-lg">Avatar Technology</h4>
              <p className="text-background opacity-75">Heygen Streaming Avatar</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-lg">Deployment</h4>
              <p className="text-background opacity-75">Next.js API Routes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
