/* MG Store — Service Worker للإشعارات */
const SHELL = "mg-shell-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  const opts = {
    body: d.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { kind: d.kind || "" }
  };
  if (d.tag) { opts.tag = d.tag; opts.renotify = true; }
  e.waitUntil(self.registration.showNotification(d.title || "MG Store", opts));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL("./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(target) && "focus" in c) return c.focus(); }
    return self.clients.openWindow(target);
  }));
});

// شبكة أولاً (دايماً أحدث نسخة)، ولو مفيش نت يفتح آخر نسخة محفوظة من الصفحة. طلبات السيرفر (Supabase) مش بنلمسها.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && req.mode === "navigate") { const copy = res.clone(); caches.open(SHELL).then(c => c.put("./", copy)); }
      return res;
    }).catch(() => caches.match(req).then(m => m || (req.mode === "navigate" ? caches.match("./") : null)).then(m => m || Response.error()))
  );
});
