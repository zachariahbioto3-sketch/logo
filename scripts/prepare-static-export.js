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
    } else if (file === "route.ts" || file === "page.tsx") {
      results.push(fullPath);
    }
  });
  return results;
}

const appDir = path.join(__dirname, "..", "app");
const files = walkDir(appDir);

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");

  if (filePath.includes("[id]") && !content.includes("generateStaticParams")) {
    content = content + `\n\nexport async function generateStaticParams() { return [{ id: 'default' }]; }\n`;
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Added generateStaticParams:", path.relative(process.cwd(), filePath));
  }
});
