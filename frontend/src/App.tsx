import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import MatchingInterface from './components/matching/MatchingInterface';
import ChatInterface from './components/chat/ChatInterface';
import FuseMomentsGallery from './components/chat/FuseMomentsGallery';
import './App.css';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    matchedUser: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-rwanda-green to-tech-blue rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse-glow">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent mb-2">
            FuseTalk RW
          </h3>
          <p className="text-gray-500 text-sm">Loading your experience...</p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-rwanda-green rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-rwanda-yellow rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 text-slate-800 font-poppins">
      {/* Header - Only show when not in chat */}
      {!currentSession && (
        <header className="glass sticky top-0 z-50 py-4 px-6 border-b border-white/20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rwanda-green to-tech-blue flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent">
                  FuseTalk RW
                </span>
                <p className="text-xs text-gray-500 hidden sm:block">Connect • Chat • Fuse</p>
              </div>
            </Link>

            <nav className="flex gap-4 items-center">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 glass rounded-full border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-br from-rwanda-green to-tech-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.nickname[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">Hey, {user.nickname}!</span>
              </div>
              
              <Link 
                to="/fuse-moments" 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-all duration-300 text-sm font-medium"
              >
                <span className="hidden sm:inline">✨ My Fuse Moments</span>
                <span className="sm:hidden">✨</span>
              </Link>
              
              <button 
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Leave
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Routes>
          <Route 
            path="/" 
            element={
              currentSession ? (
                <ChatInterface
                  sessionId={currentSession.sessionId}
                  matchedUser={currentSession.matchedUser}
                  onEndChat={() => setCurrentSession(null)}
                />
              ) : (
                <MatchingInterface 
                  onMatchFound={(sessionId: string, matchedUser: string) => {
                    setCurrentSession({ sessionId, matchedUser });
                  }}
                />
              )
            } 
          />
          <Route path="/connect" element={<Navigate to="/" replace />} />
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="/fuse-moments" element={<FuseMomentsGallery />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
