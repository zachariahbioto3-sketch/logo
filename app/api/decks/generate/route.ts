import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ai } from "@/lib/ai";
import { DEFAULT_MODEL } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId, deckId } = await req.json();
  if (!chatId || !deckId) return NextResponse.json({ error: "chatId and deckId required" }, { status: 400 });

  const [chat, deck] = await Promise.all([
    prisma.chat.findFirst({
      where: { id: chatId, ownerId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
    }),
    prisma.deck.findFirst({ where: { id: deckId, ownerId: session.user.id } }),
  ]);

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  const transcript = chat.messages
    .map((m) => (m.role === "user" ? "Student: " : "Nicole: ") + m.content)
    .join("\n\n");

  const prompt = "You are a medical education expert. Given this study conversation, generate 5 to 10 high-quality flashcards that capture the key facts, concepts, and clinical pearls discussed. Return ONLY a JSON array, no markdown, no explanation. Each item must have front and back string fields. Example: [{\"front\": \"What is...\", \"back\": \"It is...\"}]\n\nConversation:\n" + transcript;

  try {
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = result.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const cards: { front: string; back: string }[] = JSON.parse(clean);

    if (!Array.isArray(cards)) throw new Error("Not an array");

    const created = await prisma.flashcard.createMany({
      data: cards
        .filter((c) => c.front?.trim() && c.back?.trim())
        .map((c) => ({ front: c.front.trim(), back: c.back.trim(), deckId })),
    });

    return NextResponse.json({ created: created.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate cards" }, { status: 500 });
  }
}
