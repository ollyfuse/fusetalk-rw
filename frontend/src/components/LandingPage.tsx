import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export default function LandingPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isVisitor, setIsVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const authResponse = await authAPI.registerGuest(nickname.trim(), isVisitor);
      login(authResponse);
      nav('/connect');
    } catch (err: any) {
      setError(err.response?.data?.details?.nickname?.[0] || 'Failed to join. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      {/* Navbar */}
      <header className="w-full flex justify-between items-center px-6 py-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-orange-600">FuseTalk RW</h1>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <button onClick={() => scrollToSection('privacy')} className="hover:text-orange-600">Privacy</button>
          <button onClick={() => scrollToSection('guidelines')} className="hover:text-orange-600">Guidelines</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-orange-600">About</button>
          <button 
            onClick={() => setShowJoinForm(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700"
          >
            Start Chat
          </button>
        </nav>
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border rounded-lg text-orange-600"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <nav className="flex flex-col gap-4 p-6 text-sm font-medium">
            <button onClick={() => scrollToSection('privacy')} className="text-left hover:text-orange-600">Privacy</button>
            <button onClick={() => scrollToSection('guidelines')} className="text-left hover:text-orange-600">Guidelines</button>
            <button onClick={() => scrollToSection('about')} className="text-left hover:text-orange-600">About</button>
            <button 
              onClick={() => setShowJoinForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 text-center"
            >
              Start Chat
            </button>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-16 bg-gradient-to-b from-orange-50 to-white">
        <p className="text-sm text-gray-500 mb-2">🇷🇼 Made for Rwanda, Built for the World</p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
          Connect Through Random Chat
        </h2>
        <p className="max-w-2xl text-gray-600 mb-8">
          Meet new people through video or text chat. Choose your vibe, pick your language, and start conversations that matter.
        </p>

        {!showJoinForm ? (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button 
              onClick={() => setShowJoinForm(true)}
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-full hover:bg-orange-700 transition-colors"
            >
              Start Video Chat
            </button>
            <button 
              onClick={() => setShowJoinForm(true)}
              className="px-6 py-3 border border-orange-600 text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-colors"
            >
              Text Only
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md mb-8">
            <form onSubmit={handleJoinChat} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border">
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your nickname..."
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="visitor"
                  checked={isVisitor}
                  onChange={(e) => setIsVisitor(e.target.checked)}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="visitor" className="text-sm text-gray-700">
                  I'm visiting Rwanda 🇷🇼
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Start Chatting 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 text-center">
          <StatCard number="1000+" label="Active Users" />
          <StatCard number="50K+" label="Connections Made" />
          <StatCard number="24/7" label="Available" />
        </div>
      </section>

      {/* Why Section */}
      <section id="about" className="px-6 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Why FuseTalk RW?
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Everything you need for safe, fun connections
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            title="Vibe Tags" 
            description="Match with people who share your interests - from music to tech to random fun."
          />
          <FeatureCard 
            title="3 Languages" 
            description="Chat in Kinyarwanda, English, French, or mixed - your choice!"
          />
          <FeatureCard 
            title="Safety First" 
            description="AI moderation, report tools, and community guidelines keep everyone safe."
          />
          <FeatureCard 
            title="Fuse Moments" 
            description="Great conversation? Both users can 'Fuse' to stay connected."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-10 text-gray-900">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <StepCard 
            step="1"
            title="Choose Your Vibe"
            description="Pick a topic that interests you - Music & Culture, Tech, Random Chat, or more."
          />
          <StepCard 
            step="2"
            title="Select Your Language"
            description="Choose between Kinyarwanda, English, French, or Mixed mode."
          />
          <StepCard 
            step="3"
            title="Start Chatting!"
            description="Get instantly matched with someone who shares your interests. Skip to next anytime."
          />
        </div>
      </section>

      {/* Safety Section */}
      <section id="privacy" className="px-6 py-16 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Your Safety Matters</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          We use AI moderation, community reporting, and clear guidelines to ensure everyone has a positive experience.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <SafetyCard title="AI Content Filter" />
          <SafetyCard title="Report & Block" />
          <SafetyCard title="Instant Skip" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-600 text-white text-center py-16 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to Connect?</h2>
        <p className="mb-8">Join thousands of people having meaningful conversations right now.</p>
        <button 
          onClick={() => setShowJoinForm(true)}
          className="px-8 py-3 bg-white text-orange-700 font-semibold rounded-full hover:bg-orange-100 transition-colors"
        >
          Start Chatting Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-2">FuseTalk RW</h3>
            <p className="text-sm">
              Connecting people in Rwanda and beyond through safe, fun, and culturally vibrant random video and text chat.
            </p>
            <p className="text-xs mt-2">Made with ❤️ in Kigali</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Platform</h4>
            <ul className="space-y-1 text-sm">
              <li><button onClick={() => setShowJoinForm(true)} className="hover:text-white">Start Chat</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-white">About Us</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li><button onClick={() => scrollToSection('privacy')} className="hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => scrollToSection('guidelines')} className="hover:text-white">Community Guidelines</button></li>
              <li><button onClick={() => scrollToSection('safety')} className="hover:text-white">Safety</button></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-10">
          © 2025 FuseTalk RW. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl sm:text-4xl font-extrabold text-orange-500">{number}</div>
      <div className="text-sm text-gray-500 mt-2">{label}</div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-orange-50 rounded-2xl shadow-sm">
      <h3 className="font-semibold text-orange-700 mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="p-6">
      <h3 className="text-orange-600 text-5xl font-bold mb-4">{step}</h3>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function SafetyCard({ title }: { title: string }) {
  return (
    <div className="p-6 bg-orange-50 rounded-2xl shadow-sm w-60">
      <h4 className="font-semibold text-orange-700 mb-1">{title}</h4>
    </div>
  );
}
