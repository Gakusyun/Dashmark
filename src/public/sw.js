const CACHE_NAME = "dashmark-v1",
  URLS_TO_CACHE = ["/", "/index.html"];
(self.addEventListener("install", (e) => {
  (e.waitUntil(caches.open(CACHE_NAME).then((e) => e.addAll(URLS_TO_CACHE))),
    self.skipWaiting());
}),
  self.addEventListener(
    "activate",
    (e) => (
      e.waitUntil(
        caches.keys().then((e) =>
          Promise.all(
            e.map((e) => {
              if (e !== CACHE_NAME) return caches.delete(e);
            }),
          ),
        ),
      ),
      self.clients.claim()
    ),
  ),
  self.addEventListener("fetch", (e) => {
    const { request: t } = e;
    new URL(t.url).origin === self.location.origin &&
      e.respondWith(
        fetch(t)
          .then((e) => {
            if (!e || 200 !== e.status || "basic" !== e.type) return e;
            const a = e.clone();
            return (
              caches.open(CACHE_NAME).then((e) => {
                e.put(t, a);
              }),
              e
            );
          })
          .catch(() =>
            caches.match(t).then(
              (e) =>
                e ||
                ("navigate" === t.mode
                  ? caches.match("/index.html")
                  : new Response("离线模式下无缓存内容", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({ "Content-Type": "text/plain" }),
                  })),
            ),
          ),
      );
  }),
  self.addEventListener("message", (e) => {
    (e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting(),
      e.data &&
      "CLEAR_CACHE" === e.data.type &&
      e.waitUntil(
        caches
          .keys()
          .then((e) => Promise.all(e.map((e) => caches.delete(e)))),
      ));
  }));
