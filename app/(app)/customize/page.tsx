"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

const TABS = ["Profile", "AI", "Appearance", "Study", "Data"] as const;
type Tab = typeof TABS[number];

type Agent = { id: string; name: string };
type Deck = { id: string; name: string };

export default function SettingsPage() {
  const { settings, update, loading } = useSettings();
  const { showToast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Profile");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [studyField, setStudyField] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clearingChats, setClearingChats] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { setName(settings.name || ""); }, [settings.name]);
  useEffect(() => { setStudyField(settings.studyField || ""); }, [settings.studyField]);

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(setAgents).catch(() => {});
    fetch("/api/decks").then(r => r.json()).then(setDecks).catch(() => {});
  }, []);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await update(patch as never);
      showToast("Saved");
    } catch { showToast("Could not save"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setChangingPassword(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Password changed");
      setCurrentPassword(""); setNewPassword("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed");
    } finally { setChangingPassword(false); }
  };

  const clearChats = async () => {
    setClearingChats(true);
    try {
      const res = await fetch("/api/settings/clear-chats", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("All chats cleared");
      setConfirmClear(false);
    } catch { showToast("Could not clear chats"); }
    finally { setClearingChats(false); }
  };

  const exportData = () => { window.location.href = "/api/settings/export"; };

  const deleteAccount = async () => {
    if (!deletePassword) return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/login");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed");
    } finally { setDeletingAccount(false); }
  };

  if (loading) return <div className="p-8 text-sm text-[var(--nicole-text-muted)]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <div className="flex gap-1 mb-8 border-b border-[var(--nicole-border)]">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-2 text-sm transition-colors -mb-px border-b-2 " +
              (tab === t ? "border-[var(--nicole-text)] font-medium" : "border-transparent text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)]")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Email</label>
            <input value={settings.email} disabled
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-cream)] text-[var(--nicole-text-muted)]" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Field of Study / Year</label>
            <input value={studyField} onChange={(e) => setStudyField(e.target.value)}
              placeholder="e.g. 3rd year, Cardiology rotation"
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]" />
          </div>
          <button onClick={() => save({ name, studyField })} disabled={saving}
            className="px-4 py-2 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save profile"}
          </button>
          <div className="pt-4 border-t border-[var(--nicole-border)] space-y-3">
            <p className="text-xs font-medium">Change Password</p>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]" />
            <button onClick={changePassword} disabled={changingPassword || !currentPassword || !newPassword}
              className="px-4 py-2 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] text-sm disabled:opacity-50">
              {changingPassword ? "Changing..." : "Change password"}
            </button>
          </div>
        </div>
      )}

      {tab === "AI" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5">Default Model</label>
            <select value={settings.defaultModel} onChange={(e) => save({ defaultModel: e.target.value })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Default Agent</label>
            <select value={settings.defaultAgentId || ""} onChange={(e) => save({ defaultAgentId: e.target.value || null })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value="">None (use Nicole default)</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {agents.length === 0 && <p className="text-xs text-[var(--nicole-text-muted)] mt-1">No agents yet — create one in the Agents page.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Context Limit</label>
            <select value={settings.contextLimit} onChange={(e) => save({ contextLimit: Number(e.target.value) })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value={10}>10 messages</option>
              <option value={20}>20 messages</option>
              <option value={40}>40 messages</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Response Language</label>
            <select value={settings.language} onChange={(e) => save({ language: e.target.value })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Temperature — <span className="text-[var(--nicole-text-muted)]">{settings.temperature} ({settings.temperature < 0.4 ? "Focused" : settings.temperature < 0.8 ? "Balanced" : "Creative"})</span>
            </label>
            <input type="range" min={0} max={1} step={0.1} value={settings.temperature}
              onChange={(e) => save({ temperature: Number(e.target.value) })} className="w-full" />
            <div className="flex justify-between text-xs text-[var(--nicole-text-muted)] mt-1">
              <span>Precise</span><span>Creative</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Max Response Length</label>
            <select value={settings.maxTokens} onChange={(e) => save({ maxTokens: Number(e.target.value) })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value={500}>Short (500 tokens)</option>
              <option value={1000}>Medium (1000 tokens)</option>
              <option value={2000}>Long (2000 tokens)</option>
              <option value={4000}>Very long (4000 tokens)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Custom System Prompt</label>
            <textarea value={settings.customSystemPrompt || ""} onChange={(e) => save({ customSystemPrompt: e.target.value || null })}
              placeholder="Override Nicole global instructions..." rows={4}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)] resize-none" />
          </div>
          <div className="space-y-3">
            {([["streamResponses", "Stream responses in real-time"], ["autoTitle", "Auto-generate chat titles"]] as [string, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <button onClick={() => save({ [key]: !settings[key as keyof typeof settings] })}
                  className={"w-11 h-6 rounded-full transition-colors " + (settings[key as keyof typeof settings] ? "bg-[var(--nicole-text)]" : "bg-[var(--nicole-border)]")}>
                  <span className={"block w-5 h-5 rounded-full bg-[var(--nicole-cream)] shadow transition-transform mx-0.5 " + (settings[key as keyof typeof settings] ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Appearance" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {["light", "dark", "system"].map((t) => (
                <button key={t} onClick={() => save({ theme: t })}
                  className={"py-2.5 rounded-xl text-sm border transition-colors capitalize " +
                    (settings.theme === t ? "border-[var(--nicole-text)] bg-[var(--nicole-cream)] font-medium" : "border-[var(--nicole-border)] hover:bg-[var(--nicole-cream)]")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2">Font Size</label>
            <div className="grid grid-cols-3 gap-2">
              {["small", "medium", "large"].map((s) => (
                <button key={s} onClick={() => save({ fontSize: s })}
                  className={"py-2.5 rounded-xl text-sm border transition-colors capitalize " +
                    (settings.fontSize === s ? "border-[var(--nicole-text)] bg-[var(--nicole-cream)] font-medium" : "border-[var(--nicole-border)] hover:bg-[var(--nicole-cream)]")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"].map((color) => (
                <button key={color} onClick={() => save({ accentColor: color })}
                  style={{ backgroundColor: color }}
                  className={"w-8 h-8 rounded-full border-2 transition-transform " +
                    (settings.accentColor === color ? "border-[var(--nicole-text)] scale-110" : "border-transparent hover:scale-105")} />
              ))}
              <input type="color" value={settings.accentColor}
                onChange={(e) => save({ accentColor: e.target.value })}
                className="w-8 h-8 rounded-full cursor-pointer border border-[var(--nicole-border)]"
                title="Custom color" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Compact message view</span>
            <button onClick={() => save({ compactView: !settings.compactView })}
              className={"w-11 h-6 rounded-full transition-colors " + (settings.compactView ? "bg-[var(--nicole-text)]" : "bg-[var(--nicole-border)]")}>
              <span className={"block w-5 h-5 rounded-full bg-[var(--nicole-cream)] shadow transition-transform mx-0.5 " + (settings.compactView ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>
      )}

      {tab === "Study" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5">Default Flashcard Deck</label>
            <select value={settings.defaultDeckId || ""} onChange={(e) => save({ defaultDeckId: e.target.value || null })}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-bg)]">
              <option value="">None</option>
              {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {decks.length === 0 && <p className="text-xs text-[var(--nicole-text-muted)] mt-1">No decks yet — create one in Flashcards.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Daily Study Goal</label>
            <p className="text-xs text-[var(--nicole-text-muted)] mb-2">Cards to review per day</p>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={100} step={5} value={settings.dailyStudyGoal}
                onChange={(e) => save({ dailyStudyGoal: Number(e.target.value) })} className="flex-1" />
              <span className="text-sm font-medium w-16">{settings.dailyStudyGoal} cards</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Usage Warning Threshold</label>
            <p className="text-xs text-[var(--nicole-text-muted)] mb-2">Show warning badge when usage hits this %</p>
            <div className="flex items-center gap-3">
              <input type="range" min={50} max={95} step={5} value={settings.usageWarningThreshold}
                onChange={(e) => save({ usageWarningThreshold: Number(e.target.value) })} className="flex-1" />
              <span className="text-sm font-medium w-10">{settings.usageWarningThreshold}%</span>
            </div>
          </div>
        </div>
      )}

      {tab === "Data" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] space-y-2">
            <p className="text-sm font-medium">Export my data</p>
            <p className="text-xs text-[var(--nicole-text-muted)]">Download all your chats, projects, tasks, agents, and flashcards as JSON.</p>
            <button onClick={exportData}
              className="px-4 py-2 rounded-xl border border-[var(--nicole-border)] bg-[var(--nicole-bg)] text-sm hover:opacity-80">
              Download export
            </button>
          </div>
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 space-y-3">
            <p className="text-sm font-medium text-amber-700">Clear all chats</p>
            <p className="text-xs text-amber-600">Permanently deletes all your chat history. Cannot be undone.</p>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm hover:bg-amber-600">
                Clear all chats
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={clearChats} disabled={clearingChats}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm disabled:opacity-50">
                  {clearingChats ? "Clearing..." : "Confirm clear"}
                </button>
                <button onClick={() => setConfirmClear(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--nicole-border)] text-sm">
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 space-y-3">
            <p className="text-sm font-medium text-red-700">Delete account</p>
            <p className="text-xs text-red-600">Permanently deletes your account and all data. Cannot be undone.</p>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600">
                Delete my account
              </button>
            ) : (
              <div className="space-y-2">
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 outline-none bg-white" />
                <div className="flex gap-2">
                  <button onClick={deleteAccount} disabled={deletingAccount || !deletePassword}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm disabled:opacity-50">
                    {deletingAccount ? "Deleting..." : "Confirm delete"}
                  </button>
                  <button onClick={() => { setConfirmDelete(false); setDeletePassword(""); }}
                    className="px-4 py-2 rounded-xl border border-[var(--nicole-border)] text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}