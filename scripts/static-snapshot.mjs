// Crawls a running instance of the site and writes a static snapshot for design previews
// (e.g. on Surge). Server features (cart, checkout, login, admin, APIs) do not work in the
// snapshot. Usage: node scripts/static-snapshot.mjs http://localhost:3000 out-dir

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const outDir = process.argv[3] || "snapshot";

// Pages that only make sense with a server (auth, private, dynamic) are excluded.
const SKIP = /^\/(api|admin|account|checkout|cart|order-success|auth\/confirm|auth\/reset-password|search)(\/|$|\?)/;

const SEEDS = ["/", "/auth/login", "/auth/register", "/auth/forgot-password"];
const pages = new Set(SEEDS);
const queue = [...SEEDS];
const assets = new Set();

function pagePath(path) {
  return path === "/" ? "index.html" : join(path.replace(/^\//, ""), "index.html");
}

async function save(relative, body) {
  const file = join(outDir, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body);
}

function rewriteImages(html) {
  // /_next/image?url=%2Fbrand%2Flogo.png&w=..  ->  /brand/logo.png (static hosts cannot resize)
  return html.replace(/\/_next\/image\?url=([^&"'\s]+)[^"'\s,]*/g, (_m, url) => {
    const decoded = decodeURIComponent(url.replace(/&amp;/g, "&"));
    if (decoded.startsWith("/")) assets.add(decoded);
    return decoded;
  });
}

while (queue.length) {
  const path = queue.shift();
  const response = await fetch(base + path, { redirect: "manual" });
  if (response.status !== 200) {
    console.warn(`skip ${path} (${response.status})`);
    continue;
  }
  let html = rewriteImages(await response.text());
  for (const [, rawHref] of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const href = rawHref.split("?")[0];
    if (href.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(href)) {
      assets.add(href);
      continue;
    }
    const clean = href.replace(/\/$/, "") || "/";
    if (!pages.has(clean) && !SKIP.test(clean)) {
      pages.add(clean);
      queue.push(clean);
    }
  }
  for (const [, src] of html.matchAll(/(?:src|srcSet|srcset)="([^"]+)"/g)) {
    for (const part of src.split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith("/")) assets.add(url.split("?")[0]);
    }
  }
  for (const [, url] of html.matchAll(/"(\/_next\/static\/[^"\\]+)"/g)) assets.add(url);
  await save(pagePath(path), html);
  console.log(`page  ${path}`);
}

// Not-found page, served by static hosts for unknown paths (Surge: 404.html).
{
  const response = await fetch(base + "/__snapshot-not-found__");
  const html = rewriteImages(await response.text());
  for (const [, url] of html.matchAll(/"(\/_next\/static\/[^"\\]+)"/g)) assets.add(url);
  await save("404.html", html);
}

// CSS files reference fonts and other files.
const fetched = new Set();
const assetQueue = [...assets];
while (assetQueue.length) {
  const url = assetQueue.shift();
  if (fetched.has(url)) continue;
  fetched.add(url);
  const response = await fetch(base + url);
  if (!response.ok) {
    console.warn(`asset missing ${url} (${response.status})`);
    continue;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (url.endsWith(".css")) {
    for (const [, ref] of buffer.toString("utf8").matchAll(/url\((\/_next\/[^)]+)\)/g)) assetQueue.push(ref.replace(/["']/g, ""));
  }
  await save(url.replace(/^\//, ""), buffer);
}
console.log(`\n${pages.size} pages, ${fetched.size} assets -> ${outDir}`);
