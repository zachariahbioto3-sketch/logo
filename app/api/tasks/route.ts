import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, projectId } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await prisma.task.create({
    data: { title, ownerId: session.user.id, projectId: projectId || null },
  });
  return NextResponse.json(task);
}
