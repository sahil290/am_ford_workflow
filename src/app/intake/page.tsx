"use client";

import { OpsShell } from "@/components/app-shell/ops-shell";
import { Navbar } from "@/components/navbar/navbar";
import { IntakeForm } from "@/components/intake/intake-form";

export default function IntakePage() {
  return (
    <OpsShell>
      <IntakeForm />
    </OpsShell>
  );
}
