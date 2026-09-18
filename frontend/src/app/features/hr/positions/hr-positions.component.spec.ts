import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ApiResponse, Position } from '../../../core/models';
import { HrPositionService } from '../../../core/services/hr-area-position.service';
import { HrPositionsComponent } from './hr-positions.component';

const response = <T>(data: T): ApiResponse<T> => ({ success: true, message: 'OK', data });

describe('Cargos: actualización automática del estado', () => {
  const service = { getAll: vi.fn(), toggleStatus: vi.fn(), create: vi.fn() };
  let result: Subject<ApiResponse<Position>>;

  beforeEach(() => {
    vi.resetAllMocks();
    result = new Subject<ApiResponse<Position>>();
    service.getAll.mockReturnValue(of(response([{ id: 1, name: 'Operario', active: false }])));
    service.toggleStatus.mockReturnValue(result);
    TestBed.configureTestingModule({
      imports: [HrPositionsComponent],
      providers: [provideZonelessChangeDetection(), { provide: HrPositionService, useValue: service }],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(HrPositionsComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it.each([false, true])('refleja la respuesta asíncrona sin escribir ni recargar (activo inicial: %s)', async active => {
    const original = { id: 1, name: 'Operario', active };
    service.getAll.mockReturnValue(of(response([original])));
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector<HTMLButtonElement>('.toggle')!;
    button.click();
    // Terminar la detección disparada por el clic ANTES de simular la respuesta HTTP.
    await fixture.whenStable();
    expect(service.toggleStatus).toHaveBeenCalledWith(1, !active);
    result.next(response({ id: 1, name: 'Operario', active: !active }));
    result.complete();
    await fixture.whenStable(); // Sin detectChanges() ni otro evento del usuario.
    expect(element.querySelector('.status-badge')?.textContent?.trim()).toBe(active ? 'Inactivo' : 'Activo');
    expect(element.querySelector('.toggle')?.textContent?.trim()).toBe(active ? 'Activar' : 'Desactivar');
    expect(original.active).toBe(active);
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('usa el estado confirmado por la API y conserva el nombre del cargo', async () => {
    const fixture = await render();
    fixture.componentInstance.toggleStatus(fixture.componentInstance.positions()[0]);
    result.next(response({ id: 1, name: '', active: false }));
    result.complete();
    await fixture.whenStable();
    expect(fixture.componentInstance.positions()[0]).toEqual({ id: 1, name: 'Operario', active: false });
  });

  it('mantiene inactivo el cargo nuevo si ese es el estado devuelto por el backend', async () => {
    service.getAll.mockReturnValue(of(response([])));
    const fixture = await render();
    const created = new Subject<ApiResponse<Position>>();
    service.create.mockReturnValue(created);
    fixture.componentInstance.positionName = 'Nuevo cargo';
    fixture.componentInstance.savePosition();
    created.next(response({ id: 2, name: 'Nuevo cargo', active: false }));
    created.complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.status-badge')?.textContent.trim()).toBe('Inactivo');
    expect(fixture.nativeElement.querySelector('.toggle')?.textContent.trim()).toBe('Activar');
  });
});
