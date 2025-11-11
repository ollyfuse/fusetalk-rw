import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { matchingAPI } from '../../services/api';
import { MatchRequest, MatchResponse } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface MatchingInterfaceProps {
  onMatchFound?: (sessionId: string, matchedUser: string) => void;
}

const VIBE_TAGS = [
  { id: 'random', label: '🎲 Random', description: 'Surprise me!' },
  { id: 'music', label: '🎵 Music', description: 'Talk about beats & melodies' },
  { id: 'tech', label: '💻 Tech', description: 'Code, gadgets & innovation' },
  { id: 'jokes', label: '😂 Jokes', description: 'Share laughs & humor' },
  { id: 'relationships', label: '💕 Relationships', description: 'Life & connections' },
  { id: 'travel', label: '✈️ Travel', description: 'Adventures & places' },
];

const LANGUAGES = [
  { id: 'mixed', label: '🌍 Mixed', description: 'Any language' },
  { id: 'english', label: '🇺🇸 English', description: 'English only' },
  { id: 'kinyarwanda', label: '🇷🇼 Kinyarwanda', description: 'Kinyarwanda only' },
  { id: 'french', label: '🇫🇷 French', description: 'French only' },
];

const MatchingInterface: React.FC<MatchingInterfaceProps> = ({ onMatchFound }) => {
  const { user, logout } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState('random');
  const [selectedLanguage, setSelectedLanguage] = useState('mixed');
  const [isMatching, setIsMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchResponse | null>(null);
  const [error, setError] = useState('');
  const [showMatchNotification, setShowMatchNotification] = useState(false);

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
      setShowMatchNotification(true);
      setIsMatching(false);

      // Call the onMatchFound callback
      if (onMatchFound) {
        onMatchFound(message.session_id, message.matched_user);
      }
      
      // Hide notification after 5 seconds
      setTimeout(() => setShowMatchNotification(false), 10000);
    } else if (message.type === 'queue_update') {
      // Update queue position if needed
      console.log('Queue position update:', message.position);
    }
  };

  // WebSocket hook
  const { isConnected, connectionError } = useWebSocket(handleWebSocketMessage);

  const handleStartMatching = async () => {
    setIsMatching(true);
    setError('');
    setMatchStatus(null);

    try {
      const matchRequest: MatchRequest = {
        vibe_tag: selectedVibe,
        language: selectedLanguage,
        is_visitor: user?.country !== 'Rwanda', // Simple logic for now
      };

      const response = await matchingAPI.joinQueue(matchRequest);
      setMatchStatus(response);

      if (response.status === 'matched') {
        // Call the onMatchFound callback for HTTP matches too
        if (onMatchFound && response.session_id) {
          onMatchFound(response.session_id, response.matched_user || 'Unknown');
        }
        console.log('Matched! Session ID:', response.session_id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join matching queue');
    } finally {
      setIsMatching(false);
    }
  };

  const handleStopMatching = async () => {
    try {
      await matchingAPI.leaveQueue();
      setMatchStatus(null);
      setIsMatching(false);
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  };

  return (
    <div className="min-h-screen bg-soft-grey">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-montserrat font-bold text-kigali-blue">
              FuseTalk RW
            </h1>
            <p className="text-sm text-gray-600">Welcome, {user?.nickname}! 👋</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Leave
          </button>
        </div>
      </div>

      {/* WebSocket Status */}
      <div className="max-w-2xl mx-auto px-6">
        {connectionError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm">
              ⚠️ Connection issue: {connectionError}. Real-time updates may be delayed.
            </p>
          </div>
        )}
        
        {!isConnected && !connectionError && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              🔄 Connecting to real-time updates...
            </p>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Match Status */}
        {matchStatus && (
          <div className={`mb-6 p-4 rounded-xl ${
            matchStatus.status === 'matched' 
              ? 'bg-success-green text-white' 
              : 'bg-kigali-blue text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {matchStatus.status === 'matched' ? '🎉 Match Found!' : '⏳ In Queue'}
                </h3>
                <p className="text-sm opacity-90">{matchStatus.message}</p>
              </div>
              {matchStatus.status === 'queued' && (
                <button
                  onClick={handleStopMatching}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Matching Form */}
        {!matchStatus && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Choose Your Vibe 🎯
            </h2>

            {/* Vibe Tags */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                What do you want to talk about?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {VIBE_TAGS.map((vibe) => (
                  <button
                    key={vibe.id}
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedVibe === vibe.id
                        ? 'border-kigali-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{vibe.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{vibe.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Preferred Language
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedLanguage === lang.id
                        ? 'border-kigali-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{lang.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{lang.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Matching Button */}
            <button
              onClick={handleStartMatching}
              disabled={isMatching}
              className="w-full bg-gradient-to-r from-kigali-blue to-sunset-orange text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {isMatching ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Finding Your Match...
                </div>
              ) : (
                'Find Someone to Chat With! 🚀'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Match Notification Popup */}
      {showMatchNotification && matchStatus?.status === 'matched' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-success-green mb-2">
              Match Found!
            </h2>
            <p className="text-gray-600 mb-6">
              You're connected with <strong>{matchStatus.matched_user}</strong>
            </p>
            <button
                onClick={() => {
                setShowMatchNotification(false);
                if (onMatchFound && matchStatus.session_id) {
                    onMatchFound(matchStatus.session_id, matchStatus.matched_user || 'Unknown');
                }
                }}
                className="bg-success-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
                Start Chatting! 💬
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingInterface;
