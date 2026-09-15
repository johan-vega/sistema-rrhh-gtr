// Prueba el manejador REAL del Angular Service Worker instalado (sin modificar node_modules).
// Ejecutar: node scripts/upload-worker.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function loadWorker() {
  const source = readFileSync(new URL('../node_modules/@angular/service-worker/ngsw-worker.js', import.meta.url), 'utf8');
  const bootstrap = 'new Driver(scope, adapter, new CacheDatabase(adapter));';
  assert.equal(source.split(bootstrap).length, 2, 'Revisar el arnés si cambia el bootstrap de Angular SW');
  const handlers = new Map();
  const scope = {
    registration: { scope: 'https://frontend.example/', active: null },
    caches: { open: async () => ({}) },
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  // Solo expone la instancia dentro de esta VM de pruebas; el guard onFetch no se altera.
  runInNewContext(source.replace(bootstrap, 'self.testDriver = ' + bootstrap), {
    self: scope, URL, Request, Response, Headers, setTimeout, clearTimeout,
  });
  let forwards = 0;
  scope.testDriver.handleFetch = () => { forwards++; return Promise.resolve(new Response('OK')); };
  return {
    fetch: handlers.get('fetch'),
    forwarded: () => forwards,
  };
}

for (const query of ['', '?ngsw-bypass=true']) {
  test(`POST multipart ${query || 'sin bypass'}: control del manejador Angular`, () => {
    const worker = loadWorker();
    const form = new FormData();
    form.append('category_id', '4');
    form.append('documents[]', new Blob(['documento'], { type: 'image/jpeg' }), 'foto.jpg');
    let intercepted = 0;
    worker.fetch({
      request: new Request('https://backend.example/api/requests' + query, { method: 'POST', body: form }),
      respondWith: () => { intercepted++; },
    });
    assert.equal(intercepted, query ? 0 : 1);
    assert.equal(worker.forwarded(), query ? 0 : 1);
  });
}

test('GET de recursos sigue siendo gestionado por la PWA', () => {
  const worker = loadWorker();
  let intercepted = 0;
  worker.fetch({
    request: new Request('https://frontend.example/main.js'),
    respondWith: () => { intercepted++; },
  });
  assert.equal(intercepted, 1);
});
