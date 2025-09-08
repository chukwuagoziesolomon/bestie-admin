// Store token in memory
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  // Optionally store in localStorage for persistence
  localStorage.setItem('access-token', token);
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    // Try to get from localStorage if not in memory
    authToken = localStorage.getItem('access-token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('access-token');
};
