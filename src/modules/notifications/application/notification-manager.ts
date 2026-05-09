import { smsService, VehicleAlertData, WorkflowAlertData } from '@/lib/sms-service';
import type { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  UserNotificationPreferences,
  AdminPhoneConfig,
  NotificationRule
} from '../domain/notification.types';

export class NotificationManager {
  private static instance: NotificationManager;
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private adminConfig: AdminPhoneConfig | null = null;

  private constructor() {
    this.loadConfiguration();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async loadConfiguration() {
    // Load from database or config file
    // For now, we'll use a default configuration
    this.adminConfig = {
      dealershipId: 'default',
      adminPhones: [
        {
          userId: 'admin-1',
          name: 'Service Manager',
          phone: '+1234567890', // This would come from database
          role: 'service_manager',
          notifications: ['vehicle_overdue', 'sla_breach', 'critical_blocker', 'team_overload']
        },
        {
          userId: 'admin-2',
          name: 'General Manager',
          phone: '+1234567891', // This would come from database
          role: 'general_manager',
          notifications: ['sla_breach', 'critical_blocker', 'vehicle_ready']
        },
        {
          userId: 'admin-3',
          name: 'Parts Manager',
          phone: '+1234567892', // This would come from database
          role: 'parts_manager',
          notifications: ['parts_delay', 'vehicle_stage_change']
        }
      ],
      emergencyContacts: [
        {
          name: 'Emergency Contact',
          phone: '+1234567899',
          relation: 'Owner'
        }
      ]
    };
  }

  // Main notification dispatch method
  async dispatchNotification(
    type: NotificationType,
    data: VehicleAlertData | WorkflowAlertData | any,
    priority: NotificationPriority = 'normal'
  ): Promise<void> {
    const recipients = await this.getRecipientsForNotification(type, data);
    
    for (const recipient of recipients) {
      if (recipient.phone && this.shouldSendSMS(recipient, type, priority)) {
        await this.sendSMSNotification(type, data, recipient.phone, priority);
      }
    }
  }

  private async getRecipientsForNotification(
    type: NotificationType,
    data: any
  ): Promise<Array<{ userId: string; phone: string; name: string; role: string }>> {
    const recipients: Array<{ userId: string; phone: string; name: string; role: string }> = [];

    // Add admin recipients based on their notification preferences
    if (this.adminConfig) {
      for (const admin of this.adminConfig.adminPhones) {
        if (admin.notifications.includes(type)) {
          recipients.push({
            userId: admin.userId,
            phone: admin.phone,
            name: admin.name,
            role: admin.role
          });
        }
      }
    }

    // Add team-specific recipients
    if (data.assignedTeam) {
      const teamMembers = await this.getTeamMembers(data.assignedTeam);
      recipients.push(...teamMembers);
    }

    // Add user-specific recipients
    if (data.assignedTo) {
      const user = await this.getUserById(data.assignedTo);
      if (user && user.phone) {
        recipients.push({
          userId: user.userId,
          phone: user.phone,
          name: user.name,
          role: user.role
        });
      }
    }

    return recipients;
  }

  private shouldSendSMS(
    recipient: any,
    type: NotificationType,
    priority: NotificationPriority
  ): boolean {
    // Check quiet hours
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const preferences = this.userPreferences.get(recipient.userId);
    if (preferences?.quietHours?.enabled) {
      const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
      const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (currentTime >= startTime && currentTime <= endTime && priority !== 'urgent') {
        return false; // Don't send during quiet hours unless urgent
      }
    }

    // Check if user has this notification type enabled for SMS
    if (preferences?.alertTypes[type]) {
      const alertConfig = preferences.alertTypes[type];
      return alertConfig.enabled && alertConfig.channels.includes('sms');
    }

    // Default to true for urgent notifications
    return priority === 'urgent';
  }

  private async sendSMSNotification(
    type: NotificationType,
    data: any,
    phoneNumber: string,
    priority: NotificationPriority
  ): Promise<void> {
    try {
      let result;

      switch (type) {
        case 'vehicle_stage_change':
          result = await smsService.sendVehicleStageAlert(data, phoneNumber);
          break;
        case 'vehicle_overdue':
          result = await smsService.sendVehicleOverdueAlert(data, phoneNumber);
          break;
        case 'sla_breach':
          result = await smsService.sendSLABreachAlert(data.stage, data.vehicleCount, phoneNumber);
          break;
        case 'critical_blocker':
          result = await smsService.sendVehicleStageAlert(data, phoneNumber);
          break;
        case 'workflow_assignment':
          result = await smsService.sendWorkflowAssignmentAlert(data, phoneNumber);
          break;
        case 'vehicle_ready':
          result = await smsService.sendVehicleReady(data, phoneNumber);
          break;
        case 'parts_delay':
          result = await smsService.sendPartsDelay(data, data.estimatedDelay, [phoneNumber]);
          break;
        case 'intake_confirmation':
          result = await smsService.sendIntakeConfirmation(data, phoneNumber);
          break;
        default:
          console.warn(`Unknown notification type: ${type}`);
          return;
      }

      if (!result.success) {
        const errorDetail = 'error' in result ? result.error : (result as any).errors?.join(', ');
        console.error(`SMS failed for ${type}:`, errorDetail);
      }
    } catch (error) {
      console.error(`Error sending SMS notification for ${type}:`, error);
    }
  }

  // Configuration management methods
  async updateAdminPhoneConfig(config: AdminPhoneConfig): Promise<void> {
    this.adminConfig = config;
    // Save to database
    await this.saveAdminConfigToDatabase(config);
  }

  async updateUserPreferences(userId: string, preferences: UserNotificationPreferences): Promise<void> {
    this.userPreferences.set(userId, preferences);
    // Save to database
    await this.saveUserPreferencesToDatabase(userId, preferences);
  }

  async addAdminPhone(admin: {
    userId: string;
    name: string;
    phone: string;
    role: "general_manager" | "service_manager" | "parts_manager" | "detail_manager" | "recon_manager";
    notifications: NotificationType[];
  }): Promise<void> {
    if (this.adminConfig) {
      this.adminConfig.adminPhones.push(admin);
      await this.saveAdminConfigToDatabase(this.adminConfig);
    }
  }

  async removeAdminPhone(userId: string): Promise<void> {
    if (this.adminConfig) {
      this.adminConfig.adminPhones = this.adminConfig.adminPhones.filter(
        admin => admin.userId !== userId
      );
      await this.saveAdminConfigToDatabase(this.adminConfig);
    }
  }

  async testSMSConfiguration(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    return smsService.sendTestSMS(phoneNumber);
  }

  // Helper methods (these would connect to your actual database)
  private async getTeamMembers(teamName: string): Promise<Array<{ userId: string; phone: string; name: string; role: string }>> {
    // Implement team member lookup from database
    return [];
  }

  private async getUserById(userId: string): Promise<{ userId: string; phone: string; name: string; role: string } | null> {
    // Implement user lookup from database
    return null;
  }

  private async saveAdminConfigToDatabase(config: AdminPhoneConfig): Promise<void> {
    // Implement database save
    console.log('Saving admin config to database:', config);
  }

  private async saveUserPreferencesToDatabase(userId: string, preferences: UserNotificationPreferences): Promise<void> {
    // Implement database save
    console.log(`Saving user preferences for ${userId}:`, preferences);
  }

  // Get current configuration
  getAdminConfig(): AdminPhoneConfig | null {
    return this.adminConfig;
  }

  getUserPreferences(userId: string): UserNotificationPreferences | undefined {
    return this.userPreferences.get(userId);
  }

  // Get all admin phone numbers for emergency situations
  getEmergencyPhoneNumbers(): string[] {
    const phones: string[] = [];
    
    if (this.adminConfig) {
      phones.push(...this.adminConfig.adminPhones.map(admin => admin.phone));
      phones.push(...this.adminConfig.emergencyContacts.map(contact => contact.phone));
    }
    
    return phones;
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
