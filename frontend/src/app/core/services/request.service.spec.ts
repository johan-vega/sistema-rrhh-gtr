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
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('category_id')).toBe('4');
    expect(form.get('start_date')).toBe('2026-09-14');
    expect(form.get('end_date')).toBe('2026-09-14');
    expect(form.get('reason')).toBe('Justificación por una falta médica.');
    expect(form.get('documents[]')).toBe(image);

    request.flush({ success: true, message: 'OK', data: {} });
  });
});
