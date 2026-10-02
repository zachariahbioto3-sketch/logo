"use client";

import Sidebar from "@/components/Sidebar";
import { SettingsProvider } from "@/lib/settings-context";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-8 bg-[var(--nicole-bg)] text-[var(--nicole-text)]">{children}</main>
      </div>
    </SettingsProvider>
  );
}
