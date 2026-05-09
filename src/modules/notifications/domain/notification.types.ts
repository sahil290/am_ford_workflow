export type NotificationType = 
  | 'vehicle_stage_change'
  | 'vehicle_overdue'
  | 'sla_breach'
  | 'team_overload'
  | 'critical_blocker'
  | 'parts_delay'
  | 'vehicle_ready'
  | 'workflow_assignment'
  | 'intake_confirmation';

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'all';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface UserNotificationPreferences {
  userId: string;
  phone?: string;
  email?: string;
  enabledChannels: NotificationChannel[];
  alertTypes: {
    [key in NotificationType]: {
      enabled: boolean;
      priority: NotificationPriority;
      channels: NotificationChannel[];
    };
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
  teamAlertsOnly: boolean; // Only receive alerts for assigned team
}

export interface AdminPhoneConfig {
  dealershipId: string;
  adminPhones: {
    userId: string;
    name: string;
    phone: string;
    role: 'general_manager' | 'service_manager' | 'parts_manager' | 'detail_manager' | 'recon_manager';
    notifications: NotificationType[];
  }[];
  emergencyContacts: {
    name: string;
    phone: string;
    relation: string;
  }[];
}

export interface SMSNotification {
  id: string;
  userId: string;
  type: NotificationType;
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  priority: NotificationPriority;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRule {
  id: string;
  type: NotificationType;
  conditions: {
    vehicleCount?: number;
    overdueHours?: number;
    utilizationPercentage?: number;
    blockerCount?: number;
  };
  recipients: {
    roles: string[];
    teams: string[];
    specificUsers: string[];
  };
  channels: NotificationChannel[];
  template: string;
  enabled: boolean;
}
