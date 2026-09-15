import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RequestService } from './request.service';
import { StorageService } from './storage.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { environment } from '../../../environments/environment';

const url = `${environment.apiUrl}/requests?ngsw-bypass=true`;
const payload = {
  category_id: 4, start_date: '2026-09-14', end_date: '2026-09-14',
  reason: 'Justificación por una falta médica.',
};
const response = {
  success: true, message: 'OK', data: {
    id: 1, category: { id: 4, name: 'Justificación de falta', requires_document: true, minimum_notice_days: 0, active: true },
    ...payload, status: 'PENDIENTE', requested_at: '2026-09-14T12:00:00Z',
  },
};

function readBytes(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

describe('RequestService: transporte de solicitudes', () => {
  let service: RequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
        { provide: StorageService, useValue: { getToken: () => 'test-token', clear: vi.fn() } },
      ],
    });
    service = TestBed.inject(RequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  it.each([
    ['foto.jpg', 'image/jpeg'], ['sustento.pdf', 'application/pdf'],
    ['IMG_1234.HEIC', 'image/heic'], ['archivo.jpeg', ''],
  ])('envía todos los bytes de %s (2.4 MB) como copia en memoria y evita el SW', async (name, type) => {
    const bytes = new Uint8Array(2458 * 1024).map((_, index) => index % 251);
    const original = new File([bytes], name, { type });
    const result = firstValueFrom(service.create({ ...payload, document: original }));
    const request = await vi.waitFor(() => http.expectOne(url));
    const form = request.request.body as FormData;

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.headers.get('Accept')).toBe('application/json');
    // El navegador debe generar Content-Type con su boundary, sin cabeceras nuevas.
    expect(request.request.headers.has('Content-Type')).toBe(false);
    expect(request.request.headers.has('ngsw-bypass')).toBe(false);
    expect(form.get('_request_metadata')).toBeNull();
    expect(form.get('category_id')).toBe('4');
    expect(form.get('start_date')).toBe(payload.start_date);
    expect(form.get('end_date')).toBe(payload.end_date);
    expect(form.get('reason')).toBe(payload.reason);
    const attachment = form.get('documents[]') as File;
    expect(attachment).not.toBe(original);
    expect(attachment.name).toBe(name);
    expect(attachment.size).toBe(original.size);
    const uploadedBytes = new Uint8Array(await readBytes(attachment));
    expect(uploadedBytes.byteLength).toBe(bytes.byteLength);
    expect(uploadedBytes.every((byte, index) => byte === bytes[index])).toBe(true);
    request.flush(response);
    expect((await result).data.id).toBe(1);
  });

  it('permite enviar solicitudes sin adjunto sin depender de cambios del backend', async () => {
    const result = firstValueFrom(service.create(payload));
    const request = await vi.waitFor(() => http.expectOne(url));
    expect(request.request.body.get('documents[]')).toBeNull();
    expect(request.request.body.get('category_id')).toBe('4');
    request.flush(response);
    await result;
  });

  it.each(['error', 'abort', 'throw', 'truncated'])('no envía HTTP si falla la lectura del archivo (%s)', async failure => {
    vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) {
      if (failure === 'throw') throw new DOMException('NotReadableError');
      if (failure === 'truncated') {
        Object.defineProperty(this, 'result', { value: new ArrayBuffer(1) });
        this.dispatchEvent(new ProgressEvent('load'));
      } else {
        this.dispatchEvent(new ProgressEvent(failure));
      }
    });
    await expect(firstValueFrom(service.create({
      ...payload, document: new File(['documento'], 'foto.jpg', { type: 'image/jpeg' }),
    }))).rejects.toThrow('No se pudo leer el documento');
    http.expectNone(() => true);
  });

  it.each([0, 10 * 1024 * 1024 + 1])('rechaza tamaño inválido %i sin enviar HTTP', async size => {
    await expect(firstValueFrom(service.create({
      ...payload, document: new File([new Uint8Array(size)], 'foto.jpg'),
    }))).rejects.toThrow(size === 0 ? 'El archivo está vacío' : 'El archivo no debe superar 10 MB');
    http.expectNone(() => true);
  });
});
