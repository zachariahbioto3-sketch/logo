import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

  const agent = await prisma.agent.create({
    data: {
      name,
      systemPrompt,
      defaultModel: defaultModel || "claude-sonnet-4-6",
      ownerId: session.user.id,
    },
  });
  return NextResponse.json(agent);
}
