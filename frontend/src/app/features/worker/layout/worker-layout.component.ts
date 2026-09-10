import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-worker-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './worker-layout.component.html',
  styleUrl: './worker-layout.component.scss',
})
export class WorkerLayoutComponent {
  auth = inject(AuthService);

  logout(): void {
    this.auth.logout().subscribe(() => {});
  }
}
