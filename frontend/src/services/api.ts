import axios from 'axios';
import { AuthResponse, MatchRequest, MatchResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fusetalk_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  registerGuest: async (nickname: string, isVisitor: boolean): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/guest/', {
      nickname,
      is_visitor: isVisitor,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  },
};

// Matching API
export const matchingAPI = {
  joinQueue: async (matchRequest: MatchRequest): Promise<MatchResponse> => {
    const response = await api.post('/api/match/join/', matchRequest);
    return response.data;
  },

  leaveQueue: async () => {
    const response = await api.post('/api/match/leave/');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/match/stats/');
    return response.data;
  },
};

export default api;
