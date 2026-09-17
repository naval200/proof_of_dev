#!/usr/bin/env node
/**
 * Hard-stop for this disclosure archive.
 * Refuses npm install / run when malware package names are present,
 * and always exits non-zero so this repo cannot be "just run".
 */
import { existsSync, readFileSync } from "fs";

const BLOCKED = [
  "animatecss-tailwind-adapter",
  "@aaron205whitmore/postcss-animate-utils",
];

const FILES = [
  "package.json",
  "package-lock.json",
  "apps/web/package.json",
  "apps/web/package-lock.json",
];

console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  INSTALL / RUN DISABLED — SECURITY DISCLOSURE ARCHIVE            ║
║                                                                  ║
║  This repository documents a supply-chain malware campaign.      ║
║  Do NOT run npm install or npm run dev.                          ║
║                                                                  ║
║  Never install:                                                  ║
║    - animatecss-tailwind-adapter                                 ║
║    - @aaron205whitmore/postcss-animate-utils                     ║
║                                                                  ║
║  Read README.md and investigation/ instead.                      ║
╚══════════════════════════════════════════════════════════════════╝
`);

const hits = [];
for (const file of FILES) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const name of BLOCKED) {
    if (text.includes(`"${name}"`) || text.includes(`node_modules/${name}`)) {
      hits.push(`${name} referenced in ${file}`);
    }
  }
}

for (const name of BLOCKED) {
  const path = name.startsWith("@")
    ? `node_modules/${name}`
    : `node_modules/${name}`;
  if (existsSync(path)) hits.push(`${name} present at ${path}`);
}

if (hits.length) {
  console.error("Blocked references / installs detected:");
  for (const h of hits) console.error("  -", h);
}

process.exit(1);
