import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WebSocketMessage } from '../types';

// const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://172.20.10.5:8000';

export const useWebSocket = (onMessage?: (message: WebSocketMessage) => void) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!token || !user) return;

    try {
      // Connect to matching WebSocket
      const wsUrl = `${WS_BASE_URL}/ws/matching/?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        
        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);

        ws.onclose = () => {
          clearInterval(heartbeat);
        };
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message:', message);
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (event.code !== 1000) { // Not a normal closure
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection failed');
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to connect');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (token && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, user]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    connect,
    disconnect,
  };
};
