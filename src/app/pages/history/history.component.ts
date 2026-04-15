import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';
import { ApiService } from '../../services/api.service';
import { HistoryEntry, ApiResponse } from '../../models/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  history: HistoryEntry[] = [];
  filtered: HistoryEntry[] = [];
  loading = false;
  filterOp = 'all';

  stats = { total: 0, compare: 0, convert: 0, arith: 0 };
  private subs = new Subscription();

  constructor(
    public auth: AuthService,
    private modal: AuthModalService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.subs.add(this.auth.user$.subscribe(u => {
      const wasLoggedIn = this.isLoggedIn;
      this.isLoggedIn = !!u;
      if (this.isLoggedIn && !wasLoggedIn) {
        this.loadHistory();
      }
    }));
    if (this.isLoggedIn) this.loadHistory();
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  openLogin() { this.modal.open('login'); }
  openRegister() { this.modal.open('register'); }

  loadHistory() {
    if (!this.isLoggedIn) return;
    this.loading = true;
    this.api.get<ApiResponse<HistoryEntry[]>>('/api/quantities/history').subscribe({
      next: (res) => {
        this.history = res.data || [];
        this.applyFilter(this.filterOp);
        this.calcStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilter(op: string) {
    this.filterOp = op;
    if (op === 'all') {
      this.filtered = [...this.history];
    } else {
      this.filtered = this.history.filter(h => h.operation?.toLowerCase() === op.toLowerCase());
    }
  }

  calcStats() {
    this.stats.total = this.history.length;
    this.stats.compare = this.history.filter(h => h.operation?.toLowerCase() === 'compare').length;
    this.stats.convert = this.history.filter(h => h.operation?.toLowerCase() === 'convert').length;
    this.stats.arith = this.history.filter(h => {
      const op = h.operation?.toLowerCase();
      return op === 'add' || op === 'subtract' || op === 'divide';
    }).length;
  }

//   formatQuantity(q: any): string {
//     if (!q) return '—';
//     if (typeof q === 'object') {
//       const val = q.value ?? q.Value;
//       const unit = q.unitName ?? q.UnitName ?? q.unit ?? q.Unit;
//       return `${val} ${unit}`;
//     }
//     return String(q);
//   }
// }

formatQuantity(q: any): string {
    if (q === null || q === undefined) return '—';
 
    // Boolean result (Compare operation)
    if (typeof q === 'boolean') return String(q);
 
    // Number result (Divide operation)
    if (typeof q === 'number') return String(q);
 
    // Proper QuantityDTO object from backend JSON
    if (typeof q === 'object') {
      const val  = q.value    ?? q.Value;
      const unit = q.unitName ?? q.UnitName ?? q.unit ?? q.Unit;
      if (val !== undefined && unit !== undefined) return `${val} ${unit}`;
      // Fallback: stringify whatever object we got
      return JSON.stringify(q);
    }
 
    // String cases
    if (typeof q === 'string') {
      // Handle Java toString() like: "QuantityDTO(5.5, Kilogram, WEIGHT)"
      const dtoMatch = q.match(/QuantityDTO\(\s*([\d.]+)\s*,\s*(\w+)\s*,\s*\w+\s*\)/i);
      if (dtoMatch) return `${dtoMatch[1]} ${dtoMatch[2]}`;
 
      // Plain string (e.g. "true", "false", a number as string)
      return q;
    }
 
    return String(q);
  }
}
