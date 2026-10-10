"use client";

import { GoogleGenAI } from "@google/genai";
import { getAll, getById, getByIndex, putItem, deleteById } from "./localDb";

const ME = "local-user";
const FALLBACK_MODEL = "gemini-2.0-flash"; // change here if Google retires this model id
const DAILY_LIMIT = 1500;
const RPM_LIMIT = 15;
const MAX_UPLOAD = 10 * 1024 * 1024;
const ALLOWED_UPLOAD = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const ts = (v: string) => new Date(v).getTime();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}
function readBody(init?: RequestInit): any {
  try {
    return typeof init?.body === "string" ? JSON.parse(init.body) : {};
  } catch {
    return {};
  }
}
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
async function geminiConfig() {
  const s = await getById<any>("settings", ME);
  return {
    apiKey: s?.geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
    model: s?.defaultModel || FALLBACK_MODEL,
  };
}

// Same spaced-repetition math as the server route
function sm2(card: any, rating: number) {
  let interval = card.interval;
  let easeFactor = card.easeFactor;
  let repetitions = card.repetitions;
  if (rating === 0) {
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    const bonus = rating === 3 ? 0 : rating === 2 ? -0.15 : 0.1;
    easeFactor = Math.max(1.3, easeFactor + bonus);
    repetitions += 1;
  }
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { interval, easeFactor, repetitions, nextReview: next.toISOString() };
}

// Builds Gemini parts for a stored message; inlines data-URL attachments when asked
export function messageParts(m: any, withAttachment: boolean): object[] {
  const parts: object[] = [];
  const url = m.attachmentUrl;
  if (withAttachment && typeof url === "string" && url.startsWith("data:")) {
    const comma = url.indexOf(",");
    const head = url.slice(5, comma);
    if (comma > 0 && head.endsWith(";base64")) {
      parts.push({ inlineData: { mimeType: m.attachmentType || head.split(";")[0], data: url.slice(comma + 1) } });
    }
  }
  if (m.content && String(m.content).trim()) parts.push({ text: m.content });
  if (parts.length === 0) parts.push({ text: " " });
  return parts;
}

async function groupView(g: any) {
  const u = (await getById<any>("users", ME)) || { id: ME, email: "user@local.app", name: "Local User" };
  const member = {
    id: "m-" + g.id,
    userId: ME,
    groupId: g.id,
    role: "owner",
    joinedAt: g.createdAt,
    user: { id: u.id, name: u.name, email: u.email },
  };
  return { ...g, members: [member] };
}

