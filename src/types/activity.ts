export type ActivityType = 
  | 'activity_created' 
  | 'activity_updated' 
  | 'activity_deleted'
  | 'activity_login'
  | 'activity_approve'
  | 'activity_reject';

export interface ActivityData {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_role: string;
  action: string;
  model: string;
  object_id: string;
  object_repr: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_read?: boolean;
}

export interface ActivityMessage {
  type: ActivityType;
  data: ActivityData;
  timestamp?: string;
}

export type ActivityStatus = 'pending' | 'in_progress' | 'completed';

export interface ActivityChange {
  field: string;
  old_value: any;
  new_value: any;
}

export interface ActivityFilters {
  user_id?: string;
  action?: string;
  model?: string;
  object_id?: string;
  start_date?: string;
  end_date?: string;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}
