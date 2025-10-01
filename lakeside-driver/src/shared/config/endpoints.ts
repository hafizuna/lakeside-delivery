import { Platform } from 'react-native';

// Configuration for API and Socket endpoints
const ENDPOINTS_CONFIG = {
  // Update this IP address to match your development machine's network IP
  // For localhost/web development, it will use localhost
  LOCAL_IP: '192.168.1.5',
  PORT: '3001',
};

// Get API Base URL
export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${ENDPOINTS_CONFIG.PORT}/api`;
  } else {
    // For mobile devices, use your computer's IP address
    return `http://${ENDPOINTS_CONFIG.LOCAL_IP}:${ENDPOINTS_CONFIG.PORT}/api`;
  }
};

// Get Socket Base URL
export const getSocketBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${ENDPOINTS_CONFIG.PORT}`;
  } else {
    // For mobile devices, use your computer's IP address
    return `http://${ENDPOINTS_CONFIG.LOCAL_IP}:${ENDPOINTS_CONFIG.PORT}`;
  }
};

// Get WebSocket URL (for debugging info)
export const getWebSocketUrl = (): string => {
  if (Platform.OS === 'web') {
    return `ws://localhost:${ENDPOINTS_CONFIG.PORT}`;
  } else {
    return `ws://${ENDPOINTS_CONFIG.LOCAL_IP}:${ENDPOINTS_CONFIG.PORT}`;
  }
};

// Export configuration for advanced usage
export const ENDPOINTS = {
  ...ENDPOINTS_CONFIG,
  API_BASE_URL: getApiBaseUrl(),
  SOCKET_BASE_URL: getSocketBaseUrl(),
  WEBSOCKET_URL: getWebSocketUrl(),
} as const;

export default ENDPOINTS;