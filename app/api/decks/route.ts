import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.deck.findMany({
    where: { ownerId: session.user.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(decks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const deck = await prisma.deck.create({
    data: { name: name.trim(), ownerId: session.user.id },
  });
  return NextResponse.json(deck);
}