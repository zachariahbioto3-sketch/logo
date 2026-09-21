import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const LogoN = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 52,156 C 45,156 40,148 43,138 L 76,52 C 79,43 89,38 98,42 C 106,45 109,55 106,64 L 75,148 C 73,153 68,156 62,156 L 52,156 Z" />
    <path d="M 88,48 C 112,24 148,22 170,40 C 192,58 190,92 168,124 C 142,160 102,178 126,182 C 142,185 165,168 180,148 C 183,143 190,143 194,147 C 198,152 197,159 191,166 C 172,192 144,202 120,198 C 84,192 130,150 152,114 C 170,86 168,64 154,52 C 138,38 112,42 94,62 C 90,66 84,66 80,62 C 77,57 82,51 88,48 Z" />
    <path d="M 126,112 C 122,104 128,94 137,94 C 144,94 150,99 154,107 L 178,156 C 182,164 175,174 165,174 C 158,174 152,169 148,160 L 126,112 Z" />
  </svg>
);

const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>;
const ChatIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
const FolderIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>;
const CheckIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const CardsIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>;
const AgentIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const LogoutIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const SendIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>;
const SettingsIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>;
const TrashIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const ClipIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>;

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [model, setModel] = useState("Nicole Pro");
  const [user, setUser] = useState<any>(null);

  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", system_prompt: "", default_model: "gemini-2.0-flash" });

  const [decks, setDecks] = useState<any[]>([]);
  const [activeDeck, setActiveDeck] = useState<any>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showDeckForm, setShowDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ front: "", back: "" });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentChatId, isGenerating]);

  useEffect(() => {
    api.get("/auth/me/").then(r => setUser(r.data)).catch(() => navigate("/login"));
    api.get("/chats/").then(r => setChats(r.data));
    api.get("/projects/").then(r => setProjects(r.data));
    api.get("/tasks/").then(r => setTasks(r.data));
    api.get("/agents/").then(r => setAgents(r.data));
    api.get("/decks/").then(r => setDecks(r.data));
  }, []);

  async function openChat(id: string) {
    setCurrentChatId(id);
    setActiveTab("chat");
    if (!messages[id]) {
      const res = await api.get(`/chats/${id}/`);
      setMessages(prev => ({ ...prev, [id]: res.data.messages }));
    }
  }

  async function newChat() {
    const res = await api.post("/chats/", { title: "Untitled Conversation" });
    setChats(prev => [res.data, ...prev]);
    setCurrentChatId(res.data.id);
    setMessages(prev => ({ ...prev, [res.data.id]: [] }));
    setActiveTab("chat");
  }

  async function deleteChat(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await api.delete(`/chats/${id}/`);
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (currentChatId === id) {
      setCurrentChatId(filtered[0]?.id ?? null);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!inputPrompt.trim() && !selectedFile) || !currentChatId || isGenerating) return;
    setIsGenerating(true);

    const formData = new FormData();
    formData.append("content", inputPrompt);
    formData.append("model", model);
    if (selectedFile) formData.append("file", selectedFile);
    if (selectedAgent) formData.append("agent_id", selectedAgent.id);

    const optimisticUser = {
      id: Date.now().toString(), role: "user", content: inputPrompt,
      attachment_name: selectedFile?.name ?? null
    };
    setMessages(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []), optimisticUser] }));
    setInputPrompt("");
    setSelectedFile(null);

    const streamingId = `streaming-${Date.now()}`;
    setMessages(prev => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []).filter(m => m.id !== optimisticUser.id), optimisticUser, { id: streamingId, role: "assistant", content: "" }]
    }));

    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`http://127.0.0.1:8000/api/chats/${currentChatId}/send/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.chunk) {
            setMessages(prev => ({
              ...prev,
              [currentChatId]: (prev[currentChatId] || []).map(m =>
                m.id === streamingId ? { ...m, content: m.content + data.chunk } : m
              )
            }));
          }
          if (data.done) {
            setMessages(prev => ({
              ...prev,
              [currentChatId]: (prev[currentChatId] || []).map(m =>
                m.id === streamingId ? data.ai_message : m
              )
            }));
            setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: data.chat_title } : c));
          }
        }
      }
    } catch (err) {
      const errMsg = { id: Date.now().toString(), role: "assistant", content: "Error getting response. Check your Gemini API key." };
      setMessages(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []).filter(m => m.id !== streamingId), errMsg] }));
    }
    setIsGenerating(false);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const res = await api.post("/tasks/", { title: newTaskInput.trim(), status: "todo" });
    setTasks(prev => [...prev, res.data]);
    setNewTaskInput("");
  }

  async function toggleTask(task: any) {
    const next = task.status === "done" ? "todo" : "done";
    await api.patch(`/tasks/${task.id}/`, { status: next });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  }

  async function deleteTask(id: number) {
    await api.delete(`/tasks/${id}/`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    const res = await api.post("/agents/", agentForm);
    setAgents(prev => [...prev, res.data]);
    setAgentForm({ name: "", system_prompt: "", default_model: "gemini-2.0-flash" });
    setShowAgentForm(false);
  }

  async function deleteAgent(id: number) {
    await api.delete(`/agents/${id}/`);
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgent?.id === id) setSelectedAgent(null);
  }

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const res = await api.post("/decks/", { name: newDeckName.trim() });
    setDecks(prev => [...prev, res.data]);
    setNewDeckName("");
    setShowDeckForm(false);
    setActiveDeck(res.data);
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDeck || !cardForm.front || !cardForm.back) return;
    const res = await api.post("/flashcards/", { ...cardForm, deck: activeDeck.id });
    const updated = decks.map(d => d.id === activeDeck.id ? { ...d, cards: [...(d.cards || []), res.data] } : d);
    setDecks(updated);
    setActiveDeck(updated.find(d => d.id === activeDeck.id));
    setCardForm({ front: "", back: "" });
    setShowCardForm(false);
  }

  const currentMessages = currentChatId ? (messages[currentChatId] || []) : [];
  const allCards = activeDeck?.cards || [];

  const navItems = [
    { id: "projects", label: "Projects", icon: <FolderIcon /> },
    { id: "tasks", label: "Tasks", icon: <CheckIcon /> },
    { id: "flashcards", label: "Flashcards", icon: <CardsIcon /> },
    { id: "agents", label: "Agents", icon: <AgentIcon /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <div className="flex h-screen bg-black text-zinc-100 antialiased overflow-hidden selection:bg-white selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .font-serif-classy { font-family: 'Playfair Display', Georgia, serif; }
        .font-sans-classy { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 9999px; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="flex flex-col h-full w-72 bg-zinc-950 border-r border-zinc-800/80 font-sans-classy flex-shrink-0">
        <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-white"><LogoN className="w-6 h-6 text-black" /></div>
          <div>
            <h1 className="font-serif-classy font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Nicole
              <span className="font-sans-classy text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">AI</span>
            </h1>
            <p className="text-xs text-zinc-400 font-light mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Agent selector */}
        {agents.length > 0 && (
          <div className="px-4 pt-3">
            <select value={selectedAgent?.id || ""} onChange={e => setSelectedAgent(agents.find(a => a.id === Number(e.target.value)) || null)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none">
              <option value="">No Agent (Default)</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <div className="p-4">
          <button onClick={newChat} className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
            <PlusIcon /><span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.25em] px-3 mb-2">Recent Conversations</div>
          {chats.map(chat => (
            <div key={chat.id} onClick={() => openChat(chat.id)}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${currentChatId === chat.id && activeTab === "chat" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}>
              <div className="flex items-center gap-2.5 truncate"><ChatIcon /><span className="truncate">{chat.title}</span></div>
              <button onClick={e => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-white hover:bg-zinc-700 rounded-md transition-all"><TrashIcon /></button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-zinc-800/80 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${activeTab === item.id ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
          <button onClick={() => { localStorage.clear(); navigate("/login"); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">
            <LogoutIcon /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full bg-black overflow-hidden font-sans-classy">
        <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-6 bg-zinc-950/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black bg-white px-3 py-1 rounded-full">{activeTab}</span>
            <h2 className="font-serif-classy italic text-lg text-zinc-200 hidden sm:block">
              {activeTab === "chat" && (chats.find(c => c.id === currentChatId)?.title || "AI Workspace")}
              {activeTab === "projects" && "Workspaces & Projects"}
              {activeTab === "tasks" && "Action Items"}
              {activeTab === "flashcards" && "Flashcard Study Decks"}
              {activeTab === "agents" && "AI Agents"}
              {activeTab === "settings" && "System Preferences"}
            </h2>
          </div>
          <div className="relative inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-1">
            {["Nicole Pro", "Nicole Flash"].map(m => (
              <button key={m} onClick={() => setModel(m)}
                className={`px-3.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold transition-all ${model === m ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                {m}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">

          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
                      <LogoN className="w-10 h-10 text-black" />
                    </div>
                    <h3 className="text-2xl font-serif-classy text-white">
                      {currentChatId ? "Send a message to start" : "Create or select a chat"}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light max-w-sm">
                      {selectedAgent ? `Agent: ${selectedAgent.name}` : "Nicole AI — elegant, intelligent, and refined."}
                    </p>
                    {currentChatId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                        {["Design a monochrome dashboard layout", "Generate flashcards for typography rules", "Break down project into tasks", "Write a Python data processing script"].map((p, i) => (
                          <button key={i} onClick={() => setInputPrompt(p)}
                            className="p-4 text-left rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-300 font-light tracking-wide transition-all">
                            "{p}"
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-6 w-full">
                    {currentMessages.map((msg: any) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                            <LogoN className="w-5 h-5 text-black" />
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-white text-black font-medium rounded-br-none" : "bg-zinc-950 border border-zinc-800/80 text-zinc-200 font-light rounded-bl-none"}`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachment_name && (
                            <div className="mt-2 text-xs px-3 py-1.5 bg-zinc-800 rounded-lg text-zinc-300 inline-flex items-center gap-1">
                              <ClipIcon />{msg.attachment_name}
                            </div>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-[10px] uppercase font-bold tracking-widest">YOU</div>
                        )}
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                          <LogoN className="w-5 h-5 text-black animate-pulse" />
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-1.5">
                          {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800/80 bg-zinc-950">
                {selectedFile && (
                  <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-2 rounded-lg">
                    <ClipIcon /><span>{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="ml-auto text-zinc-500 hover:text-white"><TrashIcon /></button>
                  </div>
                )}
                <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-center gap-2">
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
                    <ClipIcon />
                  </button>
                  <input value={inputPrompt} onChange={e => setInputPrompt(e.target.value)}
                    placeholder={currentChatId ? "Type a message..." : "Create a chat first"}
                    disabled={!currentChatId}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-white text-white placeholder-zinc-500 text-xs font-light outline-none transition-all disabled:opacity-40" />
                  <button type="submit" disabled={(!inputPrompt.trim() && !selectedFile) || isGenerating || !currentChatId}
                    className="py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-all active:scale-95">
                    <span>Send</span><SendIcon />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full custom-scrollbar space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
                <div>
                  <h3 className="text-2xl font-serif-classy text-white">Workspaces & Projects</h3>
                  <p className="text-zinc-400 text-xs font-light mt-1">Organize your AI workflows.</p>
                </div>
                <button onClick={async () => {
                  const name = prompt("Project name:");
                  if (!name) return;
                  const res = await api.post("/projects/", { name });
                  setProjects(prev => [...prev, res.data]);
                }} className="px-4 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition shadow-md hover:bg-zinc-200">
                  <PlusIcon /><span>New Project</span>
                </button>
              </div>
              {projects.length === 0
                ? <p className="text-zinc-500 text-sm text-center mt-20">No projects yet.</p>
                : <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {projects.map(p => (
                      <div key={p.id} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3">
                        <h4 className="font-serif-classy text-white text-lg">{p.name}</h4>
                        <p className="text-zinc-500 text-xs">Created {new Date(p.created_at).toLocaleDateString()}</p>
                        <button onClick={async () => {
                          const res = await api.post("/chats/", { title: `${p.name} — Chat`, project: p.id });
                          setChats(prev => [res.data, ...prev]);
                          setCurrentChatId(res.data.id);
                          setMessages(prev => ({ ...prev, [res.data.id]: [] }));
                          setActiveTab("chat");
                        }} className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition">
                          Open Chat →
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full custom-scrollbar space-y-8">
              <div className="border-b border-zinc-800/80 pb-5">
                <h3 className="text-2xl font-serif-classy text-white">Action Items</h3>
                <p className="text-zinc-400 text-xs font-light mt-1">Track your deliverables.</p>
              </div>
              <form onSubmit={addTask} className="flex gap-2">
                <input value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs font-light outline-none focus:border-white transition-all" />
                <button type="submit" className="px-5 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-xs uppercase tracking-wider">Add</button>
              </form>
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${task.status === "done" ? "bg-zinc-950 border-zinc-900 text-zinc-600" : "bg-zinc-950 border-zinc-800/80 text-zinc-200 hover:border-zinc-700"}`}>
                    <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => toggleTask(task)}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${task.status === "done" ? "bg-white border-white text-black" : "border-zinc-700"}`}>
                        {task.status === "done" && <CheckIcon />}
                      </div>
                      <span className={`text-xs font-light tracking-wide ${task.status === "done" ? "line-through" : ""}`}>{task.title}</span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 transition p-1"><TrashIcon /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AGENTS TAB */}
          {activeTab === "agents" && (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full custom-scrollbar space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
                <div>
                  <h3 className="text-2xl font-serif-classy text-white">AI Agents</h3>
                  <p className="text-zinc-400 text-xs font-light mt-1">Custom AI personas with unique system prompts.</p>
                </div>
                <button onClick={() => setShowAgentForm(!showAgentForm)}
                  className="px-4 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold flex items-center gap-2 hover:bg-zinc-200 transition shadow-md">
                  <PlusIcon /><span>New Agent</span>
                </button>
              </div>

              {showAgentForm && (
                <form onSubmit={createAgent} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h4 className="font-serif-classy text-white text-lg">Create Agent</h4>
                  <input value={agentForm.name} onChange={e => setAgentForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Agent name (e.g. Code Reviewer)"
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs outline-none focus:border-white transition-all" />
                  <textarea value={agentForm.system_prompt} onChange={e => setAgentForm(p => ({ ...p, system_prompt: e.target.value }))}
                    placeholder="System prompt (e.g. You are an expert code reviewer...)"
                    rows={4}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs outline-none focus:border-white transition-all resize-none" />
                  <div className="flex gap-3">
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold hover:bg-zinc-200 transition">Create</button>
                    <button type="button" onClick={() => setShowAgentForm(false)} className="px-5 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider font-semibold hover:text-white transition">Cancel</button>
                  </div>
                </form>
              )}

              {agents.length === 0 && !showAgentForm
                ? <p className="text-zinc-500 text-sm text-center mt-20">No agents yet. Create one above.</p>
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {agents.map(agent => (
                      <div key={agent.id} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-serif-classy text-white text-lg">{agent.name}</h4>
                          <button onClick={() => deleteAgent(agent.id)} className="text-zinc-600 hover:text-red-400 transition p-1"><TrashIcon /></button>
                        </div>
                        <p className="text-zinc-400 text-xs font-light line-clamp-3">{agent.system_prompt}</p>
                        <button onClick={() => { setSelectedAgent(agent); setActiveTab("chat"); }}
                          className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition">
                          Use this agent →
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === "flashcards" && (
            <div className="flex-1 overflow-y-auto p-8 w-full custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
                  <div>
                    <h3 className="text-2xl font-serif-classy text-white">Flashcard Decks</h3>
                    <p className="text-zinc-400 text-xs font-light mt-1">Study smarter with spaced repetition cards.</p>
                  </div>
                  <button onClick={() => setShowDeckForm(!showDeckForm)}
                    className="px-4 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold flex items-center gap-2 hover:bg-zinc-200 transition shadow-md">
                    <PlusIcon /><span>New Deck</span>
                  </button>
                </div>

                {showDeckForm && (
                  <form onSubmit={createDeck} className="flex gap-2">
                    <input value={newDeckName} onChange={e => setNewDeckName(e.target.value)}
                      placeholder="Deck name..."
                      className="flex-1 py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs outline-none focus:border-white transition-all" />
                    <button type="submit" className="px-5 py-3 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition">Create</button>
                  </form>
                )}

                {/* Deck list */}
                <div className="flex gap-3 flex-wrap">
                  {decks.map(d => (
                    <button key={d.id} onClick={() => { setActiveDeck(d); setCurrentCardIndex(0); setCardFlipped(false); }}
                      className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${activeDeck?.id === d.id ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"}`}>
                      {d.name} ({d.cards?.length || 0})
                    </button>
                  ))}
                </div>

                {activeDeck && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-classy text-white text-xl">{activeDeck.name}</h4>
                      <button onClick={() => setShowCardForm(!showCardForm)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs uppercase tracking-wider font-semibold hover:bg-zinc-800 transition flex items-center gap-2">
                        <PlusIcon /><span>Add Card</span>
                      </button>
                    </div>

                    {showCardForm && (
                      <form onSubmit={createCard} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <input value={cardForm.front} onChange={e => setCardForm(p => ({ ...p, front: e.target.value }))}
                          placeholder="Front (question)..."
                          className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs outline-none focus:border-white transition-all" />
                        <input value={cardForm.back} onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))}
                          placeholder="Back (answer)..."
                          className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs outline-none focus:border-white transition-all" />
                        <div className="flex gap-3">
                          <button type="submit" className="px-5 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold hover:bg-zinc-200 transition">Add Card</button>
                          <button type="button" onClick={() => setShowCardForm(false)} className="px-5 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs uppercase font-semibold hover:text-white transition">Cancel</button>
                        </div>
                      </form>
                    )}

                    {allCards.length === 0
                      ? <p className="text-zinc-500 text-sm text-center py-10">No cards yet. Add one above.</p>
                      : <div className="flex flex-col items-center space-y-6">
                          <div onClick={() => setCardFlipped(!cardFlipped)}
                            className="w-full max-w-lg h-64 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 p-8 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl transition-all hover:scale-[1.01]">
                            <div className="w-full flex justify-between text-[10px] text-zinc-500 tracking-widest uppercase">
                              <span className="text-white font-semibold">Card {currentCardIndex + 1} of {allCards.length}</span>
                              <span>{cardFlipped ? "Answer" : "Question"}</span>
                            </div>
                            <p className={`text-base leading-relaxed ${cardFlipped ? "font-sans-classy font-light text-zinc-200 text-sm" : "font-serif-classy text-white"}`}>
                              {cardFlipped ? allCards[currentCardIndex]?.back : allCards[currentCardIndex]?.front}
                            </p>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                              {cardFlipped ? "Click to show question" : "Click to flip"}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => { setCardFlipped(false); setCurrentCardIndex(p => p > 0 ? p - 1 : allCards.length - 1); }}
                              className="px-5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs uppercase tracking-wider font-semibold transition">Previous</button>
                            <button onClick={() => { setCardFlipped(false); setCurrentCardIndex(p => p < allCards.length - 1 ? p + 1 : 0); }}
                              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs uppercase tracking-wider font-semibold shadow-md transition">Next</button>
                          </div>
                        </div>
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full custom-scrollbar space-y-8">
              <div className="border-b border-zinc-800/80 pb-5">
                <h3 className="text-2xl font-serif-classy text-white">System Settings</h3>
                <p className="text-zinc-400 text-xs font-light mt-1">Configure workspace preferences.</p>
              </div>
              <div className="space-y-5 bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80">
                {[
                  { label: "Classy Editorial Typography", desc: "Playfair Display headers & Plus Jakarta body" },
                  { label: "Monochrome High Contrast", desc: "Pure black & crisp white design tokens" },
                  { label: "Local Database Persistence", desc: "All data saved to your local SQLite database" },
                ].map((s, i, arr) => (
                  <div key={i} className={`flex items-center justify-between ${i < arr.length - 1 ? "pb-4 border-b border-zinc-900" : ""}`}>
                    <div>
                      <h4 className="font-serif-classy text-white text-base">{s.label}</h4>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">{s.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-white" />
                  </div>
                ))}
              </div>
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
                <h4 className="font-serif-classy text-white text-base">Account</h4>
                <div className="text-xs text-zinc-400 space-y-1">
                  <p><span className="text-zinc-500">Email:</span> {user?.email}</p>
                  <p><span className="text-zinc-500">Name:</span> {user?.name || "—"}</p>
                </div>
                <button onClick={() => { localStorage.clear(); navigate("/login"); }}
                  className="px-5 py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-semibold hover:bg-zinc-200 transition shadow-md">
                  Sign Out
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

