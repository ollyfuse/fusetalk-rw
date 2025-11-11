import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { chatAPI } from '../../services/api';


interface ChatInterfaceProps {
  sessionId: string;
  matchedUser: string;
  onEndChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionId, 
  matchedUser, 
  onEndChat 
}) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hasManuallyHiddenVideo = useRef(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showFuseMoment, setShowFuseMoment] = useState(false);
  const [fuseMomentData, setFuseMomentData] = useState<any>(null);

  
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

  // DEBUG: Video stream assignment with detailed logging
useEffect(() => {
  console.log('🎥 LOCAL VIDEO REF CHECK:', {
    videoElement: !!localVideoRef.current,
    localStream: !!localStream
  });
  
  if (localVideoRef.current && localStream) {
    console.log('🎥 ASSIGNING LOCAL STREAM TO VIDEO ELEMENT');
    localVideoRef.current.srcObject = localStream;
    
    // Force play
    localVideoRef.current.play().then(() => {
      console.log('✅ Local video playing');
    }).catch(e => {
      console.error('❌ Local video play failed:', e);
    });
  }
}, [localStream, showVideo]);

  useEffect(() => {
    console.log('📺 REMOTE STREAM EFFECT:', {
      stream: remoteStream?.id,
      active: remoteStream?.active,
      videoElement: !!remoteVideoRef.current,
      tracks: remoteStream?.getTracks().length
    });
    
    if (remoteVideoRef.current && remoteStream) {
      console.log('📺 ASSIGNING REMOTE STREAM TO VIDEO ELEMENT');
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play
      remoteVideoRef.current.play().then(() => {
        console.log('✅ Remote video playing');
      }).catch(e => {
        console.error('❌ Remote video play failed:', e);
      });
    }
  }, [remoteStream, showVideo]);

 useEffect(() => {
  if (remoteStream && !showVideo && !hasManuallyHiddenVideo.current) {
    console.log('📺 AUTO-SHOWING VIDEO (remote stream received)');
    setShowVideo(true);
  }
}, [remoteStream]);

useEffect(() => {
  const timer = setTimeout(() => {
    if (!hasManuallyHiddenVideo.current) {
      console.log('📹 AUTO-SHOWING VIDEO (random video chat)');
      setShowVideo(true);
    }
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);


  // Chat WebSocket (simplified)
  useEffect(() => {
    if (!token) return;
    
    const wsUrl = `ws://localhost:8000/ws/chat/${sessionId}/?token=${token}`;
    chatWs.current = new WebSocket(wsUrl);
    
    chatWs.current.onopen = () => setIsConnected(true);
    chatWs.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp,
          isOwn: message.sender === user?.nickname
        }]);
      }
    };
    chatWs.current.onclose = () => setIsConnected(false);
    
    return () => chatWs.current?.close();
  }, [sessionId, token, user?.nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    
    chatWs.current?.send(JSON.stringify({
      type: 'chat_message',
      content: newMessage,
      sender: user?.nickname,
      timestamp: new Date().toISOString()
    }));
    
    setNewMessage('');
  };

 const handleStartVideo = () => {
  console.log('🚀 USER CLICKED START VIDEO');
  hasManuallyHiddenVideo.current = false; // Reset the manual hide flag
  setShowVideo(true);
  startCall();
};
const handleLikeSession = async () => {
  if (hasLiked) return;
  
  try {
    console.log('❤️ Liking session:', sessionId);
    const response = await chatAPI.likeSession(sessionId);
    
    setHasLiked(true);
    
    if (response.fuse_moment) {
      console.log('🎉 FUSE MOMENT CREATED!');
      setFuseMomentData(response);
      setShowFuseMoment(true);
    } else {
      console.log('💝 Session liked, waiting for mutual like');
    }
  } catch (error) {
    console.error('❌ Error liking session:', error);
  }
};
const [showContactExchange, setShowContactExchange] = useState(false);
const [contactInfo, setContactInfo] = useState({
  whatsapp: '',
  instagram: '',
  telegram: '',
  note: ''
});

