import { apiFetch, getAuthToken, removeAuthToken } from '../utils/api';

// Note: API base URL is now handled by apiFetch in utils/api.ts

// User interfaces
export interface User {
  id: number;
  role: string;
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface UserCounts {
  total_regular_users: number;
  active_regular_users: number;
  new_users_this_month: number;
  new_users_this_week: number;
}

export interface UsersResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: User[];
}

// Get user counts/statistics
export const getUserCounts = async (): Promise<UserCounts> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await apiFetch('/admin/users/count/');
    return response;
  } catch (error: any) {
    console.error('Error fetching user counts:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Get users list with pagination
export const getUsers = async (page: number = 1, pageSize: number = 20): Promise<UsersResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await apiFetch(`/admin/users/?page=${page}&page_size=${pageSize}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Search users
export const searchUsers = async (query: string, page: number = 1, pageSize: number = 20): Promise<UsersResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await apiFetch(`/admin/users/?search=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`);
    return response;
  } catch (error: any) {
    console.error('Error searching users:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Toggle user active status
export const toggleUserStatus = async (userId: number, isActive: boolean): Promise<User> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    // Use the correct suspend/activate endpoints instead of the generic PATCH
    if (isActive) {
      // Activate user
      const response = await apiFetch(`/admin/users/${userId}/activate/`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: 'Account reactivated',
          notify_user: true 
        }),
      });
      return response.user;
    } else {
      // Suspend user
      const response = await apiFetch(`/admin/users/${userId}/suspend/`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: 'Account suspended',
          duration_days: null,
          notify_user: true 
        }),
      });
      return response.user;
    }
  } catch (error: any) {
    console.error('Error updating user status:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};
