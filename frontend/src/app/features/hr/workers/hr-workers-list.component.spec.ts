import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { HrWorkersListComponent } from './hr-workers-list.component';

describe('Trabajadores: paginación y búsqueda en servidor', () => {
  let fixture: ComponentFixture<HrWorkersListComponent>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/hr/workers`;
  const worker = (id: number) => ({ id, first_name: 'Ana', last_name: `Pérez ${id}`, dni: String(id), active: true, has_photo: false });
  const response = (page: number, total = 39) => ({
    success: true, message: 'OK', meta: { page, total, per_page: 20 },
    data: Array.from({ length: Math.min(20, Math.max(0, total - (page - 1) * 20)) }, (_, i) => worker((page - 1) * 20 + i + 1)),
  });
  const waitForQuery = () => new Promise(resolve => setTimeout(resolve, 330));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HrWorkersListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HrWorkersListComponent);
    fixture.autoDetectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  it('muestra los 39 trabajadores en dos páginas sin duplicarlos y permite volver', async () => {
    const first = http.expectOne(req => req.url === url && req.params.get('page') === '1');
    first.flush(response(1));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.worker-card')).toHaveLength(20);
    expect(el.querySelector('.results-count')?.textContent).toContain('1–20 de 39');
    expect(el.querySelector<HTMLButtonElement>('.previous')!.disabled).toBe(true);
    el.querySelector<HTMLButtonElement>('.next')!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne(req => req.url === url && req.params.get('page') === '2').flush(response(2));
    await fixture.whenStable();
    expect(el.querySelectorAll('.worker-card')).toHaveLength(19);
    expect(el.querySelector('.results-count')?.textContent).toContain('21–39 de 39');
    expect(el.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
    expect(fixture.componentInstance.workers()[0].id).toBe(21);
    el.querySelector<HTMLButtonElement>('.previous')!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne(req => req.url === url && req.params.get('page') === '1').flush(response(1));
    await fixture.whenStable();
    expect(fixture.componentInstance.workers()[0].id).toBe(1);
  });

  it('reinicia la página, busca fuera de los primeros 20 y cancela consultas antiguas', async () => {
    const initial = http.expectOne(req => req.url === url);
    initial.flush(response(2));
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Pérez 39';
    input.dispatchEvent(new Event('input'));
    await waitForQuery();
    const old = http.expectOne(req => req.url === url && req.params.get('search') === 'Pérez 39' && req.params.get('page') === '1');
    input.value = 'Producción';
    input.dispatchEvent(new Event('input'));
    expect(old.cancelled).toBe(true);
    await waitForQuery();
    http.expectOne(req => req.url === url && req.params.get('search') === 'Producción').flush({
      ...response(1, 1), data: [worker(39)],
    });
    await fixture.whenStable();
    // No volver a filtrar localmente por área: el servidor ya filtró los resultados.
    expect(fixture.nativeElement.querySelectorAll('.worker-card')).toHaveLength(1);
    expect(fixture.componentInstance.workers()[0].id).toBe(39);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await waitForQuery();
    http.expectOne(req => req.url === url && req.params.get('search') === '').flush(response(1));
    await fixture.whenStable();
    expect(fixture.componentInstance.total()).toBe(39);
  });

  it('muestra errores con reintento y resultados vacíos sin quedarse cargando', async () => {
    http.expectOne(req => req.url === url).flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.componentInstance.loading()).toBe(false);
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne(req => req.url === url).flush(response(1, 0));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron trabajadores');
    expect(fixture.nativeElement.textContent).toContain('0–0 de 0');
    expect(fixture.nativeElement.querySelector('.next').disabled).toBe(true);
  });
});
