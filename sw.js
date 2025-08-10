self.addEventListener('install', e=>{
  e.waitUntil(caches.open('ww-v1').then(c=>c.addAll([
    './','index.html','style.css','app.js','manifest.json',
    'assets/character.svg','assets/outfit_1.svg','assets/outfit_2.svg','assets/outfit_3.svg','assets/outfit_4.svg',
    'assets/icon-192.png','assets/icon-512.png'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(resp=>resp || fetch(e.request)));
});
