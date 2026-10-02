const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file === "route.ts") {
      results.push(fullPath);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, "..", "app", "api");
const routeFiles = walkDir(apiDir);

routeFiles.forEach((filePath) => {
  let stub = `import { NextResponse } from "next/server";\n\nexport const dynamic = "force-static";\n\n`;

  if (filePath.includes("[cardId]")) {
    stub += `export async function generateStaticParams() { return [{ id: 'default', cardId: 'default' }]; }\n\n`;
  } else if (filePath.includes("[userId]")) {
    stub += `export async function generateStaticParams() { return [{ id: 'default', userId: 'default' }]; }\n\n`;
  } else if (filePath.includes("[...path]")) {
    stub += `export async function generateStaticParams() { return [{ path: ['default'] }]; }\n\n`;
  } else if (filePath.includes("[...nextauth]")) {
    stub += `export async function generateStaticParams() { return [{ nextauth: ['session'] }]; }\n\n`;
  } else if (filePath.includes("[id]")) {
    stub += `export async function generateStaticParams() { return [{ id: 'default' }]; }\n\n`;
  }

  stub += `export async function GET() { return NextResponse.json({ ok: true, localMode: true }); }\n`;
  stub += `export async function POST() { return NextResponse.json({ ok: true, localMode: true }); }\n`;
  stub += `export async function PUT() { return NextResponse.json({ ok: true, localMode: true }); }\n`;
  stub += `export async function PATCH() { return NextResponse.json({ ok: true, localMode: true }); }\n`;
  stub += `export async function DELETE() { return NextResponse.json({ ok: true, localMode: true }); }\n`;

  fs.writeFileSync(filePath, stub, "utf8");
  console.log("Stubbed API route for static export:", path.relative(process.cwd(), filePath));
});
