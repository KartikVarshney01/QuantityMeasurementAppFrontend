import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthModalService, ModalTab } from '../../services/auth-modal.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.css'
})
export class AuthModalComponent implements OnInit, OnDestroy {
  isOpen  = false;
  activeTab: ModalTab = 'login';

  // Login form
  loginEmail = '';
  loginPass  = '';

  // Register form
  regName  = '';
  regEmail = '';
  regPass  = '';

  errorMsg  = '';
  loading   = false;

  private subs = new Subscription();

  constructor(private auth: AuthService, private modal: AuthModalService) {}

  ngOnInit(): void {
    this.subs.add(this.modal.open$.subscribe(v => {
      this.isOpen = v;
      if (v) this.clearError();
    }));
    this.subs.add(this.modal.tab$.subscribe(t => {
      this.activeTab = t;
      this.clearError();
    }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.close(); }

  close():                  void { this.modal.close();          }
  switchTab(t: ModalTab):   void { this.modal.switchTab(t);     }
  clearError():             void { this.errorMsg = '';          }
  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  doLogin(): void {
    if (!this.loginEmail || !this.loginPass) {
      this.errorMsg = 'Email and password are required.'; return;
    }
    this.loading = true; this.clearError();
    this.auth.login({ email: this.loginEmail, password: this.loginPass }).subscribe(res => {
      this.loading = false;
      if (res.success) { this.close(); this.resetForms(); }
      else             { this.errorMsg = res.message; }
    });
  }

  doRegister(): void {
    if (!this.regName || !this.regEmail || !this.regPass) {
      this.errorMsg = 'All fields are required.'; return;
    }
    if (this.regPass.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.'; return;
    }
    this.loading = true; this.clearError();
    this.auth.register({ name: this.regName, email: this.regEmail, password: this.regPass }).subscribe(res => {
      this.loading = false;
      if (res.success) { this.close(); this.resetForms(); }
      else             { this.errorMsg = res.message; }
    });
  }

  private resetForms(): void {
    this.loginEmail = ''; this.loginPass  = '';
    this.regName    = ''; this.regEmail   = ''; this.regPass = '';
  }
}
