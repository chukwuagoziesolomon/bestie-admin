import { API_PREFIXED_BASE, CLEAN_API_BASE_URL, logApiConfig } from '../config/api';

// Log API configuration on import
logApiConfig();

// Helper function to get CSRF token from cookies
const getCSRFToken = (): string | null => {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
};

// Create a custom fetch function that includes auth headers
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Ensure we don't have double slashes
  const baseUrl = API_PREFIXED_BASE.endsWith('/') 
    ? API_PREFIXED_BASE.slice(0, -1) 
    : API_PREFIXED_BASE;
    
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  // Get the auth token
  const token = getAuthToken();
  
  // Set up default headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-CSRFToken': getCSRFToken() || '',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  console.log(`Making request to: ${fullUrl}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Input URL: ${url}`);
  if (token) {
    console.log('Using auth token:', token.substring(0, 10) + '...');
  }

  try {
    // Ensure we're not overriding important headers
    const requestHeaders = new Headers(headers);
    if (options.headers) {
      const incomingHeaders = new Headers(options.headers);
      incomingHeaders.forEach((value, key) => {
        requestHeaders.set(key, value);
      });
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers: requestHeaders,
      credentials: 'include',
    });

    // If we get a 403 with CSRF error, try to get a new CSRF token and retry
    if (response.status === 403) {
      // Clone the response before reading it
      const responseClone = response.clone();
      let errorData;
      
      try {
        errorData = await responseClone.json();
      } catch (e) {
        // If we can't parse JSON, it's not a CSRF error we can handle
        throw new Error('Request failed with status 403');
      }
      
      if (errorData.detail?.includes('CSRF')) {
        // Try to get a new CSRF token by making a GET request to the root
        await fetch(API_PREFIXED_BASE, { 
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        // Update the CSRF token in headers
        requestHeaders.set('X-CSRFToken', getCSRFToken() || '');
        
        // Create new headers object to avoid any potential reference issues
        const newHeaders = new Headers(requestHeaders);
        
        // Retry the original request with new headers
        const retryOptions = {
          ...options,
          headers: newHeaders,
          credentials: 'include' as const
        };
        
        return fetch(fullUrl, retryOptions);
      }
    }

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorData: any = {};
      
      try {
        // Try to parse the error response as JSON
        const responseClone = response.clone();
        errorData = await responseClone.json().catch(() => ({}));
        
        // Handle specific error cases
        if (response.status === 401) {
          // Try to refresh the token first
          const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refresh-token');
          
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${API_PREFIXED_BASE}/token/refresh/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
                credentials: 'include',
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.access) {
                  // Store new access token
                  setAuthToken(refreshData.access);
                  localStorage.setItem('access_token', refreshData.access);
                  
                  // Retry the original request with new token
                  requestHeaders.set('Authorization', `Bearer ${refreshData.access}`);
                  const retryResponse = await fetch(fullUrl, {
                    ...options,
                    headers: requestHeaders,
                    credentials: 'include',
                  });
                  
                  // Return the retry response
                  if (retryResponse.ok) {
                    const contentType = retryResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                      return retryResponse;
                    }
                    return retryResponse.json();
                  }
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          
          // If refresh failed or no refresh token, clear auth and redirect to login
          removeAuthToken();
          localStorage.removeItem('user');
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('refresh-token');
          window.location.href = '/login';
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (errorData.code === 'token_not_valid' || errorData.detail?.includes('token not valid')) {
          // Try to refresh the token first
          const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refresh-token');
          
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${API_PREFIXED_BASE}/token/refresh/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
                credentials: 'include',
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.access) {
                  // Store new access token
                  setAuthToken(refreshData.access);
                  localStorage.setItem('access_token', refreshData.access);
                  
                  // Retry the original request with new token
                  requestHeaders.set('Authorization', `Bearer ${refreshData.access}`);
                  const retryResponse = await fetch(fullUrl, {
                    ...options,
                    headers: requestHeaders,
                    credentials: 'include',
                  });
                  
                  // Return the retry response
                  if (retryResponse.ok) {
                    const contentType = retryResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                      return retryResponse;
                    }
                    return retryResponse.json();
                  }
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          
          // Handle JWT token expiration specifically
          removeAuthToken();
          localStorage.removeItem('user');
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('refresh-token');
          window.location.href = '/login';
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
        // If we can't parse JSON, try to get the response as text
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          console.error('Error reading response text:', textError);
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      // Log the error for debugging
      console.error(`API Error (${response.status}):`, {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response;
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Interfaces for API responses
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('access-token', token);};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access-token');};

export const removeAuthToken = () => {
  localStorage.removeItem('access-token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('isAdmin');
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!(token && !isTokenExpired(token));
};

export const getCurrentUser = (): User | null => {
  const userData = sessionStorage.getItem('user');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// API calls
// Use centralized configuration
const getBaseUrl = () => {
  console.log('getBaseUrl() called, returning:', CLEAN_API_BASE_URL);
  return CLEAN_API_BASE_URL;
};

// Refresh the access token using the refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_PREFIXED_BASE}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    if (data.access) {
      setAuthToken(data.access);
      return data.access;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const loginUrl = `${baseUrl}/api/user/admin/login/`;
    
    console.log('=== LOGIN DEBUG ===');
    console.log('Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('Base URL from getBaseUrl():', baseUrl);
    console.log('Full login URL:', loginUrl);
    console.log('==================');
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken() || '',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Error parsing login response:', e);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Login failed');
    }

    // Store the access token in local storage
    if (data.access) {
      setAuthToken(data.access);
      
      // Store refresh token in httpOnly cookie (handled by the server)
      // The refresh token is automatically sent with requests due to credentials: 'include'
      
      // Store user data in session storage
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call the logout endpoint to invalidate tokens
    await apiFetch('/auth/logout/', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all auth-related data
    removeAuthToken();
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  }
};
