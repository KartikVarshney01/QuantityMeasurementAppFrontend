import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuantityService, OperationResult } from '../../services/quantity.service';
import { AuthModalService } from '../../services/auth-modal.service';
import { UNITS, CATEGORIES } from '../../models/models';

type OpId = 'compare' | 'convert' | 'add' | 'subtract' | 'divide';

interface QForm { value: number; unit: string; category: string; }

interface ResultState {
  type:    'compare' | 'value' | 'error';
  equal?:  boolean;
  value?:  number;
  unit?:   string;
  meta?:   string;
  error?:  string;
  isLocal?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  readonly CATEGORIES = CATEGORIES;
  readonly operations: { id: OpId; label: string }[] = [
    { id: 'compare',  label: 'Compare'  },
    { id: 'convert',  label: 'Convert'  },
    { id: 'add',      label: 'Add'      },
    { id: 'subtract', label: 'Subtract' },
    { id: 'divide',   label: 'Divide'   },
  ];

  activeOp: OpId = 'compare';

  // ── Compare ─────────────────────────────────────────────────────────
  cmp = { v1: 1, u1: 'Feet', c1: 'LENGTH', v2: 12, u2: 'Inch', c2: 'LENGTH' };

  // ── Convert ─────────────────────────────────────────────────────────
  cvt = { v: 100, u: 'Celsius', cat: 'TEMPERATURE', target: 'Fahrenheit' };

  // ── Add ─────────────────────────────────────────────────────────────
  add = { v1: 5, u1: 'Kilogram', c1: 'WEIGHT', v2: 500, u2: 'Gram', c2: 'WEIGHT' };

  // ── Subtract ────────────────────────────────────────────────────────
  sub = { v1: 3, u1: 'Litre', c1: 'VOLUME', v2: 500, u2: 'Millilitre', c2: 'VOLUME' };

  // ── Divide ──────────────────────────────────────────────────────────
  div = { v1: 10, u1: 'Feet', c1: 'LENGTH', v2: 2, u2: 'Feet', c2: 'LENGTH' };

  // ── Results & loading ───────────────────────────────────────────────
  results:  Partial<Record<OpId, ResultState>> = {};
  loading:  Partial<Record<OpId, boolean>>     = {};

  constructor(
    private qty:   QuantityService,
    private modal: AuthModalService
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────
  switchOp(op: OpId): void {
    this.activeOp = op;
  }

  getUnits(cat: string): string[] {
    return UNITS[cat] || [];
  }

  onCategoryChange(f: { [k: string]: any }, catKey: string, unitKey: string): void {
    const units = this.getUnits(f[catKey]);
    f[unitKey] = units[0] || '';
  }

  onConvertCatChange(): void {
    const units = this.getUnits(this.cvt.cat);
    this.cvt.u      = units[0] || '';
    this.cvt.target = units[1] || units[0] || '';
  }

  clearResult(op: OpId): void { delete this.results[op]; }

  // ── Operations ──────────────────────────────────────────────────────
  doCompare(): void {
    this.loading['compare'] = true;
    this.qty.compare(this.cmp.v1, this.cmp.u1, this.cmp.c1,
                     this.cmp.v2, this.cmp.u2, this.cmp.c2)
      .subscribe(r => {
        this.loading['compare'] = false;
        this.results['compare'] = this.mapToState('compare', r,
          `${this.cmp.v1} ${this.cmp.u1} vs ${this.cmp.v2} ${this.cmp.u2} (${this.cmp.c1})`);
      });
  }

  doConvert(): void {
    this.loading['convert'] = true;
    this.qty.convert(this.cvt.v, this.cvt.u, this.cvt.cat, this.cvt.target)
      .subscribe(r => {
        this.loading['convert'] = false;
        this.results['convert'] = this.mapToState('convert', r,
          `${this.cvt.v} ${this.cvt.u} → ${this.cvt.target} (${this.cvt.cat})`);
      });
  }

  doAdd(): void {
    this.loading['add'] = true;
    this.qty.add(this.add.v1, this.add.u1, this.add.c1,
                 this.add.v2, this.add.u2, this.add.c2)
      .subscribe(r => {
        this.loading['add'] = false;
        this.results['add'] = this.mapToState('add', r,
          `${this.add.v1} ${this.add.u1} + ${this.add.v2} ${this.add.u2} (${this.add.c1})`);
      });
  }

  doSubtract(): void {
    this.loading['subtract'] = true;
    this.qty.subtract(this.sub.v1, this.sub.u1, this.sub.c1,
                      this.sub.v2, this.sub.u2, this.sub.c2)
      .subscribe(r => {
        this.loading['subtract'] = false;
        this.results['subtract'] = this.mapToState('subtract', r,
          `${this.sub.v1} ${this.sub.u1} − ${this.sub.v2} ${this.sub.u2} (${this.sub.c1})`);
      });
  }

  doDivide(): void {
    this.loading['divide'] = true;
    this.qty.divide(this.div.v1, this.div.u1, this.div.c1,
                    this.div.v2, this.div.u2, this.div.c2)
      .subscribe(r => {
        this.loading['divide'] = false;
        this.results['divide'] = this.mapToState('divide', r,
          `${this.div.v1} ${this.div.u1} ÷ ${this.div.v2} ${this.div.u2} (${this.div.c1})`);
      });
  }

  private mapToState(op: string, r: OperationResult, meta: string): ResultState {
    if (r.error)              return { type: 'error', error: r.error };
    if (op === 'compare')     return { type: 'compare', equal: r.equal, meta, isLocal: r.isLocal };
    return { type: 'value', value: r.result, unit: r.unit, meta, isLocal: r.isLocal };
  }

  fmt(n?: number): string {
    if (n === undefined || n === null) return '—';
    return parseFloat(n.toFixed(6)).toString();
  }
}
