import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrAreaService } from '../../../core/services/hr-area-position.service';
import { Area } from '../../../core/models/index';

@Component({
  selector: 'app-hr-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="areas-container">
      <div class="header-section">
        <h2>Gestión de Áreas</h2>
        <p>Administra las áreas y sus topes mensuales de permisos y faltas.</p>
      </div>

      <div class="add-card">
        <h3>{{ editingArea ? 'Editar Área' : 'Agregar Nueva Área' }}</h3>
        <div class="input-row">
          <input 
            type="text" 
            [(ngModel)]="areaName" 
            placeholder="Ej: Calidad, Empaque, Inyección..." 
            class="input-control" 
          />
          <input type="number" [(ngModel)]="permissionLimit" min="0" placeholder="Tope permisos" class="input-control limit-input" title="0 o vacío: sin tope" />
          <input type="number" [(ngModel)]="absenceLimit" min="0" placeholder="Tope faltas" class="input-control limit-input" title="0 o vacío: sin tope" />
          <button (click)="saveArea()" [disabled]="!areaName.trim()" class="btn-primary">
            {{ editingArea ? 'Actualizar' : 'Agregar' }}
          </button>
          <button *ngIf="editingArea" (click)="cancelEdit()" class="btn-secondary">Cancelar</button>
        </div>
      </div>

      <div class="table-card">
        <table class="areas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Área</th>
              <th>Estado</th>
              <th>Topes mensuales</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let area of areas()">
              <td>#{{ area.id }}</td>
              <td class="area-name">{{ area.name }}</td>
              <td>
                <span class="status-badge" [class.active]="area.active" [class.inactive]="!area.active">
                  {{ area.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>Permisos: {{ limitLabel(area.monthly_permission_limit) }}<br>Faltas: {{ limitLabel(area.monthly_absence_limit) }}</td>
              <td class="actions-cell">
                <button (click)="startEdit(area)" class="btn-action edit">Editar</button>
                <button (click)="toggleStatus(area)" class="btn-action toggle">
                  {{ area.active ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .areas-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 1.25rem;
      h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
      p { color: #64748b; font-size: 0.88rem; margin: 0.2rem 0 0 0; }
    }
    .add-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      h3 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.8rem 0; }
    }
    .input-row {
      display: flex;
      gap: 0.75rem;
    }
    .input-control {
      flex: 1;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      font-size: 0.88rem;
      outline: none;
      &:focus { border-color: var(--color-accent); }
    }
    .limit-input { max-width: 145px; }
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
    .table-card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .areas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      th {
        background: #f8fafc;
        padding: 0.85rem 1rem;
        text-align: left;
        font-weight: 800;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
      }
      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
      }
    }
    .area-name { font-weight: 700; }
    .status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      &.active { background: #dcfce7; color: #166534; }
      &.inactive { background: #fee2e2; color: #991b1b; }
    }
    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }
    .btn-action {
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      &.edit { color: var(--color-accent); border-color: #9bcaa2; }
      &.toggle { color: #64748b; }
    }
    @media (max-width: 600px) {
      .areas-container { padding: 1rem; }
      .input-row { flex-direction: column; }
      .input-control, .limit-input, .btn-primary, .btn-secondary { width: 100%; max-width: none; flex: none; }
      .table-card { background: transparent; border: 0; box-shadow: none; overflow: visible; }
      .areas-table, .areas-table tbody, .areas-table tr, .areas-table td { display: block; width: 100%; }
      .areas-table thead { display: none; }
      .areas-table tr { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 3px 12px rgba(0,0,0,.03); margin-bottom: .75rem; overflow: hidden; }
      .areas-table td { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .72rem .9rem; }
      .areas-table td::before { color: #64748b; content: attr(data-label); font-size: .75rem; font-weight: 800; }
      .areas-table td:nth-child(1)::before { content: 'ID'; }
      .areas-table td:nth-child(2)::before { content: 'Área'; }
      .areas-table td:nth-child(3)::before { content: 'Estado'; }
      .areas-table td:nth-child(4)::before { content: 'Topes'; }
      .areas-table td:nth-child(5)::before { content: 'Acciones'; }
      .actions-cell { display: grid !important; grid-template-columns: 1fr 1fr; }
      .btn-action { width: 100%; padding: .6rem .4rem; white-space: nowrap; }
    }
  `]
})
export class HrAreasComponent implements OnInit {
  private areaService = inject(HrAreaService);

  areas = signal<Area[]>([]);
  areaName = '';
  permissionLimit: number | null = null;
  absenceLimit: number | null = null;
  editingArea: Area | null = null;

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.areaService.getAll().subscribe(res => {
      if (res.success && res.data) this.areas.set(res.data);
    });
  }

  saveArea(): void {
    if (!this.areaName.trim()) return;
    if (this.editingArea) {
      this.areaService.update(this.editingArea.id, this.areaPayload()).subscribe(res => {
        if (res.success) {
          Object.assign(this.editingArea!, res.data);
          this.cancelEdit();
        }
      });
    } else {
      this.areaService.create(this.areaPayload()).subscribe(res => {
        if (res.success && res.data) {
          this.areas.update(list => [...list, res.data]);
          this.areaName = '';
        }
      });
    }
  }

  startEdit(area: Area): void {
    this.editingArea = area;
    this.areaName = area.name;
    this.permissionLimit = area.monthly_permission_limit ?? null;
    this.absenceLimit = area.monthly_absence_limit ?? null;
  }

  cancelEdit(): void {
    this.editingArea = null;
    this.areaName = '';
    this.permissionLimit = null;
    this.absenceLimit = null;
  }

  toggleStatus(area: Area): void {
    this.areaService.toggleStatus(area.id, !area.active).subscribe(res => {
      if (res.success) {
        area.active = !area.active;
      }
    });
  }

  limitLabel(value?: number | null): string { return value ? String(value) : 'Sin tope'; }

  private areaPayload(): Pick<Area, 'name'> & Partial<Area> {
    return {
      name: this.areaName.trim(),
      monthly_permission_limit: this.permissionLimit || null,
      monthly_absence_limit: this.absenceLimit || null,
    };
  }
}
