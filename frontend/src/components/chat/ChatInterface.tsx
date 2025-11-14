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
  const [messages, setMessages] = useState<Array<{ id: number; side: "them" | "me"; text: string; timestamp: string }>>([]);
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
    
    const wsUrl = `${WS_BASE_URL}/ws/chat/${sessionId}/?token=${token}`;
    chatWs.current = new WebSocket(wsUrl);
    
    chatWs.current.onopen = () => setIsConnected(true);
    chatWs.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          side: message.sender === user?.nickname ? "me" : "them",
          text: message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (chatWs.current) {
        chatWs.current.close();
      }
      
      onEndChat();
      nav("/connect?autoStart=true");
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      onEndChat();
      nav("/connect");
    }
  };

  const getConnectionStatus = () => {
    if (!videoConnected && !remoteStream) return "Connecting...";
    if (!videoConnected && remoteStream) return "Reconnecting..."; 
    if (videoConnected && remoteStream) return "Connected";
    return "Establishing connection...";
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 font-poppins">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className={`${isChatMinimized ? 'flex-1' : 'flex-1 lg:flex-[2]'} relative bg-gradient-to-br from-gray-900 to-slate-800 transition-all duration-300`}>
          {/* Video Content */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white relative overflow-hidden pb-32">
              {/* Background Animation */}
               <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-32 h-32 bg-rwanda-green rounded-full animate-float"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-rwanda-yellow rounded-full animate-float" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-tech-blue rounded-full animate-float" style={{animationDelay: '4s'}}></div>
              </div>

              {/* Waiting Content */}
              <div className="relative z-10 text-center">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-rwanda-green to-tech-blue flex items-center justify-center mb-8 mx-auto shadow-2xl animate-pulse-glow">
                  <svg className="w-12 h-12 lg:w-16 lg:h-16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 bg-gradient-to-r from-rwanda-green to-tech-blue bg-clip-text text-transparent">
                  Connecting with {matchedUser}...
                </h3>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-rwanda-green rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-rwanda-yellow rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                
                <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  Setting up your video connection. This usually takes just a few seconds...
                </p>

                {/* Connection Tips */}
                <div className="glass rounded-2xl p-6 max-w-md mx-auto border border-white/10">
                  <h4 className="font-semibold mb-4 text-rwanda-yellow">💡 While you wait:</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Check your camera and microphone
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Think of a great conversation starter
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Be respectful and have fun!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Local Video */}
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-6 right-6 w-32 h-24 lg:w-40 lg:h-30 bg-gray-800 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
            />
          )}

          {/* Connection Status */}
          <div className="absolute top-6 left-6">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium glass border border-white/20 ${
              videoConnected ? 'text-green-400' : 'text-yellow-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${videoConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-bounce'}`}></div>
              {videoConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-3 glass rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isVideoEnabled 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
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
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isAudioEnabled 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                }`}
                title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                  {isAudioEnabled ? (
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.899 8l-1.242-1.243a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
              </button>

              {/* Chat Toggle (Mobile) */}
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-r from-rwanda-green to-tech-blue text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg lg:hidden"
                title="Toggle chat"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Like Button */}
              <button 
                onClick={handleLikeSession}
                disabled={hasLiked}
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  hasLiked 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white cursor-not-allowed shadow-lg' 
                    : 'bg-white/20 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 text-white hover:shadow-lg'
                }`}
                title={hasLiked ? 'Already liked' : 'Like this conversation'}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Next Button */}
              <button 
                onClick={handleNextPerson}
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg"
                title="Next person"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* End Call */}
              <button
                onClick={onEndChat}
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                title="End call"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`${isChatMinimized ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 bg-white`}>
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rwanda-green/5 to-tech-blue/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rwanda-green to-tech-blue rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {matchedUser[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{matchedUser}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500">{isConnected ? 'Online' : 'Connecting...'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatMinimized(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full font-medium">💞 Love & Vibes</span>
              <span className="text-xs bg-gradient-to-r from-tech-blue to-blue-500 text-white px-3 py-1 rounded-full font-medium">🌍 Mixed</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👋</div>
                <h4 className="font-semibold text-gray-900 mb-2">You're connected!</h4>
                <p className="text-gray-500 text-sm">Say hi to {matchedUser} and start the conversation</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.side === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                    m.side === "me" 
                      ? "bg-gradient-to-r from-rwanda-green to-tech-blue text-white" 
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    <p className={`text-xs mt-1 ${m.side === "me" ? "text-white/70" : "text-gray-400"}`}>
                      {m.timestamp}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rwanda-green focus:border-transparent bg-gray-50 placeholder-gray-500"
                placeholder="Type your message..."
                disabled={!isConnected}
              />
              <button 
                onClick={send} 
                disabled={!text.trim() || !isConnected}
                className="px-6 py-3 bg-gradient-to-r from-rwanda-green to-tech-blue text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fuse Moment Modal */}
      {showFuseMoment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-white/20">
            {!showContactExchange ? (
              <div className="text-center">
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-4">
                  Fuse Moment!
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  You both liked this conversation! Want to stay connected with {matchedUser}?
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowContactExchange(true)}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    📱 Share Contact
                  </button>
                  <button
                    onClick={() => setShowFuseMoment(false)}
                    className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Share Your Contact Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+250 xxx xxx xxx"
                      value={contactInfo.whatsapp}
                      onChange={(e) => setContactInfo({...contactInfo, whatsapp: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Instagram</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={contactInfo.instagram}
                      onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Telegram</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={contactInfo.telegram}
                      onChange={(e) => setContactInfo({...contactInfo, telegram: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Personal Note</label>
                    <textarea
                      placeholder="Great chatting with you!"
                      value={contactInfo.note}
                      onChange={(e) => setContactInfo({...contactInfo, note: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent h-24 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleShareContact}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    Share & Connect ✨
                  </button>
                  <button
                    onClick={() => setShowContactExchange(false)}
                    className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
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
