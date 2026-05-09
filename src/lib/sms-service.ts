export interface SMSAlert {
  to: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'update';
}

export interface VehicleAlertData {
  vin: string;
  make: string;
  model: string;
  stage: string;
  blockers?: number;
  overdueHours?: number;
  assignedTeam?: string;
  year?: string;
}

export interface WorkflowAlertData {
  jobId: string;
  vehicleId: string;
  action: string;
  timestamp: Date;
  assignedTo?: string;
}

class SMSService {
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  private isConfigured(): boolean {
    return this.fromNumber !== '';
  }

  async sendSMS(alert: SMSAlert): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: alert.to,
          message: alert.message,
          type: alert.type
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`SMS sent successfully. SID: ${result.sid}`);
        return { success: true };
      } else {
        console.error('SMS sending failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Unknown error' 
        };
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Vehicle-related SMS templates
  async sendVehicleStageAlert(data: VehicleAlertData, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const message = this.formatVehicleStageMessage(data);
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      type: data.blockers ? 'urgent' : 'update'
    });
  }

  async sendVehicleOverdueAlert(data: VehicleAlertData, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const message = this.formatVehicleOverdueMessage(data);
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'urgent'
    });
  }

  async sendWorkflowAssignmentAlert(data: WorkflowAlertData, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const message = this.formatWorkflowAssignmentMessage(data);
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'info'
    });
  }

  async sendSLABreachAlert(stage: string, vehicleCount: number, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const message = `🚨 RECONVISION ALERT: SLA breach in ${stage}. ${vehicleCount} vehicles affected. Immediate attention required.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'urgent'
    });
  }

  async sendIntakeConfirmation(vehicleData: VehicleAlertData, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const message = `✅ RECONVISION: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} (VIN: ${vehicleData.vin}) has been added to the reconditioning workflow.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'info'
    });
  }

  async sendVehicleReady(vehicleData: VehicleAlertData, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    return this.sendSMS({
      to: phoneNumber,
      message: `🎉 RECONVISION: ${vehicleData.make} ${vehicleData.model} (${vehicleData.vin}) is ready for sale! All reconditioning complete.`,
      type: 'info'
    });
  }

  async sendPartsDelay(vehicleData: VehicleAlertData, estimatedDelay: string, phoneNumbers: string[]): Promise<{ success: boolean; failed: string[]; errors: string[] }> {
    const alerts = phoneNumbers.map(phone => ({
      to: phone,
      message: `⏱️ PARTS DELAY: ${vehicleData.make} ${vehicleData.model} (${vehicleData.vin}) parts delayed by ${estimatedDelay}. Adjusting timeline accordingly.`,
      type: 'warning' as const
    }));
    
    return this.sendBatchSMS(alerts);
  }

  // Message formatting methods
  private formatVehicleStageMessage(data: VehicleAlertData): string {
    let message = `🚗 RECONVISION Update: ${data.make} ${data.model} (${data.vin}) is now in ${data.stage}.`;
    
    if (data.blockers && data.blockers > 0) {
      message += ` ⚠️ ${data.blockers} blockers detected.`;
    }
    
    if (data.assignedTeam) {
      message += ` Assigned to: ${data.assignedTeam}.`;
    }
    
    return message;
  }

  private formatVehicleOverdueMessage(data: VehicleAlertData): string {
    const overdueHours = data.overdueHours || 0;
    return `⏰ RECONVISION ALERT: ${data.make} ${data.model} (${data.vin}) is ${overdueHours}h overdue in ${data.stage}. Action required.`;
  }

  private formatWorkflowAssignmentMessage(data: WorkflowAlertData): string {
    let message = `📋 RECONVISION: New assignment - ${data.action}`;
    
    if (data.assignedTo) {
      message += ` assigned to ${data.assignedTo}`;
    }
    
    message += `. Job ID: ${data.jobId}`;
    
    return message;
  }

  // Batch SMS sending for multiple recipients
  async sendBatchSMS(alerts: SMSAlert[]): Promise<{ success: boolean; failed: string[]; errors: string[] }> {
    const results = { success: true, failed: [] as string[], errors: [] as string[] };
    
    for (const alert of alerts) {
      const result = await this.sendSMS(alert);
      if (!result.success) {
        results.success = false;
        results.failed.push(alert.to);
        results.errors.push(result.error || 'Unknown error');
      }
    }
    
    return results;
  }

  // Test SMS for configuration verification
  async sendTestSMS(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`Test SMS sent successfully. SID: ${result.sid}`);
        return { success: true };
      } else {
        console.error('Test SMS sending failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Unknown error' 
        };
      }
    } catch (error) {
      console.error('Test SMS sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Singleton instance
export const smsService = new SMSService();

// Utility functions for common dealership scenarios
export const smsAlerts = {
  // Critical alerts
  async notifyCriticalBlocker(vehicleData: VehicleAlertData, phoneNumbers: string[]) {
    const alerts = phoneNumbers.map(phone => ({
      to: phone,
      message: `🚨 CRITICAL: ${vehicleData.make} ${vehicleData.model} has ${vehicleData.blockers} critical blockers in ${vehicleData.stage}. Immediate supervisor attention required.`,
      type: 'urgent' as const
    }));
    
    return smsService.sendBatchSMS(alerts);
  },

  async notifyTeamOverload(teamName: string, currentLoad: number, capacity: number, phoneNumbers: string[]) {
    const alerts = phoneNumbers.map(phone => ({
      to: phone,
      message: `⚠️ TEAM ALERT: ${teamName} is at ${Math.round((currentLoad/capacity) * 100)}% capacity (${currentLoad}/${capacity}). Consider redistributing workload.`,
      type: 'warning' as const
    }));
    
    return smsService.sendBatchSMS(alerts);
  },

  async notifyVehicleReady(vehicleData: VehicleAlertData, phoneNumber: string) {
    return smsService.sendSMS({
      to: phoneNumber,
      message: `🎉 RECONVISION: ${vehicleData.make} ${vehicleData.model} (${vehicleData.vin}) is ready for sale! All reconditioning complete.`,
      type: 'info'
    });
  },

  async notifyPartsDelay(vehicleData: VehicleAlertData, estimatedDelay: string, phoneNumbers: string[]) {
    const alerts = phoneNumbers.map(phone => ({
      to: phone,
      message: `⏱️ PARTS DELAY: ${vehicleData.make} ${vehicleData.model} (${vehicleData.vin}) parts delayed by ${estimatedDelay}. Adjusting timeline accordingly.`,
      type: 'warning' as const
    }));
    
    return smsService.sendBatchSMS(alerts);
  }
};
