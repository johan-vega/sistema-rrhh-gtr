// Comprueba bytes reales por HTTP hasta el parser multipart de PHP, sin datos de producción.
// Ejecutar desde frontend: node scripts/upload-http.test.mjs (requiere php en PATH).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('multipart de 2.4 MB conserva campos Unicode, nombre y SHA-256 al llegar a PHP', async () => {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const server = spawn(process.env.PHP_BINARY || 'php', [
    '-d', 'upload_max_filesize=12M', '-d', 'post_max_size=14M',
    '-S', `127.0.0.1:${port}`,
    fileURLToPath(new URL('../../backend/tests/Fixtures/multipart-probe.php', import.meta.url)),
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('PHP no inició en 10 segundos')), 10000);
      server.once('error', error => { clearTimeout(timeout); reject(error); });
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`PHP terminó: ${code}`)); });
      server.stderr.on('data', data => {
        if (data.toString().includes('Development Server')) { clearTimeout(timeout); resolve(); }
      });
    });
    const fields = {
      category_id: '4', start_date: '2026-09-14', end_date: '2026-09-14',
      reason: 'Justificación médica con acentos: áéíóú y ñ.',
    };
    const bytes = Buffer.alloc(2458 * 1024);
    // PNG mínimo válido con relleno para reproducir el tamaño de una foto móvil.
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64').copy(bytes);
    const picked = new File([bytes], 'sustento-médico.png', { type: 'image/png' });
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    form.append('documents[]', new Blob([await picked.arrayBuffer()], { type: picked.type }), picked.name);
    const result = await fetch(`http://127.0.0.1:${port}/api/requests?ngsw-bypass=true`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(10000),
    });
    assert.equal(result.status, 200);
    const parsed = await result.json();
    assert.deepEqual(parsed.fields, fields);
    assert.equal(parsed.bypass, 'true');
    assert.match(parsed.content_type, /^multipart\/form-data; boundary=/);
    assert.ok(parsed.content_length > bytes.length);
    assert.deepEqual(parsed.document, {
      name: picked.name, size: bytes.length, error: 0,
      sha256: createHash('sha256').update(bytes).digest('hex'), mime: 'image/png',
    });

    const withoutDocument = new FormData();
    for (const [key, value] of Object.entries(fields)) withoutDocument.append(key, value);
    const plain = await fetch(`http://127.0.0.1:${port}/api/requests?ngsw-bypass=true`, {
      method: 'POST', body: withoutDocument, signal: AbortSignal.timeout(10000),
    });
    const parsedPlain = await plain.json();
    assert.deepEqual(parsedPlain.fields, fields);
    assert.equal(parsedPlain.document, null);
  } finally {
    if (server.pid && server.exitCode === null && server.signalCode === null) {
      const exit = once(server, 'exit');
      server.kill();
      await exit;
    }
  }
});
