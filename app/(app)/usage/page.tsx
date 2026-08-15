"use client";

import { useEffect, useState } from "react";
import { ChartBarIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";

type Usage = {
  totalToday: number;
  myToday: number;
  lastMinute: number;
  dailyLimit: number;
  rpmLimit: number;
  dailyPercent: number;
  rpmPercent: number;
  nearDailyLimit: boolean;
  nearRpmLimit: boolean;
};

export default function UsagePage() {
  const { showToast } = useToast();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) throw new Error();
      setUsage(await res.json());
    } catch {
      showToast("Couldn't load usage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !usage) {
    return <p className="text-sm text-[var(--nicole-text-muted)]">Loading usage...</p>;
  }

  const barColor = (percent: number) =>
    percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-[var(--nicole-text)]";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="w-6 h-6" />
        <h1 className="text-2xl font-medium">Usage</h1>
      </div>

      {(usage.nearDailyLimit || usage.nearRpmLimit) && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {usage.nearDailyLimit && "Nicole is close to today's free API limit. "}
            {usage.nearRpmLimit && "Requests are coming in fast right now \u2014 responses may briefly slow down or fail. "}
            Consider spacing out requests if you hit an error.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Today&apos;s usage (all users)</p>
            <p className="text-sm text-[var(--nicole-text-muted)]">{usage.totalToday} / {usage.dailyLimit}</p>
          </div>
          <div className="h-2 rounded-full bg-[var(--nicole-border)] overflow-hidden">
            <div className={`h-full ${barColor(usage.dailyPercent)} transition-all`} style={{ width: `${usage.dailyPercent}%` }} />
          </div>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-2">
            Resets daily. Shared across everyone using Nicole right now.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Requests in the last minute</p>
            <p className="text-sm text-[var(--nicole-text-muted)]">{usage.lastMinute} / {usage.rpmLimit}</p>
          </div>
          <div className="h-2 rounded-full bg-[var(--nicole-border)] overflow-hidden">
            <div className={`h-full ${barColor(usage.rpmPercent)} transition-all`} style={{ width: `${usage.rpmPercent}%` }} />
          </div>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-2">
            Sudden bursts of traffic can briefly slow responses.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white">
          <p className="text-sm font-medium mb-1">Your messages today</p>
          <p className="text-2xl font-medium">{usage.myToday}</p>
        </div>
      </div>
    </div>
  );
}
