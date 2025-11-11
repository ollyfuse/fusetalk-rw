import { useRef, useState, useEffect } from 'react';

export const useWebRTC = (sessionId: string, token: string, userId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalingWs = useRef<WebSocket | null>(null);
  const isInitialized = useRef(false);
  const isPolite = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    isPolite.current = userId.localeCompare(sessionId) < 0;
    
    console.log('🚀 INITIALIZING WebRTC');
    console.log('📋 SessionID:', sessionId);
    console.log('👤 UserID:', userId);
    console.log('🤝 Is Polite:', isPolite.current);
    console.log('🔍 Comparison result:', userId.localeCompare(sessionId));

    initializeWebRTC();
    
    return () => {
      cleanup();
      isInitialized.current = false;
    };
  }, [sessionId, token, userId]);

  const initializeWebRTC = async () => {
    try {
      console.log('📹 Getting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      console.log('🔗 Creating peer connection...');
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log('🎬 Remote stream received!');
        setRemoteStream(event.streams[0]);
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current?.connectionState;
        console.log('🔗 Connection state:', state);
        setIsConnected(state === 'connected');
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };

      console.log('⏳ Waiting for session to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      await connectSignaling();
      
      if (!isPolite.current) {
        setTimeout(() => {
          console.log('🚀 Creating initial offer (impolite peer)');
          createOffer();
        }, 1000);
      } else {
        console.log('⏳ Waiting for offer (polite peer)');
      }

    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
    }
  };

  const connectSignaling = () => {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = `ws://localhost:8000/ws/signaling/${sessionId}/?token=${token}`;
      console.log('🔗 Connecting to:', wsUrl);
      
      signalingWs.current = new WebSocket(wsUrl);

      signalingWs.current.onopen = () => {
        console.log('✅ Signaling connected');
        resolve();
      };

      signalingWs.current.onerror = (error) => {
        console.error('❌ Signaling WebSocket error:', error);
        reject(error);
      };

      signalingWs.current.onclose = (event) => {
        console.log('🔌 Signaling WebSocket closed:', event.code, event.reason);
        if (event.code === 4003) {
          console.error('❌ Access denied to session - session may not exist yet');
        }
      };

      signalingWs.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Received:', message.type);
        handleSignalingMessage(message);
      };

      setTimeout(() => {
        if (signalingWs.current?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  };

  const handleSignalingMessage = async (message: any) => {
    if (!peerConnection.current) return;

    const pc = peerConnection.current;

    try {
      switch (message.type) {
        case 'offer':
          const offerCollision = pc.signalingState !== 'stable';
          
          if (offerCollision && !isPolite.current) {
            console.log('🚫 Ignoring offer (impolite, collision)');
            return;
          }
          
          console.log('📋 Processing offer');
          await pc.setRemoteDescription(message.offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignalingMessage({ type: 'answer', answer });
          break;

        case 'answer':
          if (pc.signalingState === 'have-local-offer') {
            console.log('📋 Processing answer');
            await pc.setRemoteDescription(message.answer);
          } else {
            console.log('⚠️ Ignoring answer - wrong state');
          }
          break;

        case 'ice-candidate':
          if (pc.remoteDescription) {
            await pc.addIceCandidate(message.candidate);
            console.log('✅ ICE candidate added');
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling signaling:', error);
    }
  };

  const createOffer = async () => {
    if (!peerConnection.current) return;
    
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendSignalingMessage({ type: 'offer', offer });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const sendSignalingMessage = (message: any) => {
    if (signalingWs.current?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending:', message.type);
      signalingWs.current.send(JSON.stringify(message));
    }
  };

  // FIXED: Proper toggle functions
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('📹 Video toggled:', videoTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('🎤 Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnection.current?.close();
    signalingWs.current?.close();
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    startCall: () => console.log('Manual start call'),
    toggleVideo,
    toggleAudio
  };
};
