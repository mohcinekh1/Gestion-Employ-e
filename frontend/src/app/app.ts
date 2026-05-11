import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ShellUiService } from './core/services/shell-ui.service';
import { SidebarComponent } from './shared/components/sidebar.component';
import { TopbarComponent } from './shared/components/topbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly authService = inject(AuthService);
  protected readonly shellUi = inject(ShellUiService);
}
