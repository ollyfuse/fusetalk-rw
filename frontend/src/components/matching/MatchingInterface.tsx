import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { matchingAPI } from '../../services/api';
import { MatchRequest, MatchResponse } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface MatchingInterfaceProps {
  onMatchFound?: (sessionId: string, matchedUser: string) => void;
}

const vibes = [
  { id: "music", label: "Music & Culture", emoji: "🎵", description: "Share beats and cultural vibes", color: "from-purple-500 to-pink-500" },
  { id: "tech", label: "Tech & Innovation", emoji: "💻", description: "Code, gadgets, and future", color: "from-blue-500 to-cyan-500" },
  { id: "random", label: "Random Chat", emoji: "🎲", description: "Surprise me with anything!", color: "from-orange-500 to-red-500" },
  { id: "jokes", label: "Jokes & Fun", emoji: "😂", description: "Let's laugh together", color: "from-yellow-500 to-orange-500" },
  { id: "relationships", label: "Love & Vibes", emoji: "💞", description: "Deep life conversations", color: "from-pink-500 to-rose-500" },
  { id: "travel", label: "Travel & Adventure", emoji: "✈️", description: "Stories and adventures", color: "from-green-500 to-teal-500" },
];

const languages = [
  { id: "kinyarwanda", label: "Kinyarwanda", flag: "🇷🇼", color: "border-rwanda-green" },
  { id: "english", label: "English", flag: "🇺🇸", color: "border-blue-500" },
  { id: "french", label: "Français", flag: "🇫🇷", color: "border-blue-600" },
  { id: "mixed", label: "Mixed", flag: "🌍", color: "border-tech-blue" },
];

export default function MatchingInterface({ onMatchFound }: MatchingInterfaceProps) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState<string | null>("relationships");
  const [language, setLanguage] = useState("mixed");
  const [isMatching, setIsMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchResponse | null>(null);
  const [error, setError] = useState('');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  // WebSocket message handler
  const handleWebSocketMessage = (message: any) => {
    console.log('Received WebSocket message:', message);
    
    if (message.type === 'match_found') {
      setMatchStatus({
        status: 'matched',
        session_id: message.session_id,
        matched_user: message.matched_user,
        message: message.message,
      });
      setIsMatching(false);
      setQueuePosition(null);

      if (onMatchFound) {
        onMatchFound(message.session_id, message.matched_user);
      }
    } else if (message.type === 'queue_update') {
      setQueuePosition(message.position);
    }
  };

  const { isConnected, connectionError } = useWebSocket(handleWebSocketMessage);

  const handleStartMatching = async () => {
    if (!selectedVibe) return;
    
    setIsMatching(true);
    setError('');
    setMatchStatus(null);
    setQueuePosition(null);

    try {
      const matchRequest: MatchRequest = {
        vibe_tag: selectedVibe,
        language: language,
        is_visitor: user?.country !== 'Rwanda',
      };

      const response = await matchingAPI.joinQueue(matchRequest);
      setMatchStatus(response);

      if (response.status === 'matched' && onMatchFound && response.session_id) {
        onMatchFound(response.session_id, response.matched_user || 'Unknown');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to join matching queue');
      setIsMatching(false);
    }
  };

  const handleStopMatching = async () => {
    try {
      await matchingAPI.leaveQueue();
      setMatchStatus(null);
      setIsMatching(false);
      setQueuePosition(null);
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoStart') === 'true' && selectedVibe) {
      setTimeout(() => {
        handleStartMatching();
      }, 500);
      nav('/connect', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 font-poppins">
      {/* Header */}
      {/* <header className="glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => nav('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-rwanda-green transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rwanda-green to-tech-blue flex items-center justify-center text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent">FuseTalk RW</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Find your perfect match</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden md:inline">Hey, {user?.nickname}! 👋</span>
            <button
              onClick={() => nav('/fuse-moments')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <span className="hidden sm:inline">✨ Fuse Moments</span>
              <span className="sm:hidden">✨</span>
            </button>
            <button 
              onClick={logout} 
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              Leave
            </button>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Connection Status */}
        {connectionError && (
          <div className="mb-6 glass border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800 text-sm font-medium">Connection issue detected. Real-time updates may be delayed.</p>
            </div>
          </div>
        )}

        {/* Match Status */}
        {matchStatus && (
          <div className={`mb-8 p-6 rounded-2xl shadow-xl border border-white/20 ${
            matchStatus.status === 'matched' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
              : 'bg-gradient-to-r from-rwanda-green to-tech-blue text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">
                    {matchStatus.status === 'matched' ? '🎉' : '⏳'}
                  </div>
                  <h3 className="text-2xl font-bold">
                    {matchStatus.status === 'matched' ? 'Match Found!' : 'Finding Your Match...'}
                  </h3>
                </div>
                <p className="text-white/90 text-lg">{matchStatus.message}</p>
                {queuePosition && (
                  <p className="text-white/80 text-sm mt-2">Position in queue: #{queuePosition}</p>
                )}
              </div>
              {matchStatus.status === 'queued' && (
                <button
                  onClick={handleStopMatching}
                  className="glass px-6 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/30"
                >
                  Stop Matching
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Setup Form */}
        <div className="glass rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent mb-3">
              Let's Get You Connected
            </h2>
            <p className="text-gray-600 text-lg">Choose your vibe and language to find the perfect match</p>
          </div>

          {/* Vibes Section */}
          <section className="mb-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Choose Your Vibe
            </h3>
            
            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {vibes.map((vibe) => (
                  <button
                    key={vibe.id}
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={`flex-shrink-0 w-48 p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedVibe === vibe.id 
                        ? `border-rwanda-green bg-gradient-to-br ${vibe.color} text-white shadow-xl` 
                        : "border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white"
                    }`}
                  >
                    <div className="text-3xl mb-3">{vibe.emoji}</div>
                    <div className={`font-semibold mb-2 ${selectedVibe === vibe.id ? 'text-white' : 'text-gray-900'}`}>
                      {vibe.label}
                    </div>
                    <div className={`text-sm ${selectedVibe === vibe.id ? 'text-white/90' : 'text-gray-600'}`}>
                      {vibe.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Language Section */}
          <section className="mb-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              Language Preference
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    language === lang.id 
                      ? `${lang.color} bg-gradient-to-br from-rwanda-green/10 to-tech-blue/10 shadow-lg` 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-semibold text-gray-900">{lang.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartMatching}
              disabled={isMatching || !selectedVibe || matchStatus?.status === 'queued'}
              className="px-12 py-4 bg-gradient-to-r from-rwanda-green to-tech-blue text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isMatching || matchStatus?.status === 'queued' ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Your Match...
                </div>
              ) : (
                'Start Matching 🚀'
              )}
            </button>
            
            {selectedVibe && (
              <p className="text-sm text-gray-500 mt-4">
                Ready to chat about <span className="font-semibold text-rwanda-green">
                  {vibes.find(v => v.id === selectedVibe)?.label}
                </span> in <span className="font-semibold text-tech-blue">
                  {languages.find(l => l.id === language)?.label}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 glass rounded-2xl p-6 border border-white/20">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Quick Tips
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Be respectful and kind
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Skip if not a good match
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Report inappropriate behavior
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
