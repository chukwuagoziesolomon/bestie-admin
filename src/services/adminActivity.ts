import { getAuthToken } from './auth';

export interface AdminActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  amount: number;
  timestamp: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  is_read?: boolean;
}

export interface ActivityResponse {
  activities: AdminActivity[];
  hasMore: boolean;
  total: number;
}

export interface WebhookActivityPayload {
  title: string;
  description: string;
  icon: string;
  color: string;
  amount: number;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bestie-server.onrender.com';

class AdminActivityService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async getRecentActivity(limit: number = 20): Promise<AdminActivity[]> {
    const response = await this.makeRequest(`/api/admin/recent-activity/?limit=${limit}`);
    const data = await response.json();
    return data.activities || data; // Handle both array and object responses
  }

  async postWebhookActivity(activity: WebhookActivityPayload): Promise<void> {
    await this.makeRequest('/api/webhook/activity/', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async markActivityAsRead(activityId: string): Promise<void> {
    await this.makeRequest(`/api/admin/activities/${activityId}/read/`, {
      method: 'POST',
    });
  }

  async markAllActivitiesAsRead(): Promise<void> {
    await this.makeRequest('/api/admin/activities/read-all/', {
      method: 'POST',
    });
  }
}

export const adminActivityService = new AdminActivityService();
