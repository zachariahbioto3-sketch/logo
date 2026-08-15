"use client";

import { useEffect, useState } from "react";

export default function CustomizePage() {
  const [name, setName] = useState("");
  const [studyField, setStudyField] = useState("");
  const [defaultModel, setDefaultModel] = useState("gemini-3.6-flash");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || "");
        setStudyField(data.studyField || "");
        setDefaultModel(data.defaultModel || "gemini-3.6-flash");
        setLoading(false);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, studyField, defaultModel }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-medium mb-6">Customize</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Field of study</label>
          <input
            value={studyField}
            onChange={(e) => setStudyField(e.target.value)}
            placeholder="e.g. Internal Medicine, 3rd year"
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Default model</label>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
          </select>
        </div>
        <button type="submit" className="bg-[var(--nicole-text)] text-white rounded-lg px-4 py-2 text-sm">
          Save changes
        </button>
        {saved && <p className="text-sm text-green-600">Saved.</p>}
      </form>
    </div>
  );
}
