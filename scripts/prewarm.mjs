/**
 * Pre-warm script: visits all pages to trigger Next.js compilation
 * so the first user visit is fast.
 *
 * Run after the dev server starts (after logging in once).
 */
const BASE = "http://localhost:3000";

async function prewarm() {
  // Login first to get a session cookie
  console.log("Logging in...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "inspector@edgeinspect.ai",
      password: "inspect2026",
    }),
  });
  if (!loginRes.ok) {
    console.log("Login failed, warming public pages only");
  } else {
    try { await loginRes.json(); } catch {}
  }
  const setCookie = loginRes.headers.get("set-cookie");
  const cookie = setCookie?.split(";")[0] ?? "";

  console.log("Pre-warming pages...");
  const PAGES = [
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/live-inspection",
    "/image-upload",
    "/reports",
    "/analytics",
    "/maintenance",
    "/settings",
  ];

  for (const page of PAGES) {
    try {
      const start = Date.now();
      const headers = cookie ? { Cookie: cookie } : {};
      const res = await fetch(`${BASE}${page}`, { headers });
      const ms = Date.now() - start;
      console.log(`  ${page.padEnd(22)} ${res.status} in ${ms}ms`);
    } catch (e) {
      console.log(`  ${page.padEnd(22)} SKIP (${e.message})`);
    }
  }
  console.log("Pre-warm complete!");
}

prewarm().catch(console.error);