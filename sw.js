const CACHE_VERSION = "triptracker-v1";
const CACHE_ASSETS = ["./","./index.html","./manifest.json","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable.png"];

self.addEventListener("install",(e)=>{
  e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.addAll(CACHE_ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",(e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",(e)=>{
  const url=new URL(e.request.url);
  if(url.hostname.includes("firestore.googleapis.com")||url.hostname.includes("firebase")||url.hostname.includes("gstatic.com")) return;
  if(e.request.mode==="navigate"||url.pathname.endsWith(".html")||url.pathname.endsWith(".js")||url.pathname.endsWith(".json")){
    e.respondWith(fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE_VERSION).then(ca=>ca.put(e.request,c));return res;}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE_VERSION).then(ca=>ca.put(e.request,c));return res;})));
});
