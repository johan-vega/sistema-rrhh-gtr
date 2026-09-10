import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-wrapper" [class.fullpage]="fullPage()">
      <div class="spinner spinner-lg" role="status" aria-label="Cargando..."></div>
      @if (message()) {
        <p class="spinner-msg">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: var(--color-accent);

      &.fullpage {
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(2px);
        z-index: var(--z-overlay);
      }
    }
    .spinner-msg {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
  `],
})
export class LoadingSpinnerComponent {
  fullPage = input<boolean>(false);
  message  = input<string>('');
}

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon() }}</div>
      <h3 class="empty-title">{{ title() }}</h3>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      gap: 0.75rem;
    }
    .empty-icon { font-size: 3rem; opacity: 0.5; }
    .empty-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
    }
    .empty-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      max-width: 280px;
    }
  `],
})
export class EmptyStateComponent {
  icon     = input<string>('📭');
  title    = input<string>('Sin resultados');
  subtitle = input<string>('');
}
