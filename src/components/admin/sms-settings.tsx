"use client";

import { useState, useEffect } from "react";
import { notificationManager } from "@/modules/notifications/application/notification-manager";
import type { AdminPhoneConfig, NotificationType } from "@/modules/notifications/domain/notification.types";

export function SMSSettings() {
  const [adminConfig, setAdminConfig] = useState<AdminPhoneConfig | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const config = notificationManager.getAdminConfig();
    setAdminConfig(config);
  }, []);

  const handleAddAdmin = () => {
    if (!adminConfig) return;

    const newAdmin = {
      userId: `admin-${Date.now()}`,
      name: "",
      phone: "",
      role: "service_manager" as const,
      notifications: ["vehicle_overdue", "sla_breach", "critical_blocker"] as NotificationType[]
    };

    const updatedConfig = {
      ...adminConfig,
      adminPhones: [...adminConfig.adminPhones, newAdmin]
    };

    setAdminConfig(updatedConfig);
    notificationManager.updateAdminPhoneConfig(updatedConfig);
  };

  const handleUpdateAdmin = (userId: string, field: string, value: any) => {
    if (!adminConfig) return;

    const updatedConfig = {
      ...adminConfig,
      adminPhones: adminConfig.adminPhones.map(admin =>
        admin.userId === userId ? { ...admin, [field]: value } : admin
      )
    };

    setAdminConfig(updatedConfig);
    notificationManager.updateAdminPhoneConfig(updatedConfig);
  };

  const handleUpdateEmergencyContact = (index: number, field: string, value: any) => {
    if (!adminConfig) return;

    const updatedConfig = {
      ...adminConfig,
      emergencyContacts: adminConfig.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    };

    setAdminConfig(updatedConfig);
    notificationManager.updateAdminPhoneConfig(updatedConfig);
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!adminConfig) return;

    const updatedConfig = {
      ...adminConfig,
      adminPhones: adminConfig.adminPhones.filter(admin => admin.userId !== userId)
    };

    setAdminConfig(updatedConfig);
    await notificationManager.removeAdminPhone(userId);
  };

  const handleTestSMS = async () => {
    if (!testPhone) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await notificationManager.testSMSConfiguration(testPhone);
      setTestResult({
        success: result.success,
        message: result.success 
          ? "Test SMS sent successfully!" 
          : `Failed to send SMS: ${result.error}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Error sending test SMS"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes = [
    { value: 'vehicle_stage_change', label: 'Vehicle Stage Change' },
    { value: 'vehicle_overdue', label: 'Vehicle Overdue' },
    { value: 'sla_breach', label: 'SLA Breach' },
    { value: 'team_overload', label: 'Team Overload' },
    { value: 'critical_blocker', label: 'Critical Blocker' },
    { value: 'parts_delay', label: 'Parts Delay' },
    { value: 'vehicle_ready', label: 'Vehicle Ready' },
    { value: 'workflow_assignment', label: 'Workflow Assignment' },
    { value: 'intake_confirmation', label: 'Intake Confirmation' }
  ];

  const roles = [
    { value: 'general_manager', label: 'General Manager' },
    { value: 'service_manager', label: 'Service Manager' },
    { value: 'parts_manager', label: 'Parts Manager' },
    { value: 'detail_manager', label: 'Detail Manager' },
    { value: 'recon_manager', label: 'Recon Manager' }
  ];

  if (!adminConfig) {
    return <div className="text-[#333333]">Loading configuration...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] mb-2">SMS Settings</h1>
          <p className="text-gray-500">Configure admin phone numbers and SMS notification preferences</p>
        </div>

        {/* Test SMS Configuration */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#333333] mb-6">TEST SMS CONFIGURATION</h2>
          <div className="flex gap-4">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="ENTER PHONE NUMBER TO TEST (E.G. +1234567890)"
              className="flex-1 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-4 py-3 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
            />
            <button
              onClick={handleTestSMS}
              disabled={!testPhone || isLoading}
              className="bg-[#007bff] hover:bg-[#0056b3] px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "SENDING..." : "SEND TEST SMS"}
            </button>
          </div>
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              testResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Admin Phone Numbers */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#333333] mb-6">ADMIN PHONE NUMBERS</h2>
            <button
              onClick={handleAddAdmin}
              className="bg-[#007bff] hover:bg-[#0056b3] px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
              ADD ADMIN
            </button>
          </div>

          <div className="space-y-4">
            {adminConfig.adminPhones.map((admin) => (
              <div key={admin.userId} className="glass-card rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">NAME</label>
                    <input
                      type="text"
                      value={admin.name}
                      onChange={(e) => handleUpdateAdmin(admin.userId, 'name', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                      placeholder="ADMIN NAME"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">PHONE NUMBER</label>
                    <input
                      type="tel"
                      value={admin.phone}
                      onChange={(e) => handleUpdateAdmin(admin.userId, 'phone', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Role</label>
                    <select
                      value={admin.role}
                      onChange={(e) => handleUpdateAdmin(admin.userId, 'role', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Notification Types</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {notificationTypes.map(type => (
                      <label key={type.value} className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={admin.notifications.includes(type.value as any)}
                          onChange={(e) => {
                            const notifications = e.target.checked
                              ? [...admin.notifications, type.value as any]
                              : admin.notifications.filter(n => n !== type.value);
                            handleUpdateAdmin(admin.userId, 'notifications', notifications);
                          }}
                          className="rounded"
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleRemoveAdmin(admin.userId)}
                    className="bg-white border border-[#E0E0E0] px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    REMOVE ADMIN
                  </button>
                </div>
              </div>
            ))}
          </div>

          {adminConfig.adminPhones.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No admin phone numbers configured. Click "Add Admin" to get started.
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="glass-card rounded-2xl p-6 mt-8">
          <h2 className="text-xl font-semibold text-[#333333] mb-6">EMERGENCY CONTACTS</h2>
          <div className="space-y-4">
            {adminConfig.emergencyContacts.map((contact, index) => (
              <div key={index} className="glass-card rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">NAME</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => handleUpdateEmergencyContact(index, 'name', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                      placeholder="CONTACT NAME"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">PHONE NUMBER</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => handleUpdateEmergencyContact(index, 'phone', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">RELATION</label>
                    <input
                      type="text"
                      value={contact.relation}
                      onChange={(e) => handleUpdateEmergencyContact(index, 'relation', e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-[#333333] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                      placeholder="OWNER, MANAGER, ETC."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
