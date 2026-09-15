import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RequestService } from './request.service';

describe('RequestService', () => {
  let service: RequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RequestService],
    });
    service = TestBed.inject(RequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the selected category and all fields alongside a mobile attachment', () => {
    const image = new File(['imagen'], 'justificacion.jpg', { type: 'image/jpeg' });

    service.create({
      category_id: 4,
      start_date: '2026-09-14',
      end_date: '2026-09-14',
      reason: 'Justificación por una falta médica.',
      document: image,
    }).subscribe();

    const request = http.expectOne('http://localhost:8000/api/requests');
    const form = request.request.body as FormData;

    expect(request.request.method).toBe('POST');
    const encodedMetadata = form.get('_request_metadata') as string | null;
    expect(encodedMetadata).toBeTruthy();
    const base64 = encodedMetadata!.replaceAll('-', '+').replaceAll('_', '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(paddedBase64);
    const decodedMetadata = new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
    expect(JSON.parse(decodedMetadata)).toEqual({
      category_id: 4,
      start_date: '2026-09-14',
      end_date: '2026-09-14',
      reason: 'Justificación por una falta médica.',
    });
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('category_id')).toBe('4');
    expect(form.get('start_date')).toBe('2026-09-14');
    expect(form.get('end_date')).toBe('2026-09-14');
    expect(form.get('reason')).toBe('Justificación por una falta médica.');
    expect(form.get('documents[]')).toBe(image);

    request.flush({
      success: true,
      message: 'OK',
      data: {
        id: 1,
        category: { id: 4, name: 'Justificación de falta', requires_document: true, minimum_notice_days: 0, active: true },
        start_date: '2026-09-14',
        end_date: '2026-09-14',
        reason: 'Justificación por una falta médica.',
        status: 'PENDIENTE',
        requested_at: '2026-09-14T12:00:00Z',
      },
    });
  });
});
