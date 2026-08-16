import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

function sm2(card: { interval: number; easeFactor: number; repetitions: number }, rating: number) {
  let { interval, easeFactor, repetitions } = card;

  if (rating === 0) {
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    const easeBonus = rating === 3 ? 0 : rating === 2 ? -0.15 : 0.1;
    easeFactor = Math.max(1.3, easeFactor + easeBonus);
    repetitions += 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { interval, easeFactor, repetitions, nextReview };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; cardId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const { rating } = await req.json();
  if (typeof rating !== "number" || rating < 0 || rating > 3) {
    return NextResponse.json({ error: "Rating must be 0-3" }, { status: 400 });
  }

  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, deck: { ownerId: session.user.id } },
  });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const updates = sm2(card, rating);
  const updated = await prisma.flashcard.update({ where: { id: cardId }, data: updates });
  return NextResponse.json(updated);
}