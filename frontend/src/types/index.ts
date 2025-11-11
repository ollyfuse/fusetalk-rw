// User types
export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  verified: boolean;
  phone_verified: boolean;
  avatar_url: string | null;
  country: string | null;
  language_prefs: string;
  created_at: string;
}

// Authentication types
export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Matching types
export interface MatchRequest {
  vibe_tag: string;
  language: string;
  is_visitor: boolean;
}

export interface MatchResponse {
  status: 'queued' | 'matched';
  session_id: string | null;
  matched_user?: string;
  queue_position?: number;
  message: string;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
