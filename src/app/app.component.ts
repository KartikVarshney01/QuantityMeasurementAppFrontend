import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, AuthModalComponent],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-auth-modal></app-auth-modal>
  `
})
export class AppComponent { }
