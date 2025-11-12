import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { chatAPI } from '../../services/api';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://172.20.10.5:8000';


interface ChatInterfaceProps {
  sessionId: string;
  matchedUser: string;
  onEndChat: () => void;
}

export default function ChatInterface({ 
  sessionId, 
  matchedUser, 
  onEndChat 
}: ChatInterfaceProps) {
  const nav = useNavigate();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Array<{ id: number; side: "them" | "me"; text: string }>>([]);
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showFuseMoment, setShowFuseMoment] = useState(false);
  const [showContactExchange, setShowContactExchange] = useState(false);
  const [fuseMomentData, setFuseMomentData] = useState<any>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    whatsapp: '',
    instagram: '',
    telegram: '',
    note: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWs = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isConnected: videoConnected,
    startCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC(sessionId, token || '', user?.id || '');

  // Video stream assignment
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  // Chat WebSocket
  useEffect(() => {
    if (!token) return;
    
    // const wsUrl = `ws://localhost:8000/ws/chat/${sessionId}/?token=${token}`;
    const wsUrl = `${WS_BASE_URL}/ws/chat/${sessionId}/?token=${token}`;

    chatWs.current = new WebSocket(wsUrl);
    
    chatWs.current.onopen = () => setIsConnected(true);
    chatWs.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          side: message.sender === user?.nickname ? "me" : "them",
          text: message.content
        }]);
      }
    };
    chatWs.current.onclose = () => setIsConnected(false);
    
    return () => chatWs.current?.close();
  }, [sessionId, token, user?.nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    if (!text.trim() || !isConnected) return;
    
    chatWs.current?.send(JSON.stringify({
      type: 'chat_message',
      content: text,
      sender: user?.nickname,
      timestamp: new Date().toISOString()
    }));
    
    setText("");
  }

  const handleLikeSession = async () => {
    if (hasLiked) return;
    
    try {
      const response = await chatAPI.likeSession(sessionId);
      setHasLiked(true);
      
      if (response.fuse_moment) {
        setFuseMomentData(response);
        setShowFuseMoment(true);
      }
    } catch (error) {
      console.error('Error liking session:', error);
    }
  };

  const handleShareContact = async () => {
    try {
      if (fuseMomentData?.fuse_moment_id) {
        await chatAPI.shareContact(fuseMomentData.fuse_moment_id, contactInfo);
      }
      setShowContactExchange(false);
      setShowFuseMoment(false);
    } catch (error) {
      console.error('Error sharing contact:', error);
    }
  };

  const handleNextPerson = () => {
  try {
    // 1. Clean up WebRTC streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // 2. Close WebSocket connection
    if (chatWs.current) {
      chatWs.current.close();
    }
    
    // 3. Call parent cleanup
    onEndChat();
    
    // 4. Navigate to matching with auto-start
    nav("/connect?autoStart=true");
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Still navigate even if cleanup fails
    onEndChat();
    nav("/connect");
  }
};

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className={`${isChatMinimized ? 'flex-1' : 'flex-1 lg:flex-[2]'} relative bg-black transition-all duration-300`}>
          {/* Video Content */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-gray-300 text-sm lg:text-base">Waiting for {matchedUser}...</p>
            </div>
          )}

          {/* Local Video */}
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-24 h-18 lg:w-32 lg:h-24 bg-gray-800 rounded-lg object-cover border-2 border-white shadow-lg"
            />
          )}

          {/* Connection Status */}
          <div className="absolute top-4 left-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              videoConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${videoConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {videoConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 lg:gap-3 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
                  isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  {isVideoEnabled ? (
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  ) : (
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v4c0 .368-.097.714-.268 1.014l-3.064-3.064C10.747 9.972 11 9.501 11 8.972V6a2 2 0 00-2-2H4.414l-1.121-1.121A1 1 0 003.707 2.293zM2 6c0-.364.097-.706.268-.994L8.586 11.414C8.219 11.597 7.623 12 7 12H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  )}
                </svg>
              </button>

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
                  isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  {isAudioEnabled ? (
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.899 8l-1.242-1.243a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all lg:hidden"
                title="Toggle chat"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Like Button */}
              <button 
                onClick={handleLikeSession}
                disabled={hasLiked}
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
                  hasLiked ? 'bg-pink-600 text-white cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
                title={hasLiked ? 'Already liked' : 'Like this conversation'}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Next Button */}
              <button 
                onClick={handleNextPerson}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-all"
                title="Next person"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* End Call */}
              <button
                onClick={onEndChat}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all"
                title="End call"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`${isChatMinimized ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 bg-white border-l border-gray-200`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {matchedUser[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{matchedUser}</h3>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">{isConnected ? 'Online' : 'Connecting...'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatMinimized(true)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-pink-50 px-2 py-1 rounded-full text-pink-600 border border-pink-200">💞 Love & Vibes</span>
              <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600 border border-blue-200">🌍 Mixed</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-gray-500 text-sm">You're now connected! Say hi to {matchedUser}</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.side === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    m.side === "me" 
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" 
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Type your message..."
                disabled={!isConnected}
              />
              <button 
                onClick={send} 
                disabled={!text.trim() || !isConnected}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fuse Moment Modal */}
      {showFuseMoment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            {!showContactExchange ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-pink-600 mb-2">Fuse Moment!</h2>
                <p className="text-gray-600 mb-6">
                  You both liked this conversation! Want to stay connected with {matchedUser}?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowContactExchange(true)}
                    className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium"
                  >
                    📱 Share Contact
                  </button>
                  <button
                    onClick={() => setShowFuseMoment(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">Share Your Contact Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+250 xxx xxx xxx"
                      value={contactInfo.whatsapp}
                      onChange={(e) => setContactInfo({...contactInfo, whatsapp: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Instagram</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={contactInfo.instagram}
                      onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Telegram</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={contactInfo.telegram}
                      onChange={(e) => setContactInfo({...contactInfo, telegram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Personal Note</label>
                    <textarea
                      placeholder="Great chatting with you!"
                      value={contactInfo.note}
                      onChange={(e) => setContactInfo({...contactInfo, note: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-20 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleShareContact}
                    className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium"
                  >
                    Share & Connect ✨
                  </button>
                  <button
                    onClick={() => setShowContactExchange(false)}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
