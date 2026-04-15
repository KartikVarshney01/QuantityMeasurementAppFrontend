import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ModalTab = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private _open = new BehaviorSubject<boolean>(false);
  private _tab  = new BehaviorSubject<ModalTab>('login');

  readonly open$ = this._open.asObservable();
  readonly tab$  = this._tab.asObservable();

  open(tab: ModalTab = 'login'): void {
    this._tab.next(tab);
    this._open.next(true);
  }

  close(): void {
    this._open.next(false);
  }

  switchTab(tab: ModalTab): void {
    this._tab.next(tab);
  }
}
