/**
 * API Configuration and utilities
 */

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  ENDPOINTS: {
    // Chat endpoints
    CHAT: '/api/chat',
    
    // Document endpoints
    DOCUMENTS_LIST: '/api/documents',
    DOCUMENTS_UPLOAD: '/api/documents/upload',
    DOCUMENTS_DELETE: '/api/documents',
    DOCUMENTS_PREVIEW: '/api/documents/preview',
    
    // Collections endpoints
    COLLECTIONS_LIST: '/api/collections',
    COLLECTIONS_CREATE: '/api/collections',
    COLLECTIONS_UPDATE: '/api/collections',
    COLLECTIONS_DELETE: '/api/collections',
    COLLECTIONS_GET: '/api/collections',
    
    // Shopify endpoints (mocked)
    SHOPIFY_ORDERS: '/api/shopify/orders',
    SHOPIFY_PRODUCTS: '/api/shopify/products',
    SHOPIFY_REPORTS: '/api/shopify/reports',
    SHOPIFY_SYNC: '/api/shopify/sync',
  }
};

export interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  params?: Record<string, string>;
}

/**
 * Generic API call function
 */
export const apiCall = async (
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<any> => {
  const {
    method = 'GET',
    headers = {},
    body,
    params
  } = options;

  // Build URL with query parameters
  let url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  // Set default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Don't set Content-Type for FormData
  if (body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body instanceof FormData ? body : body || undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

