import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { LeaveRequest } from '../../../../core/models';
import { RequestService } from '../../../../core/services/request.service';
import { DocumentService } from '../../../../core/services/document.service';
import { WorkerRequestDetailComponent } from './worker-request-detail.component';

describe('Detalle del trabajador: comprobantes', () => {
  it('muestra todos los archivos y solicita el documento específico por el servicio autenticado', () => {
    const documents = [1, 2, 3].map(id => ({ id, original_name: `sustento-${id}.pdf`, download_url: `/api/requests/7/documents/${id}` }));
    const request: LeaveRequest = { id: 7, employee_id: 1, start_date: '2026-11-19', end_date: '2026-11-20',
      request_date: '2026-11-01', status: 'APPROVED', reason: 'Viaje familiar', documents,
      category: { id: 2, name: 'Vacaciones', requires_document: false, minimum_advance_days: 0, active: true } };
    const get = vi.fn(() => new Subject<Blob>());
    TestBed.configureTestingModule({ imports: [WorkerRequestDetailComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      { provide: RequestService, useValue: { getById: () => of({ success: true, data: request }) } },
      { provide: DocumentService, useValue: { get } },
    ] });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const fixture = TestBed.createComponent(WorkerRequestDetailComponent);
    fixture.detectChanges();
    for (const document of documents) expect(fixture.nativeElement.textContent).toContain(document.original_name);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.detail-row button')) as HTMLButtonElement[];
    expect(buttons).toHaveLength(6);
    buttons[2].click();
    expect(get).toHaveBeenLastCalledWith(documents[1].download_url);
    buttons[5].click();
    expect(get).toHaveBeenLastCalledWith(documents[2].download_url);
    open.mockRestore();
  });
});
