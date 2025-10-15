// API Configuration for Frontend
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    CHAT: '/api/v1/chat/send_message',
    HEALTH: '/health',
    DOCUMENTS: '/api/v1/documents',
    DOCUMENTS_LIST: '/api/v1/documents/list',
    DOCUMENTS_UPLOAD: '/api/v1/documents/upload',
    DOCUMENTS_DELETE: '/api/v1/documents/delete'
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

