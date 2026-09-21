import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { groupId: id, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const agents = await prisma.agent.findMany({
    where: { companyId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.company.findFirst({ where: { id, ownerId: session.user.id } });
  if (!group) return NextResponse.json({ error: "Only the owner can add shared agents" }, { status: 403 });

  const { name, systemPrompt, defaultModel } = await req.json();
  if (!name?.trim() || !systemPrompt?.trim()) return NextResponse.json({ error: "Name and prompt required" }, { status: 400 });

  const agent = await prisma.agent.create({
    data: {
      name: name.trim(),
      systemPrompt: systemPrompt.trim(),
      defaultModel: defaultModel || "gemini-3.6-flash",
      ownerId: session.user.id,
      companyId: id,
    },
  });
  return NextResponse.json(agent);
}