import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrCategoryService } from '../../../core/services/hr-services';
import { RequestCategory } from '../../../core/models/index';

@Component({
  selector: 'app-hr-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categories-container">
      <div class="header-section">
        <h2>Categorías de Solicitud</h2>
        <p>Configura las reglas para Vacaciones, Salud, Licencias y Justificaciones.</p>
      </div>

      <div class="form-card">
        <h3>{{ editingCategory ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Nombre de Categoría *</label>
            <input type="text" [(ngModel)]="category.name" placeholder="Ej: Vacaciones" class="input-control" />
          </div>

          <div class="form-group">
            <label>Días Mínimos de Anticipación *</label>
            <input type="number" [(ngModel)]="category.minimum_advance_days" min="0" class="input-control" />
          </div>

          <div class="form-group full-width">
            <label>Descripción</label>
            <input type="text" [(ngModel)]="category.description" placeholder="Breve explicación de la categoría..." class="input-control" />
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="category.requires_document" />
              ¿Requiere Adjuntar Documento Obligatorio?
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="category.is_absence" />
              Clasificar como falta para topes y gráficas
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button (click)="saveCategory()" [disabled]="!category.name" class="btn-primary">
            {{ editingCategory ? 'Guardar Cambios' : 'Crear Categoría' }}
          </button>
          <button *ngIf="editingCategory" (click)="cancelEdit()" class="btn-secondary">Cancelar</button>
        </div>
      </div>

      <div class="categories-grid">
        <div *ngFor="let cat of categories()" class="cat-card">
          <div class="cat-header">
            <h4>{{ cat.name }}</h4>
            <span class="status-badge" [class.active]="cat.active" [class.inactive]="!cat.active">
              {{ cat.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <p class="cat-desc">{{ cat.description || 'Sin descripción' }}</p>

          <div class="cat-rules">
            <span class="rule-pill">
              Mín. {{ cat.minimum_advance_days }} días de anticipación
            </span>
            <span class="rule-pill" [class.req]="cat.requires_document">
              {{ cat.requires_document ? 'Documento Obligatorio' : 'Documento Opcional' }}
            </span>
          </div>

          <div class="cat-actions">
            <button (click)="startEdit(cat)" class="btn-edit">Editar</button>
            <button (click)="toggleStatus(cat)" class="btn-toggle">
              {{ cat.active ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .categories-container {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 1.25rem;
      h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
      p { color: #64748b; font-size: 0.88rem; margin: 0.2rem 0 0 0; }
    }
    .form-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0 0 1rem 0; }
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .full-width { grid-column: 1 / -1; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label { font-size: 0.8rem; font-weight: 700; color: #475569; }
    }
    .checkbox-group {
      grid-column: 1 / -1;
      margin-top: 0.3rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      cursor: pointer;
    }
    .input-control {
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      font-size: 0.88rem;
      outline: none;
      &:focus { border-color: var(--color-accent); }
    }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .btn-primary {
      background: var(--color-primary);
      color: #fff;
      border: none;
      padding: 0.65rem 1.2rem;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      &:disabled { opacity: 0.5; }
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: none;
      padding: 0.65rem 1rem;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .cat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      h4 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #1e293b; }
    }
    .status-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      &.active { background: #dcfce7; color: #166534; }
      &.inactive { background: #fee2e2; color: #991b1b; }
    }
    .cat-desc {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0 0 1rem 0;
    }
    .cat-rules {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .rule-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.7rem;
      border-radius: 8px;
      background: #f1f5f9;
      color: #334155;
      &.req { background: #fef3c7; color: #92400e; }
    }
    .cat-actions {
      display: flex;
      gap: 0.6rem;
    }
    .btn-edit {
      flex: 1;
      padding: 0.45rem;
      border-radius: 8px;
      background: var(--color-accent);
      color: #fff;
      border: none;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-toggle {
      padding: 0.45rem 0.8rem;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
    }
  `]
})
export class HrCategoriesComponent implements OnInit {
  private categoryService = inject(HrCategoryService);

  categories = signal<RequestCategory[]>([]);
  editingCategory: RequestCategory | null = null;

  category: Partial<RequestCategory> = {
    name: '',
    description: '',
    requires_document: false,
    is_absence: false,
    minimum_advance_days: 0,
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe(res => {
      if (res.success && res.data) this.categories.set(res.data);
    });
  }

  saveCategory(): void {
    if (!this.category.name) return;
    this.categoryService.save(this.category, this.editingCategory?.id).subscribe(res => {
      if (res.success) {
        this.loadCategories();
        this.cancelEdit();
      }
    });
  }

  startEdit(cat: RequestCategory): void {
    this.editingCategory = cat;
    this.category = { ...cat };
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.category = {
      name: '',
      description: '',
      requires_document: false,
      is_absence: false,
      minimum_advance_days: 0,
    };
  }

  toggleStatus(cat: RequestCategory): void {
    this.categoryService.toggleStatus(cat.id, !cat.active).subscribe(res => {
      if (res.success) cat.active = !cat.active;
    });
  }
}
