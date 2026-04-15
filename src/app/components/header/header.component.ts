import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserInfo } from '../../services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  user: UserInfo | null = null;

  constructor(
    public auth: AuthService,
    private modal: AuthModalService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
  }

  openLogin():    void { this.modal.open('login');    }
  openRegister(): void { this.modal.open('register'); }
  logout():       void { this.auth.logout();           }
}
