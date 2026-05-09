"use client";

import { OpsShell } from "@/components/app-shell/ops-shell";

export default function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OpsShell>{children}</OpsShell>;
}