const handleShareContact = async () => {
  try {
    if (fuseMomentData?.fuse_moment_id) {
      await chatAPI.shareContact(fuseMomentData.fuse_moment_id, contactInfo);
      console.log('📞 Contact shared successfully!');
    }
    setShowContactExchange(false);
    setShowFuseMoment(false);
  } catch (error) {
    console.error('❌ Error sharing contact:', error);
  }
};


  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Video Section */}
      {showVideo && (
        <div className="flex-1 bg-black relative">
          {/* DEBUG INFO OVERLAY */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 text-xs z-10">
            <div>Local: {localStream ? '✅' : '❌'} {localStream?.id}</div>
            <div>Remote: {remoteStream ? '✅' : '❌'} {remoteStream?.id}</div>
            <div>Connected: {videoConnected ? '✅' : '❌'}</div>
            <div>Video: {isVideoEnabled ? '✅' : '❌'}</div>
            <div>Audio: {isAudioEnabled ? '✅' : '❌'}</div>
          </div>

          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('📺 Remote video metadata loaded')}
            onCanPlay={() => console.log('📺 Remote video can play')}
            onPlay={() => console.log('▶️ Remote video started playing')}
            onError={(e) => console.error('❌ Remote video error:', e)}
            onLoadStart={() => console.log('📺 Remote video load start')}
            onWaiting={() => console.log('⏳ Remote video waiting')}
            onPlaying={() => console.log('▶️ Remote video playing')}
            // style={{ 
            //   backgroundColor: 'red',
            //   minHeight: '100%',
            //   minWidth: '100%'
            // }}
          />
          
          {/* Local Video */}
<video
  ref={localVideoRef}
  autoPlay
  playsInline
  muted
  className="absolute top-16 right-4 w-32 h-24 bg-gray-800 rounded-lg object-cover border-2 border-white"
  style={{ 
    backgroundColor: 'darkgray', // Fallback color
    minWidth: '128px',
    minHeight: '96px'
  }}
  onLoadedMetadata={() => console.log('🎥 Local video metadata loaded')}
  onCanPlay={() => console.log('🎥 Local video can play')}
  onPlay={() => console.log('▶️ Local video started playing')}
  onError={(e) => console.error('❌ Local video error:', e)}
/>

          
          {/* Controls */}
<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
  <div className="flex items-center gap-3 bg-black bg-opacity-60 backdrop-blur-sm rounded-full px-6 py-3">
    {/* Video Toggle */}
    <button
      onClick={toggleVideo}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        isVideoEnabled 
          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
          : 'bg-red-500 hover:bg-red-600 text-white'
      }`}
      title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        {isVideoEnabled ? (
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        ) : (
          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v4c0 .368-.097.714-.268 1.014l-3.064-3.064C10.747 9.972 11 9.501 11 8.972V6a2 2 0 00-2-2H4.414l-1.121-1.121A1 1 0 003.707 2.293zM2 6c0-.364.097-.706.268-.994L8.586 11.414C8.219 11.597 7.623 12 7 12H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
        )}
      </svg>
      {!isVideoEnabled && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
      )}
    </button>

    {/* Audio Toggle */}
    <button
      onClick={toggleAudio}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        isAudioEnabled 
          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
          : 'bg-red-500 hover:bg-red-600 text-white'
      }`}
      title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        {isAudioEnabled ? (
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.899 8l-1.242-1.243a1 1 0 010-1.414z" clipRule="evenodd" />
        )}
      </svg>
      {!isAudioEnabled && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
      )}
    </button>

    {/* Connection Status Indicator */}
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 bg-opacity-50 rounded-full">
      <div className={`w-2 h-2 rounded-full ${videoConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      <span className="text-white text-xs font-medium">
        {videoConnected ? 'Connected' : 'Connecting...'}
      </span>
    </div>

    {/* Chat Toggle */}
    <button
  onClick={() => {
    console.log('💬 Chat button clicked - hiding video');
    hasManuallyHiddenVideo.current = true;
    setShowVideo(false);
  }}
  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-200"
  title="Switch to chat"
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
  </svg>
</button>

{/* Like Button - NEW */}
<button
  onClick={handleLikeSession}
  disabled={hasLiked}
  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
    hasLiked 
      ? 'bg-pink-600 text-white cursor-not-allowed' 
      : 'bg-pink-500 hover:bg-pink-600 text-white'
  }`}
  title={hasLiked ? 'Already liked' : 'Like this conversation'}
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
  {hasLiked && <span className="absolute -top-1 -right-1 text-xs">✓</span>}
</button>

    {/* End Call */}
    <button
      onClick={onEndChat}
      className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200"
      title="End call"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
    </button>
  </div>
</div>

        </div>
      )}

      {/* Chat Section */}
      <div className={`${showVideo ? 'w-80' : 'flex-1'} bg-gray-50 flex flex-col`}>
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {matchedUser[0]?.toUpperCase()}
            </div>
            <span className="font-medium">{matchedUser}</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          
          <div className="flex gap-2">
            {!showVideo && (
              <button
                onClick={handleStartVideo}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                📹 Video
              </button>
            )}
            <button
              onClick={onEndChat}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-2xl mb-2">💬</div>
              <p>Start chatting with {matchedUser}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.isOwn ? 'bg-blue-500 text-white' : 'bg-white border'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fuse Moment Celebration Modal */}
{showFuseMoment && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-lg mx-4">
      {!showContactExchange ? (
        // Initial celebration screen
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Fuse Moment!</h2>
          <p className="text-gray-600 mb-6">
            You both liked this conversation! Want to stay connected with {matchedUser}?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowContactExchange(true)}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              📱 Share Contact
            </button>
            <button
              onClick={() => setShowFuseMoment(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Maybe Later
            </button>
          </div>
        </div>
      ) : (
        // Contact exchange form
        <div>
          <h3 className="text-xl font-bold mb-4">Share Your Contact Info</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                type="text"
                placeholder="+250 xxx xxx xxx"
                value={contactInfo.whatsapp}
                onChange={(e) => setContactInfo({...contactInfo, whatsapp: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                type="text"
                placeholder="@username"
                value={contactInfo.instagram}
                onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telegram</label>
              <input
                type="text"
                placeholder="@username"
                value={contactInfo.telegram}
                onChange={(e) => setContactInfo({...contactInfo, telegram: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personal Note</label>
              <textarea
                placeholder="Great chatting with you!"
                value={contactInfo.note}
                onChange={(e) => setContactInfo({...contactInfo, note: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 h-20"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleShareContact}
              className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Share & Connect ✨
            </button>
            <button
              onClick={() => setShowContactExchange(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
