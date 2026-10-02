"use client";

// Client-side IndexedDB wrapper for local-first Android APK execution

const DB_NAME = "nicole_local_db";
const DB_VERSION = 1;

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  defaultModel: string;
  studyField?: string;
}

export interface LocalChat {
  id: string;
  title: string;
  ownerId: string;
  projectId?: string | null;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMessage {
  id: string;
  chatId: string;
  role: string; // 'user' | 'assistant'
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  createdAt: string;
}

export interface LocalTask {
  id: string;
  title: string;
  status: string; // 'todo' | 'completed' | 'in_progress'
  ownerId: string;
  projectId?: string | null;
  createdAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface LocalAgent {
  id: string;
  name: string;
  systemPrompt: string;
  defaultModel: string;
  ownerId: string;
  createdAt: string;
}

export interface LocalDeck {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface LocalFlashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
  createdAt: string;
}

export interface LocalSettings {
  userId: string;
  theme: string;
  fontSize: string;
  compactView: boolean;
  streamResponses: boolean;
  autoTitle: boolean;
  contextLimit: number;
  usageWarningThreshold: number;
  language: string;
  customSystemPrompt?: string;
  geminiApiKey?: string;
  defaultModel?: string;
  temperature?: number;
}

export function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("chats")) {
        const store = db.createObjectStore("chats", { keyPath: "id" });
        store.createIndex("ownerId", "ownerId", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("messages")) {
        const store = db.createObjectStore("messages", { keyPath: "id" });
        store.createIndex("chatId", "chatId", { unique: false });
      }
      if (!db.objectStoreNames.contains("tasks")) {
        const store = db.createObjectStore("tasks", { keyPath: "id" });
        store.createIndex("ownerId", "ownerId", { unique: false });
      }
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("agents")) {
        db.createObjectStore("agents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cards")) {
        const store = db.createObjectStore("cards", { keyPath: "id" });
        store.createIndex("deckId", "deckId", { unique: false });
      }
      if (!db.objectStoreNames.contains("studyGroups")) {
        db.createObjectStore("studyGroups", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains("usageLogs")) {
        db.createObjectStore("usageLogs", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic IndexedDB Helper Functions
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as T) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putItem<T>(storeName: string, item: T): Promise<T> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteById(storeName: string, id: string): Promise<void> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Initialize default local user and sample agent if database is empty
export async function seedDefaultLocalData(): Promise<void> {
  try {
    const users = await getAll<LocalUser>("users");
    if (users.length === 0) {
      const defaultUser: LocalUser = {
        id: "local-user",
        email: "user@local.app",
        name: "Local User",
        createdAt: new Date().toISOString(),
        defaultModel: "gemini-2.0-flash",
      };
      await putItem("users", defaultUser);
    }

    const agents = await getAll<LocalAgent>("agents");
    if (agents.length === 0) {
      const defaultAgent: LocalAgent = {
        id: "agent-study-buddy",
        name: "Study Buddy",
        systemPrompt: "You are a helpful study assistant. Help the user learn, summarize notes, create quizzes, and explain complex topics simply.",
        defaultModel: "gemini-2.0-flash",
        ownerId: "local-user",
        createdAt: new Date().toISOString(),
      };
      await putItem("agents", defaultAgent);
    }

    const settings = await getById<LocalSettings>("settings", "local-user");
    if (!settings) {
      await putItem("settings", {
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
      });
    }
  } catch (err) {
    console.error("Failed to seed default local data:", err);
  }
}
