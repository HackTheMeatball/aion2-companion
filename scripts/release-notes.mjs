// Prints the CHANGELOG section for the version in package.json (heading line first, without "## ").
// Exits 1 if the section is missing or breaks the format below, so CI catches a version bump without proper notes.
// Usage: node scripts/release-notes.mjs [--title] [--version X.Y.Z] [--list] [--check-all]
//   --title    print the release title ("X.Y.Z — summary")   --version  another CHANGELOG version (default: package.json)
//   --list     print every semver version that has a CHANGELOG section, oldest first
//   --check-all  only check the format (every mode but --list checks every semver section)
//
// Format of a semver section (entries before 0.1.0, "## vNNN", are exempt):
//   ## X.Y.Z — YYYY-MM-DD
//   <blank>
//   One-line summary ending in a period (<= 80 characters).
//   then "### " headings, each with "- " bullets (continuation lines indented two spaces), only from SECTIONS, in
//   that order, each at most once; "### Saved progress" always present.
import { readFileSync } from "node:fs";

export const SECTIONS = ["Added", "Changed", "Fixed", "Data", "Accessibility", "Removed", "Action required",
  "Known issues", "Saved progress"];

// Returns a list of problems for one section (lines without its "## " heading line included as lines[0]).
export function checkSection(lines) {
  const errs = [];
  const head = lines[0];
  if (!/^## \d+\.\d+\.\d+ — \d{4}-\d{2}-\d{2}$/.test(head)) errs.push(`heading must be "## X.Y.Z — YYYY-MM-DD": ${head}`);
  const body = lines.slice(1);
  while (body.length && body[body.length - 1] === "") body.pop();
  if (body[0] !== "") errs.push("blank line expected after the heading");
  const summary = body[1] || "";
  if (!summary || /^[#\-\s]/.test(summary) || !summary.endsWith(".") || summary.length > 80)
    errs.push(`second line must be a one-line summary ending in "." (<= 80 chars): ${summary}`);
  if (body[2] !== "") errs.push("blank line expected after the summary");
  let last = -1, cur = null, bullets = 0;
  const seen = new Set();
  const close = () => { if (cur && !bullets) errs.push(`"### ${cur}" has no bullets`); };
  for (const l of body.slice(3)) {
    if (l.startsWith("### ")) {
      close();
      cur = l.slice(4); bullets = 0;
      const i = SECTIONS.indexOf(cur);
      if (i < 0) errs.push(`unknown heading "### ${cur}" (allowed: ${SECTIONS.join(", ")})`);
      else if (seen.has(cur)) errs.push(`"### ${cur}" appears twice`);
      else if (i < last) errs.push(`"### ${cur}" is out of order (order: ${SECTIONS.join(", ")})`);
      seen.add(cur); if (i >= 0) last = Math.max(last, i);
    } else if (l.startsWith("- ")) {
      if (!cur) errs.push(`bullet before any "### " heading: ${l}`);
      bullets++;
    } else if (l.startsWith("  ") && bullets) {
      // continuation of the previous bullet
    } else if (l !== "") errs.push(`unexpected line (use "- " bullets under "### " headings): ${l}`);
  }
  close();
  if (!seen.has("Saved progress")) errs.push('"### Saved progress" is required');
  return errs;
}

const root = new URL("..", import.meta.url);
const args = process.argv.slice(2);
const lines = readFileSync(new URL("CHANGELOG.md", root), "utf8").split("\n");
const semver = (l) => (l.match(/^## (\d+\.\d+\.\d+)\b/) || [])[1];
const sectionOf = (start) => {
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines.slice(start, end < 0 ? lines.length : end);
};
// Every mode except --list checks the whole file, so CI's early "release notes" step catches a bad entry anywhere.
if (!args.includes("--list")) {
  let bad = 0;
  lines.forEach((l, i) => {
    if (!semver(l)) return;
    for (const e of checkSection(sectionOf(i))) { console.error(`CHANGELOG ${semver(l)}: ${e}`); bad++; }
  });
  if (bad) process.exit(1);
  if (args.includes("--check-all")) process.exit(0);
}
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
const section = sectionOf(start);
const summary = section[2].replace(/\.$/, "");
const body = section.slice(1).join("\n").trim();
process.stdout.write(args.includes("--title") ? `${version} — ${summary}\n` : body + "\n");
