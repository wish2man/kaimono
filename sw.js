// かいもの帳 PWA の Service Worker。
// 役割は「インストール可能にする」ことと「外枠（このフォルダのファイル）を手元に置いて起動を速くする」こと。
// 買い物リスト本体（Apps Script 側）の通信には一切手を出さない。
// ファイルを更新したら VERSION を上げる（古いキャッシュが消えて新しい外枠に入れ替わる）。
const VERSION = "kaimono-shell-v3";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // 別オリジン（script.google.com など）は素通し
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // ページ本体はネット優先（更新をすぐ反映）、つながらなければキャッシュ
  if (req.mode === "navigate") {
    // GitHub Pages は10分キャッシュさせるので、no-cache で毎回サーバーに更新確認する
    e.respondWith(fetch(req, { cache: "no-cache" }).catch(() => caches.match("index.html")));
    return;
  }
  // アイコン等はキャッシュ優先
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
