import { join } from "path";

export function getUploadDir(userId: string): string {
  const base =
    process.env.UPLOADS_DIR ||
    join(process.cwd(), "public", "uploads");
  return join(base, userId);
}

export function getUploadPath(userId: string, filename: string): string {
  return join(getUploadDir(userId), filename);
}

export function getUploadUrl(userId: string, filename: string): string {
  if (process.env.UPLOADS_DIR) {
    return `/api/uploads/${userId}/${filename}`;
  }
  return `/uploads/${userId}/${filename}`;
}

export function urlToFilePath(url: string): string {
  if (url.startsWith("/api/uploads/")) {
    const relative = url.replace("/api/uploads/", "");
    const base = process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads");
    return join(base, relative);
  }
  return join(process.cwd(), "public", url);
}