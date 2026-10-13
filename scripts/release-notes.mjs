// Prints the CHANGELOG section for the version in package.json (heading line first, without "## ").
// Exits 1 if the section is missing or empty, so CI catches a version bump without release notes.
// Usage: node scripts/release-notes.mjs [--title] [--version X.Y.Z] [--list]
//   --title    print only the heading text      --version  another CHANGELOG version (default: package.json)
//   --list     print every semver version that has a CHANGELOG section, oldest first
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const args = process.argv.slice(2);
const lines = readFileSync(new URL("CHANGELOG.md", root), "utf8").split("\n");
if (args.includes("--list")) {
  const vs = lines.map((l) => (l.match(/^## (\d+\.\d+\.\d+)\b/) || [])[1]).filter(Boolean).reverse();
  process.stdout.write(vs.join("\n") + "\n");
  process.exit(0);
}
const vi = args.indexOf("--version");
const version = vi >= 0 ? args[vi + 1] : JSON.parse(readFileSync(new URL("package.json", root), "utf8")).version;

const start = lines.findIndex((l) => l.startsWith(`## ${version} `) || l === `## ${version}`);
if (start < 0) {
  console.error(`CHANGELOG.md has no "## ${version}" section for package.json version ${version}.`);
  process.exit(1);
}
let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
if (end < 0) end = lines.length;

const title = lines[start].slice(3).trim();
const body = lines.slice(start + 1, end).join("\n").trim();
if (!body) {
  console.error(`CHANGELOG.md section "${title}" is empty.`);
  process.exit(1);
}
process.stdout.write(args.includes("--title") ? title + "\n" : body + "\n");
