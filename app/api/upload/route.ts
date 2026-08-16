import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getUploadDir, getUploadPath, getUploadUrl } from "@/lib/uploads";

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED[file.type]) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const ext = ALLOWED[file.type];
  const filename = randomUUID() + "." + ext;
  const dir = getUploadDir(session.user.id);

  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(getUploadPath(session.user.id, filename), buffer);

  return NextResponse.json({
    url: getUploadUrl(session.user.id, filename),
    type: file.type,
    name: file.name,
  });
}