export async function handleExtraApiRoute(url: string, init?: RequestInit): Promise<Response | null> {
  const method = (init?.method || "GET").toUpperCase();
  const u = new URL(url, "http://local");
  const p = u.pathname;
  let m: RegExpMatchArray | null;

  // ---- Chats ----
  if (p === "/api/chats/search" && method === "GET") {
    const q = (u.searchParams.get("q") || "").trim().toLowerCase();
    if (!q) return json([]);
    const [chats, msgs] = await Promise.all([getAll<any>("chats"), getAll<any>("messages")]);
    const hits = new Set<string>();
    for (const x of msgs) if (String(x.content || "").toLowerCase().includes(q)) hits.add(x.chatId);
    const found = chats.filter((c) => String(c.title || "").toLowerCase().includes(q) || hits.has(c.id));
    found.sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
    return json(found.slice(0, 15));
  }

  m = p.match(/^\/api\/chats\/([^/]+)$/);
  if (m && method === "GET") {
    const chat = await getById<any>("chats", m[1]);
    if (!chat) return fail("Not found", 404);
    const msgs = await getByIndex<any>("messages", "chatId", m[1]);
    msgs.sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
    const agent = chat.agentId ? await getById<any>("agents", chat.agentId) : null;
    return json({ ...chat, messages: msgs, agent });
  }
  if (m && method === "PATCH") {
    const body = readBody(init);
    const chat = await getById<any>("chats", m[1]);
    if (!chat) return fail("Not found", 404);
    if (body.title !== undefined) {
      if (!String(body.title).trim()) return fail("Title required");
      chat.title = String(body.title).trim();
    }
    if (body.projectId !== undefined) chat.projectId = body.projectId || null;
    chat.updatedAt = nowIso();
    await putItem("chats", chat);
    return json(chat);
  }

  // ---- Tasks ----
  if (p === "/api/tasks" && method === "GET") {
    const [tasks, projects] = await Promise.all([getAll<any>("tasks"), getAll<any>("projects")]);
    tasks.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    return json(tasks.map((t) => ({ ...t, project: projects.find((pr) => pr.id === t.projectId) || null })));
  }
  m = p.match(/^\/api\/tasks\/([^/]+)$/);
  if (m && method === "PATCH") {
    const { status } = readBody(init);
    if (typeof status !== "string") return fail("Status required");
    const task = await getById<any>("tasks", m[1]);
    if (!task) return fail("Not found", 404);
    task.status = status;
    await putItem("tasks", task);
    return json(task);
  }

  // ---- Decks and flashcards ----
  if (p === "/api/decks" && method === "GET") {
    const [decks, cards] = await Promise.all([getAll<any>("decks"), getAll<any>("cards")]);
    decks.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    return json(decks.map((d) => ({ ...d, _count: { cards: cards.filter((c) => c.deckId === d.id).length } })));
  }

  if (p === "/api/decks/generate" && method === "POST") {
    const { chatId, deckId } = readBody(init);
    if (!chatId || !deckId) return fail("chatId and deckId required");
    const [chat, deck] = await Promise.all([getById<any>("chats", chatId), getById<any>("decks", deckId)]);
    if (!chat) return fail("Chat not found", 404);
    if (!deck) return fail("Deck not found", 404);
    const { apiKey, model } = await geminiConfig();
    if (!apiKey) return fail("Add your Gemini API key in Settings first.");
    const msgs = (await getByIndex<any>("messages", "chatId", chatId))
      .sort((a, b) => ts(a.createdAt) - ts(b.createdAt))
      .slice(0, 40);
    const transcript = msgs.map((x) => (x.role === "user" ? "Student: " : "Nicole: ") + x.content).join("\n\n");
    const prompt =
      "You are a medical education expert. Given this study conversation, generate 5 to 10 high-quality flashcards " +
      "that capture the key facts, concepts, and clinical pearls. Return strictly a JSON array of objects with keys " +
      "\"front\" and \"back\". No markdown, no extra text.\n\n" +
      transcript;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({ model, contents: prompt });
      const clean = (result.text || "").replace(/```json|```/g, "").trim();
      const cards = JSON.parse(clean);
      if (!Array.isArray(cards)) throw new Error("Not an array");
      let created = 0;
      for (const c of cards) {
        if (!c?.front?.trim?.() || !c?.back?.trim?.()) continue;
        await putItem("cards", {
          id: uid("card"),
          deckId,
          front: c.front.trim(),
          back: c.back.trim(),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: nowIso(),
          createdAt: nowIso(),
        });
        created++;
      }
      return json({ created });
    } catch (e) {
      console.error("Deck generation failed:", e);
      return fail("Failed to generate cards", 500);
    }
  }

  m = p.match(/^\/api\/decks\/([^/]+)\/cards\/([^/]+)$/);
  if (m && method === "PATCH") {
    const { rating } = readBody(init);
    if (typeof rating !== "number" || rating < 0 || rating > 3) return fail("Rating must be 0-3");
    const card = await getById<any>("cards", m[2]);
    if (!card) return fail("Card not found", 404);
    const updated = { ...card, ...sm2(card, rating) };
    await putItem("cards", updated);
    return json(updated);
  }

  m = p.match(/^\/api\/decks\/([^/]+)$/);
  if (m && method === "DELETE") {
    const cards = await getByIndex<any>("cards", "deckId", m[1]);
    for (const c of cards) await deleteById("cards", c.id);
    await deleteById("decks", m[1]);
    return json({ success: true });
  }

  // ---- Files (derived from message attachments) and upload ----
  if (p === "/api/files" && method === "GET") {
    const [msgs, chats] = await Promise.all([getAll<any>("messages"), getAll<any>("chats")]);
    const titles = new Map<string, string>(chats.map((c) => [c.id, c.title] as [string, string]));
    const files = msgs
      .filter((x) => x.attachmentUrl)
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
      .map((x) => ({
        id: x.id,
        attachmentUrl: x.attachmentUrl,
        attachmentType: x.attachmentType,
        attachmentName: x.attachmentName,
        createdAt: x.createdAt,
        chat: { id: x.chatId, title: titles.get(x.chatId) || "Untitled" },
      }));
    return json(files);
  }
  if (p === "/api/files" && method === "DELETE") {
    const { messageId } = readBody(init);
    const msg = messageId ? await getById<any>("messages", messageId) : null;
    if (!msg) return fail("Not found", 404);
    msg.attachmentUrl = null;
    msg.attachmentType = null;
    msg.attachmentName = null;
    await putItem("messages", msg);
    return json({ success: true });
  }
  if (p === "/api/upload" && method === "POST") {
    const form = init?.body;
    if (!(form instanceof FormData)) return fail("No file");
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file");
    if (!ALLOWED_UPLOAD.includes(file.type)) return fail("File type not allowed");
    if (file.size > MAX_UPLOAD) return fail("File too large (max 10MB)");
    return json({ url: await toDataUrl(file), type: file.type, name: file.name });
  }

  // ---- Usage (approximate: counts assistant replies) ----
  if (p === "/api/usage" && method === "GET") {
    const msgs = (await getAll<any>("messages")).filter((x) => x.role === "assistant");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const totalToday = msgs.filter((x) => ts(x.createdAt) >= start.getTime()).length;
    const lastMinute = msgs.filter((x) => ts(x.createdAt) >= Date.now() - 60000).length;
    return json({
      totalToday,
      myToday: totalToday,
      lastMinute,
      dailyLimit: DAILY_LIMIT,
      rpmLimit: RPM_LIMIT,
      dailyPercent: Math.min(100, Math.round((totalToday / DAILY_LIMIT) * 100)),
      rpmPercent: Math.min(100, Math.round((lastMinute / RPM_LIMIT) * 100)),
      nearDailyLimit: totalToday / DAILY_LIMIT >= 0.8,
      nearRpmLimit: lastMinute / RPM_LIMIT >= 0.8,
    });
  }

  // ---- Settings ----
  if (p === "/api/settings/change-password" && method === "POST") {
    return fail("The offline app has no account password to change.");
  }

  // ---- Study groups (single-user, local only) ----
  if (p === "/api/study-groups/join" && method === "POST") {
    return fail("Joining a group with an invite code needs the online version of Nicole.");
  }
  if (p === "/api/study-groups" && method === "GET") {
    const groups = await getAll<any>("studyGroups");
    groups.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    const owned = [];
    for (const g of groups) owned.push({ ...(await groupView(g)), _count: { members: 1 } });
    return json({ owned, joined: [] });
  }
  if (p === "/api/study-groups" && method === "POST") {
    const { name } = readBody(init);
    if (!name?.trim()) return fail("Name required");
    const group = {
      id: uid("group"),
      name: name.trim(),
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      ownerId: ME,
      createdAt: nowIso(),
    };
    await putItem("studyGroups", group);
    return json({ ...group, _count: { members: 1 } });
  }

  m = p.match(/^\/api\/study-groups\/([^/]+)\/agents$/);
  if (m) {
    const group = await getById<any>("studyGroups", m[1]);
    if (!group) return fail("Not found", 404);
    if (method === "GET") {
      const agents = (await getAll<any>("agents")).filter((a) => a.companyId === m![1]);
      agents.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
      return json(agents);
    }
    if (method === "POST") {
      const { name, systemPrompt, defaultModel } = readBody(init);
      if (!name?.trim() || !systemPrompt?.trim()) return fail("Name and prompt required");
      const agent = {
        id: uid("agent"),
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
        defaultModel: defaultModel || FALLBACK_MODEL,
        ownerId: ME,
        companyId: group.id,
        createdAt: nowIso(),
      };
      await putItem("agents", agent);
      return json(agent);
    }
  }

  m = p.match(/^\/api\/study-groups\/([^/]+)\/members\/([^/]+)$/);
  if (m) return fail("There are no other members in the offline app.");

  m = p.match(/^\/api\/study-groups\/([^/]+)$/);
  if (m) {
    const group = await getById<any>("studyGroups", m[1]);
    if (!group) return fail("Not found", 404);
    if (method === "GET") {
      const agents = (await getAll<any>("agents")).filter((a) => a.companyId === group.id);
      agents.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
      return json({ ...(await groupView(group)), agents, myRole: "owner" });
    }
    if (method === "PATCH") {
      const { name } = readBody(init);
      if (!name?.trim()) return fail("Name required");
      group.name = name.trim();
      await putItem("studyGroups", group);
      return json(group);
    }
    if (method === "DELETE") {
      const agents = (await getAll<any>("agents")).filter((a) => a.companyId === group.id);
      for (const a of agents) await deleteById("agents", a.id);
      await deleteById("studyGroups", group.id);
      return json({ success: true, action: "deleted" });
    }
  }

  return null;
}