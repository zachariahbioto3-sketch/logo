import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { DEFAULT_MODEL, ALLOWED_MODELS } from "@/lib/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await prisma.agent.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, systemPrompt, defaultModel } = await req.json();
  if (!name || !systemPrompt) {
    return NextResponse.json({ error: "Name and system prompt required" }, { status: 400 });
  }

  if (defaultModel && !ALLOWED_MODELS.has(defaultModel)) {
    return NextResponse.json({ error: "Invalid model selected" }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: {
      name,
      systemPrompt,
      defaultModel: defaultModel || DEFAULT_MODEL,
      ownerId: session.user.id,
    },
  });
  return NextResponse.json(agent);
}
