import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export default function LandingPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isVisitor, setIsVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'signup'>('guest');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (authMode === 'signup' && !email.trim()) {
      setError('Please enter your email');
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
    <div className="min-h-screen flex flex-col font-poppins text-gray-800 bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Navbar */}
      <header className="w-full flex justify-between items-center px-6 py-4 glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rwanda-green to-tech-blue flex items-center justify-center text-white shadow-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent">
            FuseTalk RW
          </h1>
        </div>
        
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <button onClick={() => scrollToSection('privacy')} className="hover:text-rwanda-green transition-colors">Privacy</button>
          <button onClick={() => scrollToSection('guidelines')} className="hover:text-rwanda-green transition-colors">Guidelines</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-rwanda-green transition-colors">About</button>
          <button 
            onClick={() => setShowJoinForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-rwanda-green to-tech-blue text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Start Chat
          </button>
        </nav>
        
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border rounded-lg text-rwanda-green border-rwanda-green/30 hover:bg-rwanda-green/10 transition-colors"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b shadow-lg">
          <nav className="flex flex-col gap-4 p-6 text-sm font-medium">
            <button onClick={() => scrollToSection('privacy')} className="text-left hover:text-rwanda-green transition-colors">Privacy</button>
            <button onClick={() => scrollToSection('guidelines')} className="text-left hover:text-rwanda-green transition-colors">Guidelines</button>
            <button onClick={() => scrollToSection('about')} className="text-left hover:text-rwanda-green transition-colors">About</button>
            <button 
              onClick={() => setShowJoinForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-rwanda-green to-tech-blue text-white rounded-full hover:shadow-lg transition-all text-center"
            >
              Start Chat
            </button>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-rwanda-green rounded-full animate-float"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-rwanda-yellow rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-tech-blue rounded-full animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
            <span className="text-lg">🇷🇼</span>
            Made for Rwanda, Built for the World
          </p>
          
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-rwanda-green via-tech-blue to-rwanda-green bg-clip-text text-transparent animate-gradient-x">
            Connect Through Random Chat
          </h2>
          
          <p className="max-w-2xl text-lg text-gray-600 mb-10 leading-relaxed">
            Meet new people through video or text chat. Choose your vibe, pick your language, and start conversations that matter.
          </p>

          {!showJoinForm ? (
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button 
                onClick={() => setShowJoinForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-rwanda-green to-tech-blue text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 animate-pulse-glow"
              >
                🎥 Start Video Chat
              </button>
              <button 
                onClick={() => setShowJoinForm(true)}
                className="px-8 py-4 border-2 border-rwanda-green text-rwanda-green font-semibold rounded-full hover:bg-rwanda-green hover:text-white transition-all duration-300"
              >
                💬 Text Only
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md mb-12 mx-auto">
              <div className="glass rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setAuthMode('guest')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      authMode === 'guest' 
                        ? 'bg-rwanda-green text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Continue as Guest
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      authMode === 'signup' 
                        ? 'bg-tech-blue text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleJoinChat} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rwanda-green focus:border-transparent bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your nickname..."
                      maxLength={50}
                      disabled={isLoading}
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tech-blue focus:border-transparent bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your email..."
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="visitor"
                      checked={isVisitor}
                      onChange={(e) => setIsVisitor(e.target.checked)}
                      className="h-4 w-4 text-rwanda-green focus:ring-rwanda-green border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor="visitor" className="text-sm text-gray-700 flex items-center gap-1">
                      I'm visiting Rwanda <span className="text-lg">🇷🇼</span>
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
                      className="flex-1 bg-gradient-to-r from-rwanda-green to-tech-blue text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? 'Joining...' : 'Start Chatting 🚀'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <StatCard number="1000+" label="Active Users" />
            <StatCard number="50K+" label="Connections Made" />
            <StatCard number="24/7" label="Available" />
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="about" className="px-6 py-20 bg-white/50 backdrop-blur-sm">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
          Why FuseTalk RW?
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Everything you need for safe, fun connections
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            emoji="🎵"
            title="Vibe Tags" 
            description="Match with people who share your interests - from music to tech to random fun."
          />
          <FeatureCard 
            emoji="🌍"
            title="3 Languages" 
            description="Chat in Kinyarwanda, English, French, or mixed - your choice!"
          />
          <FeatureCard 
            emoji="🛡️"
            title="Safety First" 
            description="AI moderation, report tools, and community guidelines keep everyone safe."
          />
          <FeatureCard 
            emoji="✨"
            title="Fuse Moments" 
            description="Great conversation? Both users can 'Fuse' to stay connected."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-rwanda-green/5 to-tech-blue/5 px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-16 text-gray-900">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
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
      <section id="privacy" className="px-6 py-20 bg-white/80 backdrop-blur-sm text-center">
        <h2 className="text-4xl font-bold mb-6 text-gray-900">Your Safety Matters</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-16 text-lg">
          We use AI moderation, community reporting, and clear guidelines to ensure everyone has a positive experience.
        </p>

        <div className="flex flex-wrap justify-center gap-8">
          <SafetyCard emoji="🤖" title="AI Content Filter" />
          <SafetyCard emoji="⚠️" title="Report & Block" />
          <SafetyCard emoji="⏭️" title="Instant Skip" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-rwanda-green to-tech-blue text-white text-center py-20 px-6">
        <h2 className="text-4xl font-bold mb-6">Ready to Connect?</h2>
        <p className="mb-10 text-xl opacity-90">Join thousands of people having meaningful conversations right now.</p>
        <button 
          onClick={() => setShowJoinForm(true)}
          className="px-10 py-4 bg-white text-rwanda-green font-bold text-lg rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-xl"
        >
          Start Chatting Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">FuseTalk RW</h3>
            <p className="text-sm leading-relaxed mb-4">
              Connecting people in Rwanda and beyond through safe, fun, and culturally vibrant random video and text chat.
            </p>
            <p className="text-xs text-rwanda-yellow">Made with ❤️ in Kigali</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setShowJoinForm(true)} className="hover:text-white transition-colors">Start Chat</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About Us</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => scrollToSection('guidelines')} className="hover:text-white transition-colors">Community Guidelines</button></li>
              <li><button onClick={() => scrollToSection('safety')} className="hover:text-white transition-colors">Safety</button></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-12 pt-8 border-t border-gray-800">
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
      <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent">{number}</div>
      <div className="text-sm text-gray-500 mt-2 font-medium">{label}</div>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="p-8 glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="font-semibold text-rwanda-green mb-3 text-lg">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="p-8 relative">
      <div className="w-16 h-16 bg-gradient-to-r from-rwanda-green to-tech-blue text-white text-2xl font-bold rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
        {step}
      </div>
      <h4 className="font-semibold mb-3 text-xl">{title}</h4>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function SafetyCard({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="p-8 glass rounded-2xl shadow-lg w-64 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20">
      <div className="text-4xl mb-4">{emoji}</div>
      <h4 className="font-semibold text-rwanda-green text-lg">{title}</h4>
    </div>
  );
}
