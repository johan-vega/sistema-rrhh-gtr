import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrPositionService } from '../../../core/services/hr-area-position.service';
import { Position } from '../../../core/models/index';

@Component({
  selector: 'app-hr-positions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="positions-container">
      <div class="header-section">
        <h2>Gestión de Cargos</h2>
        <p>Administra los puestos laborales de la empresa.</p>
      </div>

      <div class="add-card">
        <h3>{{ editingPosition ? 'Editar Cargo' : 'Agregar Nuevo Cargo' }}</h3>
        <div class="input-row">
          <input 
            type="text" 
            [(ngModel)]="positionName" 
            placeholder="Ej: Operario de Extrusión, Técnico Electrónico..." 
            class="input-control" 
          />
          <button (click)="savePosition()" [disabled]="!positionName.trim()" class="btn-primary">
            {{ editingPosition ? 'Actualizar' : 'Agregar' }}
          </button>
          <button *ngIf="editingPosition" (click)="cancelEdit()" class="btn-secondary">Cancelar</button>
        </div>
      </div>

      <div class="table-card">
        <table class="positions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Cargo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pos of positions()">
              <td>#{{ pos.id }}</td>
              <td class="pos-name">{{ pos.name }}</td>
              <td>
                <span class="status-badge" [class.active]="pos.active" [class.inactive]="!pos.active">
                  {{ pos.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions-cell">
                <button (click)="startEdit(pos)" class="btn-action edit">Editar</button>
                <button (click)="toggleStatus(pos)" class="btn-action toggle">
                  {{ pos.active ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .positions-container {
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
      &:focus { border-color: #2e86de; }
    }
    .btn-primary {
      background: #1e3a5f;
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
    .positions-table {
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
    .pos-name { font-weight: 700; }
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
      &.edit { color: #2e86de; border-color: #93c5fd; }
      &.toggle { color: #64748b; }
    }
  `]
})
export class HrPositionsComponent implements OnInit {
  private positionService = inject(HrPositionService);

  positions = signal<Position[]>([]);
  positionName = '';
  editingPosition: Position | null = null;

  ngOnInit(): void {
    this.loadPositions();
  }

  loadPositions(): void {
    this.positionService.getAll().subscribe(res => {
      if (res.success && res.data) this.positions.set(res.data);
    });
  }

  savePosition(): void {
    if (!this.positionName.trim()) return;
    if (this.editingPosition) {
      this.positionService.update(this.editingPosition.id, this.positionName.trim()).subscribe(res => {
        if (res.success) {
          this.editingPosition!.name = this.positionName.trim();
          this.cancelEdit();
        }
      });
    } else {
      this.positionService.create(this.positionName.trim()).subscribe(res => {
        if (res.success && res.data) {
          this.positions.update(list => [...list, res.data]);
          this.positionName = '';
        }
      });
    }
  }

  startEdit(pos: Position): void {
    this.editingPosition = pos;
    this.positionName = pos.name;
  }

  cancelEdit(): void {
    this.editingPosition = null;
    this.positionName = '';
  }

  toggleStatus(pos: Position): void {
    this.positionService.toggleStatus(pos.id, !pos.active).subscribe(res => {
      if (res.success) {
        pos.active = !pos.active;
      }
    });
  }
}
