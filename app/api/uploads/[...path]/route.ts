import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const base = process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads");
  const filePath = join(base, ...path);

  try {
    const file = await readFile(filePath);
    const ext = (path[path.length - 1].split(".").pop() || "").toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}