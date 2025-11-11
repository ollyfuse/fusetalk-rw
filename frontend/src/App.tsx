import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import MatchingInterface from './components/matching/MatchingInterface';
import ChatInterface from './components/chat/ChatInterface';
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
    return <LandingPage />;
  }

  if (currentSession) {
    return (
      <ChatInterface
        sessionId={currentSession.sessionId}
        matchedUser={currentSession.matchedUser}
        onEndChat={() => setCurrentSession(null)}
      />
    );
  }

  return (
    <MatchingInterface 
      onMatchFound={(sessionId: string, matchedUser: string) => {
        setCurrentSession({ sessionId, matchedUser });
      }}
    />
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
