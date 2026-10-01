// Crawls a running instance of the site and writes a static snapshot for design previews
// (e.g. on Surge). Usage: node scripts/static-snapshot.mjs http://localhost:3000 out-dir

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const outDir = process.argv[3] || "snapshot";

const SKIP = /^\/(api|admin|auth\/confirm|auth\/reset-password)(\/|$|\?)/;

const SEEDS = [
  "/",
  "/books",
  "/books/target-police-general-studies-tslprb-tgpsc",
  "/cart",
  "/checkout",
  "/search",
  "/track-order",
  "/about",
  "/contact",
  "/faq",
  "/shipping-policy",
  "/returns",
  "/privacy-policy",
  "/terms",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/categories/tslprb",
  "/categories/tgpsc",
  "/categories/police-exams",
  "/categories/competitive-exams",
  "/categories/telangana-history",
  "/categories/telangana-movement",
  "/categories/indian-polity",
  "/categories/economy",
  "/categories/geography",
  "/categories/current-affairs",
  "/categories/science-technology",
  "/categories/telangana-culture",
];
const pages = new Set(SEEDS);
const queue = [...SEEDS];
const rawPages = new Map();
const cssUrls = new Set();
const images = new Set();

function pagePath(path) {
  return path === "/" ? "index.html" : join(path.replace(/^\//, ""), "index.html");
}

async function save(relative, body) {
  const file = join(outDir, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body);
}

function rewriteImages(html) {
  return html.replace(/\/_next\/image\?url=([^&"'\s]+)[^"'\s,]*/g, (_m, url) => {
    const decoded = decodeURIComponent(url.replace(/&amp;/g, "&"));
    if (decoded.startsWith("/")) images.add(decoded);
    return decoded;
  });
}

console.log(`Starting static snapshot generation from ${base} into ${outDir}...`);

while (queue.length) {
  const path = queue.shift();
  try {
    const response = await fetch(base + path, { redirect: "manual" });
    if (response.status !== 200) {
      console.warn(`skip ${path} (${response.status})`);
      continue;
    }
    let html = rewriteImages(await response.text());
    
    // Extract CSS links
    for (const [, href] of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)) {
      if (href.startsWith("/_next/")) cssUrls.add(href);
    }
    for (const [, href] of html.matchAll(/href=["'](\/_next\/static\/chunks\/[^"']+\.css)["']/gi)) {
      cssUrls.add(href);
    }

    // Extract images
    for (const [, src] of html.matchAll(/(?:src|srcSet|srcset)=["']([^"']+)["']/g)) {
      for (const part of src.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url.startsWith("/")) images.add(url.split("?")[0]);
      }
    }

    // Discover links
    for (const [, rawHref] of html.matchAll(/href=["'](\/[^"#]*)["']/g)) {
      const href = rawHref.split("?")[0];
      if (href.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(href)) {
        continue;
      }
      const clean = href.replace(/\/$/, "") || "/";
      if (!pages.has(clean) && !SKIP.test(clean)) {
        pages.add(clean);
        queue.push(clean);
      }
    }

    rawPages.set(path, html);
    console.log(`✓ page  ${path}`);
  } catch (err) {
    console.error(`Failed to fetch ${path}:`, err.message);
  }
}

// 1. Download and combine all CSS into /styles/main.css
let combinedCss = "";
const fontAssets = new Map();

for (const cssUrl of cssUrls) {
  try {
    const res = await fetch(base + cssUrl);
    if (!res.ok) continue;
    let cssText = await res.text();

    // Extract all url(...) in the CSS (e.g. fonts, media)
    for (const [, rawRef] of cssText.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      let fontUrl = rawRef.trim();
      if (fontUrl.startsWith("data:")) continue;

      let absoluteFetchUrl = "";
      let localRelativePath = "";

      if (fontUrl.startsWith("/_next/")) {
        absoluteFetchUrl = base + fontUrl;
        const filename = fontUrl.split("/").pop().split("?")[0];
        localRelativePath = "media/" + filename;
      } else if (fontUrl.startsWith("../media/")) {
        // e.g. /_next/static/media/af21ab248943f479-s.3gj6ciom31zjc.woff2
        const fontName = fontUrl.replace("../media/", "");
        absoluteFetchUrl = base + "/_next/static/media/" + fontName;
        localRelativePath = "media/" + fontName;
      } else {
        continue;
      }

      try {
        const fontRes = await fetch(absoluteFetchUrl);
        if (fontRes.ok) {
          const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
          fontAssets.set(localRelativePath, fontBuffer);
          // Rewrite URL in CSS to relative path inside /styles/
          cssText = cssText.replaceAll(rawRef, localRelativePath);
        }
      } catch (err) {
        console.warn(`Could not fetch font ${absoluteFetchUrl}:`, err.message);
      }
    }

    combinedCss += "\n" + cssText;
  } catch (err) {
    console.warn(`Could not fetch CSS ${cssUrl}:`, err.message);
  }
}

// Save fonts
for (const [relPath, buffer] of fontAssets.entries()) {
  await save("styles/" + relPath, buffer);
}

// Save consolidated CSS
await save("styles/main.css", combinedCss);
console.log(`✓ Consolidated CSS saved to styles/main.css (${Math.round(combinedCss.length / 1024)} KB, ${fontAssets.size} fonts)`);

// 2. Interactive Store Enhancement Script
const interactiveJs = `
// Aarohi Lava Publications - Static Preview Interactive Controller
(function() {
  function init() {
    // Mobile Navigation Toggle
    var menuButtons = document.querySelectorAll('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
    var mobileNav = document.querySelector('[data-mobile-nav], [aria-label="Mobile navigation"]');
    
    // Add to cart & Buy now feedback
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('button, a');
      if (!btn) return;
      var text = (btn.textContent || '').trim().toLowerCase();
      
      if (text.includes('add to cart')) {
        e.preventDefault();
        showToast('Target Police 360° added to cart!');
        updateCartBadge(1);
      } else if (text.includes('buy now')) {
        e.preventDefault();
        showToast('Redirecting to checkout...');
        setTimeout(function() { window.location.href = '/checkout'; }, 400);
      } else if (text.includes('explore catalog') || text.includes('view all books')) {
        // smooth navigation
      }
    });

    // Pincode Checker
    var pincodeInputs = document.querySelectorAll('input[placeholder*="pincode" i], input[id*="pincode" i]');
    pincodeInputs.forEach(function(input) {
      var form = input.closest('form') || input.parentElement;
      var button = form.querySelector('button');
      if (button) {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          var val = (input.value || '').trim();
          if (val.length === 6) {
            showToast('✓ Delivery available to ' + val + ' (2-4 business days via Express Courier)');
          } else {
            showToast('Please enter a valid 6-digit postal pincode.');
          }
        });
      }
    });

    // FAQ Accordions
    var faqDetails = document.querySelectorAll('details');
    faqDetails.forEach(function(d) {
      d.addEventListener('toggle', function() {
        if (d.open) {
          faqDetails.forEach(function(other) {
            if (other !== d && other.parentElement === d.parentElement) other.open = false;
          });
        }
      });
    });
  }

  function updateCartBadge(count) {
    var badges = document.querySelectorAll('[aria-label*="cart" i] span, .cart-count');
    badges.forEach(function(b) {
      if (/^\\d+$/.test(b.textContent.trim())) {
        b.textContent = count;
      }
    });
  }

  function showToast(msg) {
    var existing = document.getElementById('store-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'store-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#10214d;color:#fff;padding:12px 20px;border-radius:10px;font-family:sans-serif;font-size:14px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.15);animation:toastFadeIn 0.3s ease;';
    toast.innerHTML = '<span style="color:#eab308;font-size:18px;">⚡</span> ' + msg;
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
await save("scripts/store-interactive.js", interactiveJs);
console.log(`✓ Interactive enhancer script saved to scripts/store-interactive.js`);

// 3. Process and write clean HTML files
for (const [path, originalHtml] of rawPages.entries()) {
  let html = originalHtml;

  // Remove dev HMR / dev overlay script tags that error out on static CDN
  html = html.replace(/<script[^>]+src=["'][^"']*(?:hmr|devtools|react-refresh|react-server-dom-turbopack)[^"']*["'][^>]*><\/script>/gi, "");
  html = html.replace(/<link[^>]+rel=["']preload["'][^>]+as=["']script["'][^>]*>/gi, "");

  // Remove existing Next.js chunk stylesheet links and replace with our clean /styles/main.css
  html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");
  
  // Inject clean stylesheet link into <head>
  const stylesheetTag = '<link rel="stylesheet" href="/styles/main.css" />';
  if (html.includes("</head>")) {
    html = html.replace("</head>", `  ${stylesheetTag}\n</head>`);
  } else {
    html = stylesheetTag + "\n" + html;
  }

  // Inject interactive script before </body>
  const scriptTag = '<script src="/scripts/store-interactive.js" defer></script>';
  if (html.includes("</body>")) {
    html = html.replace("</body>", `  ${scriptTag}\n</body>`);
  } else {
    html += "\n" + scriptTag;
  }

  await save(pagePath(path), html);
}

// 4. Save 200.html (Surge SPA fallback) and 404.html
const homeHtml = rawPages.get("/") || "";
if (homeHtml) {
  let cleanHome = homeHtml.replace(/<script[^>]+src=["'][^"']*(?:hmr|devtools|react-refresh|react-server-dom-turbopack)[^"']*["'][^>]*><\/script>/gi, "");
  cleanHome = cleanHome.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");
  cleanHome = cleanHome.replace("</head>", '  <link rel="stylesheet" href="/styles/main.css" />\n</head>');
  cleanHome = cleanHome.replace("</body>", '  <script src="/scripts/store-interactive.js" defer></script>\n</body>');
  await save("200.html", cleanHome);
}

// 404 page
try {
  const notFoundRes = await fetch(base + "/__snapshot-not-found__");
  let notFoundHtml = rewriteImages(await notFoundRes.text());
  notFoundHtml = notFoundHtml.replace(/<script[^>]+src=["'][^"']*(?:hmr|devtools|react-refresh)[^"']*["'][^>]*><\/script>/gi, "");
  notFoundHtml = notFoundHtml.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");
  notFoundHtml = notFoundHtml.replace("</head>", '  <link rel="stylesheet" href="/styles/main.css" />\n</head>');
  await save("404.html", notFoundHtml);
} catch {
  // ignore
}

// 5. Download any remaining static image assets
for (const imgUrl of images) {
  try {
    const imgRes = await fetch(base + imgUrl);
    if (!imgRes.ok) continue;
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    await save(imgUrl.replace(/^\//, ""), imgBuffer);
  } catch {
    // ignore
  }
}

console.log(`\n🎉 Done! All ${rawPages.size} pages, clean styles, fonts, and scripts saved to '${outDir}'.`);
