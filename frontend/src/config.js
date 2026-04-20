const isProd = import.meta.env.PROD;

// In production, we use relative paths for the API as Vercel routes them
// In development, we use the local backend URL
export const API_BASE_URL = isProd 
  ? "/api" 
  : (import.meta.env.VITE_API_URL || "http://localhost:8000/api");

export const WS_BASE_URL = isProd
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : (import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws");
