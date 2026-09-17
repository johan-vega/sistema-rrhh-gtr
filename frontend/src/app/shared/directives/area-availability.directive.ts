import { Directive, Input, OnChanges, forwardRef, inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of } from 'rxjs';
import { RequestCategory } from '../../core/models/index';
import { RequestAvailabilityService } from '../../core/services/request-availability.service';

@Directive({
  selector: '[appAreaAvailability]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AreaAvailabilityDirective), multi: true }],
})
export class AreaAvailabilityDirective implements AsyncValidator, OnChanges {
  @Input('appAreaAvailability') category: RequestCategory | null = null;
  @Input() availabilityStart: string | null = null;
  private availability = inject(RequestAvailabilityService);
  private changed = () => {};
  registerOnValidatorChange(fn: () => void): void { this.changed = fn; }
  ngOnChanges(): void { this.changed(); }
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const to = control.value as string;
    if (!this.category || this.category.is_absence || !to) return of(null);
    const from = this.availabilityStart || to;
    if (from > to) return of({ areaAvailability: 'La fecha final debe ser igual o posterior a la inicial.' });
    return this.availability.firstBlockedDate(from, to).pipe(
      map(date => date ? { areaAvailability: `La fecha ${date.split('-').reverse().join('/')} no está disponible porque el área alcanzó el límite de permisos.` } : null),
      catchError(() => of({ areaAvailability: 'No se pudo comprobar la disponibilidad. Cambia la fecha o vuelve a seleccionarla para reintentar.' })),
    );
  }
}
