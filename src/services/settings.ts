import { apiFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

// Types for settings
export interface UpdatedBy {
  id: number;
  email: string;
}

export interface Setting {
  key: string;
  value: string;
  description: string;
  data_type: 'string' | 'integer' | 'decimal' | 'boolean' | 'json';
  is_active: boolean;
  updated_at: string;
  updated_by: UpdatedBy | number; // Can be object or just ID
}

export interface SettingsResponse {
  settings: Setting[];
}

export interface UpdateSettingRequest {
  value: string;
  description?: string;
}

export interface UpdateSettingResponse {
  key: string;
  value: string;
  description: string;
  data_type: string;
  is_active: boolean;
  updated_at: string;
  updated_by: number;
}

// Get all settings
export const getSettings = async (category?: string): Promise<SettingsResponse> => {
  const params = category ? new URLSearchParams({ category }) : undefined;
  const query = params ? `?${params.toString()}` : '';
  const response = await apiFetch(`${API_ENDPOINTS.SETTINGS}${query}`);
  return response;
};

// Get specific setting
export const getSetting = async (key: string): Promise<Setting> => {
  const response = await apiFetch(API_ENDPOINTS.SETTINGS_DETAIL(key));
  return response;
};

// Update setting
export const updateSetting = async (key: string, data: UpdateSettingRequest): Promise<UpdateSettingResponse> => {
  const response = await apiFetch(API_ENDPOINTS.SETTINGS_DETAIL(key), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response;
};

// Create new setting
export const createSetting = async (data: UpdateSettingRequest & { key: string; data_type: string }): Promise<UpdateSettingResponse> => {
  const response = await apiFetch(API_ENDPOINTS.SETTINGS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

// Deactivate setting
export const deactivateSetting = async (key: string): Promise<void> => {
  await apiFetch(API_ENDPOINTS.SETTINGS_DETAIL(key), {
    method: 'DELETE',
  });
};