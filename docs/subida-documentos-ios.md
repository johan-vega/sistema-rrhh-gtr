# Envío de documentos desde iPhone: diagnóstico y corrección

## Qué se encontró

El formulario enviaba directamente el `File` del selector dentro de `FormData`. La aplicación registra Angular Service Worker en producción. Su código instalado intercepta también POST aunque no los almacene en caché.

Existe un [reporte abierto de WebKit](https://bugs.webkit.org/show_bug.cgi?id=319985) sobre cuerpos vacíos al subir archivos respaldados por disco. Es compatible con los síntomas observados, pero no confirma por sí solo lo ocurrido en el teléfono del usuario. No se dispone aquí de una reproducción en un iPhone físico.

Cambiar el texto de validación, duplicar campos dentro del mismo cuerpo o recibir un 401 en una prueba sin autenticación no demuestra que el documento haya llegado. Las pruebas anteriores no verificaban ese punto.

## Cambio implementado

- `RequestService` lee el adjunto mediante `FileReader.readAsArrayBuffer`, comprueba su longitud y adjunta un nuevo `Blob` de bytes en memoria, conservando el nombre y tipo. No envía el `File` temporal original.
- El POST usa `/api/requests?ngsw-bypass=true`. Es el mecanismo de [exclusión documentado por Angular](https://angular.dev/ecosystem/service-workers/devops#bypassing-the-service-worker). No requiere modificar el SW instalado ni añadir cabeceras CORS.
- Se mantienen token Sanctum, campos habituales y `documents[]`. El navegador genera `Content-Type` y su boundary.
- El selector de archivos permanece montado al mostrar la vista previa; se puede quitar y volver a elegir el mismo archivo.
- Se bloquean el doble envío y los cambios del adjunto durante su lectura/subida. Los fallos de lectura conservan el formulario y no producen una llamada HTTP.
- Archivos vacíos o mayores de 10 MiB se rechazan antes de enviarse. La copia en memoria no comprime ni convierte HEIC: las validaciones del backend siguen vigentes.
- Se retiró el envío de `_request_metadata`; el backend aún lo acepta para compatibilidad con versiones antiguas.
- Un multipart que llega sin campos ni archivos devuelve 400 con `code: EMPTY_MULTIPART`, sin guardar solicitudes. Un campo realmente faltante sigue devolviendo 422; un documento obligatorio sigue siendo obligatorio.

No se cambian diseño, dependencias, credenciales, base de datos ni reglas de aprobación.

## Publicación conjunta

Estos cambios se pueden publicar en un solo push, aunque Vercel y Northflank terminen en momentos distintos. El frontend usa el contrato existente del backend; el cambio del backend añade diagnóstico y conserva compatibilidad. No hay migraciones nuevas ni un orden obligatorio de despliegue.

Los cambios locales NO han sido publicados por el asistente.

Para comprobar después del despliegue:

1. Confirmar que Vercel y Northflank muestran el commit que contiene estos cambios, no solo estado Ready/Running.
2. Si la PWA conserva una versión previa, abrir [la entrada sin intercepción del SW](https://sistema-rrhh-gtr.vercel.app/?ngsw-bypass=true). El parámetro permite pedir el documento inicial a la red; no borra la sesión.
3. En el iPhone afectado, elegir una categoría de justificación, fechas dentro del límite configurado y una foto desde Fotos. Enviar y comprobar tanto el detalle de la solicitud como la descarga del adjunto en RRHH.
4. Repetir con un PDF desde Archivos, y una categoría que permita no adjuntar documento. Comprobar también quitar/volver a seleccionar el mismo archivo y rechazar uno mayor de 10 MiB.
5. Si persiste: registrar versión de iOS/navegador, tamaño/tipo del archivo, commit desplegado, estado HTTP y código de respuesta. Verificar que la URL del POST contiene `ngsw-bypass=true`. No compartir tokens, contraseñas ni el contenido de documentos laborales.

Un 201 confirma creación; un 401 solo indica autenticación y NO confirma recepción de campos o archivos.

## Pruebas reproducibles

Desde `frontend`:

```powershell
npm.cmd run test -- --watch=false
node scripts/upload-worker.test.mjs
node scripts/upload-http.test.mjs
npm.cmd run build
```

Desde `backend`:

```powershell
php artisan test
```

Resultados locales de esta corrección:

- Angular: 18 pruebas pasan. Incluyen bytes completos de adjuntos de 2,4 MiB (JPG/PDF/HEIC/nombre JPEG sin MIME), autenticación, exclusión del SW, lectura fallida/interrumpida/truncada, tamaño inválido, selección de categoría, quitar/reseleccionar y doble envío. Los archivos de estas pruebas de transporte son sintéticos; no prueban el decodificador de imágenes.
- Service Worker: 3 pruebas pasan. Ejecutan el manejador del paquete instalado dentro de una VM: el POST normal se intercepta, el POST con bypass no y los GET siguen gestionados por la PWA.
- HTTP/PHP: 1 prueba pasa, con dos envíos reales al parser PHP en localhost (con/sin archivo). El adjunto PNG de 2,4 MiB llega con igual SHA-256, nombre, campos Unicode, MIME y tamaño. El servidor temporal se cierra al terminar. La sonda no carga Laravel ni toca DB o producción.
- Laravel: 29 pruebas / 95 aserciones pasan con SQLite de pruebas. Incluyen creación, validación de documentos, rechazo de cuerpo vacío, compatibilidad, acceso por roles y descarga autorizada.
- Compilación de producción: correcta.

Estas capas verifican el código y transporte local; no sustituyen una prueba en el iPhone afectado ni una validación autenticada contra el despliegue real.
