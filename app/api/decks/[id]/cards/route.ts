import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cards = await prisma.flashcard.findMany({
    where: { deckId: id, deck: { ownerId: session.user.id } },
    orderBy: { nextReview: "asc" },
  });
  return NextResponse.json(cards);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { front, back } = await req.json();
  if (!front?.trim() || !back?.trim()) return NextResponse.json({ error: "Front and back required" }, { status: 400 });

  const deck = await prisma.deck.findFirst({ where: { id, ownerId: session.user.id } });
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  const card = await prisma.flashcard.create({
    data: { front: front.trim(), back: back.trim(), deckId: id },
  });
  return NextResponse.json(card);
}