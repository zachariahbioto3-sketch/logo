import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [owned, memberships] = await Promise.all([
    prisma.company.findMany({
      where: { ownerId: session.user.id },
      include: { _count: { select: { members: true } }, members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupMembership.findMany({
      where: { userId: session.user.id, group: { ownerId: { not: session.user.id } } },
      include: {
        group: {
          include: { _count: { select: { members: true } }, members: { include: { user: { select: { id: true, name: true, email: true } } } } },
        },
      },
    }),
  ]);

  const joined = memberships.map((m) => m.group);
  return NextResponse.json({ owned, joined });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const group = await prisma.company.create({
    data: {
      name: name.trim(),
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json(group);
}