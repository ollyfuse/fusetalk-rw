import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import MatchingInterface from './components/matching/MatchingInterface';
import ChatInterface from './components/chat/ChatInterface';
import FuseMomentsGallery from './components/chat/FuseMomentsGallery';
import './App.css';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    matchedUser: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-soft-grey flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kigali-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
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
        <Route path="/fuse-moments" element={<FuseMomentsGallery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
