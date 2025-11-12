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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header - Only show when not in chat */}
      {!currentSession && (
        <header className="py-4 px-6 flex items-center justify-between border-b">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-lg">FuseTalk RW</span>
          </Link>

          <nav className="flex gap-4 items-center">
            <Link to="/fuse-moments" className="text-sm text-slate-600 hover:underline">
              ✨ My Fuse Moments
            </Link>
            <button 
              onClick={logout}
              className="text-sm text-slate-600 hover:underline"
            >
              Leave
            </button>
          </nav>
        </header>
      )}

      <main>
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
