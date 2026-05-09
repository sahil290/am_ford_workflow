"use client";

import { OpsShell } from "@/components/app-shell/ops-shell";
import { Navbar } from "@/components/navbar/navbar";
import { SMSSettings } from "@/components/admin/sms-settings";

export default function SMSSettingsPage() {
  return (
    <OpsShell>
      <Navbar />
      <SMSSettings />
    </OpsShell>
  );
}
