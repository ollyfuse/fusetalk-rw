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
  { id: "music", label: "Music & Culture", emoji: "♪", description: "Share your favorite beats and cultural vibes" },
  { id: "tech", label: "Tech & Innovation", emoji: "💻", description: "Discuss code, gadgets, and the future" },
  { id: "random", label: "Random Chat", emoji: "🎲", description: "Surprise me with anything!" },
  { id: "jokes", label: "Jokes & Fun", emoji: "😂", description: "Let's laugh and have a good time" },
  { id: "relationships", label: "Love & Vibes", emoji: "💞", description: "Deep conversations about life and connections" },
  { id: "travel", label: "Travel & Adventure", emoji: "✈️", description: "Share travel stories and adventures" },
];


const languages = [
  { id: "kinyarwanda", label: "Kinyarwanda", flag: "🇷🇼" },
  { id: "english", label: "English", flag: "🇺🇸" },
  { id: "french", label: "Français", flag: "🇫🇷" },
  { id: "mixed", label: "Mixed", flag: "🌍" },
];


export default function MatchingInterface({ onMatchFound }: MatchingInterfaceProps) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState<string | null>("relationships");
  const [chatMode, setChatMode] = useState<"video" | "text">("video");
  const [language, setLanguage] = useState("kinyarwanda");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      {/* <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => nav(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FuseTalk RW</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Find your perfect chat match</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden md:inline">Welcome, {user?.nickname}! 👋</span>
              <button
                onClick={() => nav('/fuse-moments')}
                className="flex items-center gap-2 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
              >
                <span className="hidden sm:inline">✨ My Fuse Moments</span>
                <span className="sm:hidden">✨</span>
              </button>
              <button 
                onClick={logout} 
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        {connectionError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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
          <div className={`mb-8 p-6 rounded-2xl shadow-lg ${
            matchStatus.status === 'matched' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
              : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">
                    {matchStatus.status === 'matched' ? '🎉' : '⏳'}
                  </div>
                  <h3 className="text-xl font-bold">
                    {matchStatus.status === 'matched' ? 'Match Found!' : 'Finding Your Match...'}
                  </h3>
                </div>
                <p className="text-white/90">{matchStatus.message}</p>
                {queuePosition && (
                  <p className="text-white/80 text-sm mt-1">Position in queue: #{queuePosition}</p>
                )}
              </div>
              {matchStatus.status === 'queued' && (
                <button
                  onClick={handleStopMatching}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

        {/* Matching Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's Get You Connected</h2>
            <p className="text-gray-600">Choose your preferences to find the perfect match</p>
          </div>

          {/* Chat Mode */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Mode</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setChatMode("video")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  chatMode === "video" 
                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Video + Audio</div>
                    <div className="text-sm opacity-75">Face-to-face conversation</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setChatMode("text")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  chatMode === "text" 
                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18v12H7l-4 4V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Text Only</div>
                    <div className="text-sm opacity-75">Message-based chat</div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Vibes */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Vibe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vibes.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => setSelectedVibe(vibe.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                    selectedVibe === vibe.id 
                      ? "border-orange-500 bg-orange-50 shadow-lg" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="text-3xl mb-3">{vibe.emoji}</div>
                  <div className="font-semibold text-gray-900 mb-1">{vibe.label}</div>
                  <div className="text-sm text-gray-600">{vibe.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preference</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    language === lang.id 
                      ? "border-orange-500 bg-orange-50 text-orange-700" 
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Start Matching Button */}
          <div className="text-center">
            <button
              onClick={handleStartMatching}
              disabled={isMatching || !selectedVibe || matchStatus?.status === 'queued'}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isMatching || matchStatus?.status === 'queued' ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Your Match...
                </div>
              ) : (
                'Start Matching 🚀'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
