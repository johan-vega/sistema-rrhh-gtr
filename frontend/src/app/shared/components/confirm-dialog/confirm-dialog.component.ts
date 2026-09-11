import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onDismiss()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" [attr.aria-label]="title()">
        <div class="modal-header">
          <h3>{{ title() }}</h3>
        </div>
        <div class="modal-body">
          <p style="color: var(--color-text-secondary); line-height: 1.6;">{{ message() }}</p>
          @if (inputLabel()) {
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">
                {{ inputLabel() }} <span class="required">*</span>
              </label>
              <textarea
                class="form-control"
                [placeholder]="inputPlaceholder()"
                [(ngModel)]="inputValue"
                rows="3"
              ></textarea>
            </div>
          }
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" (click)="onDismiss()">
            {{ cancelLabel() }}
          </button>
          <button
            class="btn"
            [class]="confirmClass()"
            type="button"
            (click)="onConfirm()"
            [disabled]="!!inputLabel() && !inputValue.trim()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title         = input<string>('Confirmar acción');
  message       = input<string>('¿Estás seguro de continuar?');
  confirmLabel  = input<string>('Confirmar');
  cancelLabel   = input<string>('Cancelar');
  confirmClass  = input<string>('btn-danger');
  inputLabel    = input<string>('');
  inputPlaceholder = input<string>('Escribe aquí...');

  confirmed = output<string | undefined>();
  dismissed = output<void>();

  inputValue = '';

  onConfirm(): void {
    this.confirmed.emit(this.inputValue || undefined);
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
