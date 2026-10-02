"use client";

import {
  getAll,
  getById,
  getByIndex,
  putItem,
  deleteById,
  clearStore,
  LocalChat,
  LocalMessage,
  LocalTask,
  LocalProject,
  LocalAgent,
  LocalDeck,
  LocalFlashcard,
  LocalSettings,
  LocalUser,
} from "./localDb";
import { GoogleGenAI } from "@google/genai";

let isInterceptorInitialized = false;

export function initClientApiInterceptor() {
  if (typeof window === "undefined" || isInterceptorInitialized) return;
  isInterceptorInitialized = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept relative /api/ routes
    if (!urlString.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    try {
      const response = await handleApiRoute(urlString, init);
      if (response) return response;
    } catch (err: any) {
      console.error("Local API interceptor error:", err);
      return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };
}

async function handleApiRoute(url: string, init?: RequestInit): Promise<Response | null> {
  const method = (init?.method || "GET").toUpperCase();
  const parsedUrl = new URL(url, "http://local");
  const pathname = parsedUrl.pathname;

  // 1. NextAuth Session Mock
  if (pathname.startsWith("/api/auth/")) {
    return jsonResponse({
      user: { id: "local-user", email: "user@local.app", name: "Local User" },
      expires: "2099-12-31T23:59:59.000Z",
    });
  }

  // 2. Chats Endpoints
  if (pathname === "/api/chats") {
    if (method === "GET") {
      const chats = await getAll<LocalChat>("chats");
      chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return jsonResponse(chats);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newChat: LocalChat = {
        id: "chat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        title: body.title || "New chat",
        ownerId: "local-user",
        projectId: body.projectId || null,
        agentId: body.agentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem("chats", newChat);
      return jsonResponse(newChat);
    }
  }

  // Messages in Chat: /api/chats/[id]/messages
  const chatMessagesMatch = pathname.match(/^\/api\/chats\/([^\/]+)\/messages$/);
  if (chatMessagesMatch && method === "POST") {
    const chatId = chatMessagesMatch[1];
    const body = init?.body ? JSON.parse(init.body.toString()) : {};
    const userContent = body.content || "";
    const model = body.model || "gemini-2.0-flash";

    // Get user settings for Gemini API Key
    const settings = await getById<LocalSettings>("settings", "local-user");
    const apiKey =
      settings?.geminiApiKey ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    // Save user message
    const userMsg: LocalMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      chatId,
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    await putItem("messages", userMsg);

    // Get chat and agent if any
    const chat = await getById<LocalChat>("chats", chatId);
    let systemPrompt = "You are a helpful AI assistant.";
    if (chat?.agentId) {
      const agent = await getById<LocalAgent>("agents", chat.agentId);
      if (agent?.systemPrompt) systemPrompt = agent.systemPrompt;
    }

    // Update chat updatedAt
    if (chat) {
      chat.updatedAt = new Date().toISOString();
      if (chat.title === "New chat" && userContent) {
        chat.title = userContent.slice(0, 30);
      }
      await putItem("chats", chat);
    }

    // Fetch conversation history
    const allMsgs = await getByIndex<LocalMessage>("messages", "chatId", chatId);
    allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const contents = allMsgs.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // If no API Key configured, return polite fallback message
    if (!apiKey) {
      const fallbackText =
        "Please enter your Gemini API Key in Settings (/customize) to enable AI chat responses!";
      const assistantMsg: LocalMessage = {
        id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        chatId,
        role: "assistant",
        content: fallbackText,
        createdAt: new Date().toISOString(),
      };
      await putItem("messages", assistantMsg);
      return new Response(fallbackText, { headers: { "Content-Type": "text/plain" } });
    }

    // Call Gemini API and stream response
    const ai = new GoogleGenAI({ apiKey });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          const result = await ai.models.generateContentStream({
            model: model,
            contents: contents as any,
            config: { systemInstruction: systemPrompt },
          });

          for await (const chunk of result) {
            const text = chunk.text || "";
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Save assistant response
          const assistantMsg: LocalMessage = {
            id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            chatId,
            role: "assistant",
            content: fullText,
            createdAt: new Date().toISOString(),
          };
          await putItem("messages", assistantMsg);
          controller.close();
        } catch (err: any) {
          console.error("Gemini stream error:", err);
          const errText = "\n[Error: " + (err?.message || "Failed to call Gemini API") + "]";
          controller.enqueue(encoder.encode(errText));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain" } });
  }

  // Single Chat: /api/chats/[id]
  const chatMatch = pathname.match(/^\/api\/chats\/([^\/]+)$/);
  if (chatMatch) {
    const chatId = chatMatch[1];
    if (method === "GET") {
      const chat = await getById<LocalChat>("chats", chatId);
      if (!chat) return jsonResponse({ error: "Chat not found" }, 404);
      const messages = await getByIndex<LocalMessage>("messages", "chatId", chatId);
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return jsonResponse({ ...chat, messages });
    }
    if (method === "PUT") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const chat = await getById<LocalChat>("chats", chatId);
      if (chat) {
        if (body.title) chat.title = body.title;
        chat.updatedAt = new Date().toISOString();
        await putItem("chats", chat);
      }
      return jsonResponse(chat);
    }
    if (method === "DELETE") {
      await deleteById("chats", chatId);
      // Delete associated messages
      const msgs = await getByIndex<LocalMessage>("messages", "chatId", chatId);
      for (const m of msgs) {
        await deleteById("messages", m.id);
      }
      return jsonResponse({ success: true });
    }
  }

  // 3. Tasks Endpoints: /api/tasks
  if (pathname === "/api/tasks") {
    if (method === "GET") {
      const tasks = await getAll<LocalTask>("tasks");
      return jsonResponse(tasks);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newTask: LocalTask = {
        id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        title: body.title || "New Task",
        status: body.status || "todo",
        ownerId: "local-user",
        projectId: body.projectId || null,
        createdAt: new Date().toISOString(),
      };
      await putItem("tasks", newTask);
      return jsonResponse(newTask);
    }
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([^\/]+)$/);
  if (taskMatch) {
    const taskId = taskMatch[1];
    if (method === "PUT") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const task = await getById<LocalTask>("tasks", taskId);
      if (task) {
        if (body.status !== undefined) task.status = body.status;
        if (body.title !== undefined) task.title = body.title;
        await putItem("tasks", task);
      }
      return jsonResponse(task);
    }
    if (method === "DELETE") {
      await deleteById("tasks", taskId);
      return jsonResponse({ success: true });
    }
  }

  // 4. Projects Endpoints: /api/projects
  if (pathname === "/api/projects") {
    if (method === "GET") {
      const projects = await getAll<LocalProject>("projects");
      return jsonResponse(projects);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newProj: LocalProject = {
        id: "proj-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: body.name || "New Project",
        ownerId: "local-user",
        createdAt: new Date().toISOString(),
      };
      await putItem("projects", newProj);
      return jsonResponse(newProj);
    }
  }

  const projMatch = pathname.match(/^\/api\/projects\/([^\/]+)$/);
  if (projMatch && method === "DELETE") {
    await deleteById("projects", projMatch[1]);
    return jsonResponse({ success: true });
  }

  // 5. Agents Endpoints: /api/agents
  if (pathname === "/api/agents") {
    if (method === "GET") {
      const agents = await getAll<LocalAgent>("agents");
      return jsonResponse(agents);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newAgent: LocalAgent = {
        id: "agent-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: body.name || "Custom Agent",
        systemPrompt: body.systemPrompt || "You are an AI assistant.",
        defaultModel: body.defaultModel || "gemini-2.0-flash",
        ownerId: "local-user",
        createdAt: new Date().toISOString(),
      };
      await putItem("agents", newAgent);
      return jsonResponse(newAgent);
    }
  }

  const agentMatch = pathname.match(/^\/api\/agents\/([^\/]+)$/);
  if (agentMatch && method === "DELETE") {
    await deleteById("agents", agentMatch[1]);
    return jsonResponse({ success: true });
  }

  // 6. Decks & Flashcards Endpoints
  if (pathname === "/api/decks") {
    if (method === "GET") {
      const decks = await getAll<LocalDeck>("decks");
      return jsonResponse(decks);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newDeck: LocalDeck = {
        id: "deck-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: body.name || "New Deck",
        ownerId: "local-user",
        createdAt: new Date().toISOString(),
      };
      await putItem("decks", newDeck);
      return jsonResponse(newDeck);
    }
  }

  // Deck Generate with Gemini: /api/decks/generate
  if (pathname === "/api/decks/generate" && method === "POST") {
    const body = init?.body ? JSON.parse(init.body.toString()) : {};
    const topic = body.topic || "General Knowledge";
    const count = body.count || 5;

    const settings = await getById<LocalSettings>("settings", "local-user");
    const apiKey =
      settings?.geminiApiKey ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    let generatedCards = [
      { front: `What is ${topic}?`, back: `${topic} is a key topic of study.` },
    ];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Generate ${count} flashcards about "${topic}". Return strictly valid JSON array of objects with keys "front" and "back". No extra text or markdown formatting.`,
        });
        const text = response.text || "";
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        generatedCards = JSON.parse(cleanJson);
      } catch (err) {
        console.error("Failed to generate deck with Gemini:", err);
      }
    }

    const newDeck: LocalDeck = {
      id: "deck-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: topic + " Deck",
      ownerId: "local-user",
      createdAt: new Date().toISOString(),
    };
    await putItem("decks", newDeck);

    for (const card of generatedCards) {
      const newCard: LocalFlashcard = {
        id: "card-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        deckId: newDeck.id,
        front: card.front,
        back: card.back,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await putItem("cards", newCard);
    }

    return jsonResponse(newDeck);
  }

  const deckCardsMatch = pathname.match(/^\/api\/decks\/([^\/]+)\/cards$/);
  if (deckCardsMatch) {
    const deckId = deckCardsMatch[1];
    if (method === "GET") {
      const cards = await getByIndex<LocalFlashcard>("cards", "deckId", deckId);
      return jsonResponse(cards);
    }
    if (method === "POST") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const newCard: LocalFlashcard = {
        id: "card-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        deckId,
        front: body.front || "",
        back: body.back || "",
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await putItem("cards", newCard);
      return jsonResponse(newCard);
    }
  }

  // 7. Settings Endpoints
  if (pathname === "/api/settings") {
    if (method === "GET") {
      const settings = (await getById<LocalSettings>("settings", "local-user")) || {
        userId: "local-user",
        theme: "light",
        fontSize: "medium",
        compactView: false,
        streamResponses: true,
        autoTitle: true,
        contextLimit: 20,
        usageWarningThreshold: 80,
        language: "en",
        defaultModel: "gemini-2.0-flash",
        temperature: 0.7,
      };
      return jsonResponse(settings);
    }
    if (method === "PUT" || method === "PATCH") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      const current = (await getById<LocalSettings>("settings", "local-user")) || {
        userId: "local-user",
        theme: "light",
        fontSize: "medium",
        compactView: false,
        streamResponses: true,
        autoTitle: true,
        contextLimit: 20,
        usageWarningThreshold: 80,
        language: "en",
        defaultModel: "gemini-2.0-flash",
        temperature: 0.7,
      };
      const updated = { ...current, ...body };
      await putItem("settings", updated);
      return jsonResponse(updated);
    }
  }

  if (pathname === "/api/settings/clear-chats" && method === "DELETE") {
    await clearStore("chats");
    await clearStore("messages");
    return jsonResponse({ success: true });
  }

  if (pathname === "/api/settings/account") {
    const user = (await getById<LocalUser>("users", "local-user")) || {
      id: "local-user",
      email: "user@local.app",
      name: "Local User",
      createdAt: new Date().toISOString(),
      defaultModel: "gemini-2.0-flash",
    };
    if (method === "PUT") {
      const body = init?.body ? JSON.parse(init.body.toString()) : {};
      if (body.name) user.name = body.name;
      if (body.email) user.email = body.email;
      await putItem("users", user);
    }
    return jsonResponse(user);
  }

  // 8. Usage Stats
  if (pathname === "/api/usage") {
    const chats = await getAll<LocalChat>("chats");
    const msgs = await getAll<LocalMessage>("messages");
    return jsonResponse({
      totalChats: chats.length,
      totalMessages: msgs.length,
      modelDistribution: { "gemini-2.0-flash": msgs.length },
      recentLogs: [],
    });
  }

  // Fallback for remaining API routes
  return jsonResponse({ success: true, localMode: true });
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
