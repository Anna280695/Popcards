const CACHE = 'popcards-shell-v1';
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/', '/manifest.webmanifest', '/popcards-icon.svg'])));
 self.skipWaiting();
});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('popcards-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch', event => {
 const {request} = event;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin) return;
 event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response}).catch(()=>caches.match(request).then(found=>found||caches.match('/'))));
});
