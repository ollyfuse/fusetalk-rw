import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isVisitor, setIsVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err: any) {
      setError(err.response?.data?.details?.nickname?.[0] || 'Failed to join. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kigali-blue to-sunset-orange flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-montserrat font-bold text-kigali-blue mb-2">
            FuseTalk RW
          </h1>
          <p className="text-gray-600 font-inter">
            Connect with Rwanda, one conversation at a time
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoinChat} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Choose your nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-kigali-blue focus:border-transparent"
              placeholder="Enter your nickname..."
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          {/* Visitor Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="visitor"
              checked={isVisitor}
              onChange={(e) => setIsVisitor(e.target.checked)}
              className="h-4 w-4 text-kigali-blue focus:ring-kigali-blue border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="visitor" className="text-sm text-gray-700">
              I'm visiting Rwanda 🇷🇼
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Join Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-kigali-blue to-sunset-orange text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              'Start Chatting 🚀'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By joining, you agree to be respectful and follow our community guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
