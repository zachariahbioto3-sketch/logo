"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Settings = {
  theme: string;
  fontSize: string;
  compactView: boolean;
  streamResponses: boolean;
  autoTitle: boolean;
  contextLimit: number;
  usageWarningThreshold: number;
  language: string;
  customSystemPrompt: string | null;
  defaultDeckId: string | null;
  name: string | null;
  email: string;
  studyField: string | null;
  defaultModel: string;
};

const defaultSettings: Settings = {
  theme: "light",
  fontSize: "medium",
  compactView: false,
  streamResponses: true,
  autoTitle: true,
  contextLimit: 20,
  usageWarningThreshold: 80,
  language: "en",
  customSystemPrompt: null,
  defaultDeckId: null,
  name: null,
  email: "",
  studyField: null,
  defaultModel: "gemini-3.6-flash",
};

const SettingsContext = createContext<{
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
  loading: boolean;
}>({ settings: defaultSettings, update: async () => {}, loading: true });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        applyTheme(data.theme, data.fontSize);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = async (patch: Partial<Settings>) => {
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    applyTheme(optimistic.theme, optimistic.fontSize);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, update, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

function applyTheme(theme: string, fontSize: string) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  const sizes: Record<string, string> = { small: "13px", medium: "15px", large: "17px" };
  root.style.setProperty("--nicole-font-size", sizes[fontSize] || "15px");
}

export function useSettings() {
  return useContext(SettingsContext);
}