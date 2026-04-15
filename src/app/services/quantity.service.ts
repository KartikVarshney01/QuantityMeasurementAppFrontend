import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { LocalComputeService } from './local-compute.service';
import { ApiResponse, ComparisonApiResponse, ConversionApiResponse, ArithmeticApiResponse, DivisionApiResponse } from '../models/models';

export interface OperationResult {
  equal?:   boolean;
  result?:  number;
  unit?:    string;
  error?:   string;
  isLocal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  constructor(
    private api:   ApiService,
    private auth:  AuthService,
    private local: LocalComputeService
  ) {}

  compare(v1: number, u1: string, c1: string, v2: number, u2: string, c2: string): Observable<OperationResult> {
    if (!this.auth.isLoggedIn) {
      return of({ ...this.local.compare(v1, u1, c1, v2, u2, c2), isLocal: true });
    }
    return this.api.post<ApiResponse<ComparisonApiResponse>>('/api/quantities/compare', {
      q1: { value: v1, unitName: u1, category: c1 },
      q2: { value: v2, unitName: u2, category: c2 }
    }).pipe(
      map(res => ({ equal: res.data.areEqual })),
      catchError(() => of({ ...this.local.compare(v1, u1, c1, v2, u2, c2), isLocal: true }))
    );
  }

  convert(val: number, unit: string, cat: string, target: string): Observable<OperationResult> {
    if (!this.auth.isLoggedIn) {
      return of({ ...this.local.convert(val, unit, cat, target), isLocal: true });
    }
    return this.api.post<ApiResponse<ConversionApiResponse>>('/api/quantities/convert', {
      quantity: { value: val, unitName: unit, category: cat },
      targetUnit: target
    }).pipe(
      map(res => ({ result: res.data.result, unit: res.data.unit })),
      catchError(() => of({ ...this.local.convert(val, unit, cat, target), isLocal: true }))
    );
  }

  add(v1: number, u1: string, c1: string, v2: number, u2: string, c2: string): Observable<OperationResult> {
    if (!this.auth.isLoggedIn) {
      return of({ ...this.local.add(v1, u1, c1, v2, u2, c2), isLocal: true });
    }
    return this.api.post<ApiResponse<ArithmeticApiResponse>>('/api/quantities/add', {
      q1: { value: v1, unitName: u1, category: c1 },
      q2: { value: v2, unitName: u2, category: c2 }
    }).pipe(
      map(res => ({ result: res.data.result, unit: res.data.unit })),
      catchError(() => of({ ...this.local.add(v1, u1, c1, v2, u2, c2), isLocal: true }))
    );
  }

  subtract(v1: number, u1: string, c1: string, v2: number, u2: string, c2: string): Observable<OperationResult> {
    if (!this.auth.isLoggedIn) {
      return of({ ...this.local.subtract(v1, u1, c1, v2, u2, c2), isLocal: true });
    }
    return this.api.post<ApiResponse<ArithmeticApiResponse>>('/api/quantities/subtract', {
      q1: { value: v1, unitName: u1, category: c1 },
      q2: { value: v2, unitName: u2, category: c2 }
    }).pipe(
      map(res => ({ result: res.data.result, unit: res.data.unit })),
      catchError(() => of({ ...this.local.subtract(v1, u1, c1, v2, u2, c2), isLocal: true }))
    );
  }

  divide(v1: number, u1: string, c1: string, v2: number, u2: string, c2: string): Observable<OperationResult> {
    if (!this.auth.isLoggedIn) {
      return of({ ...this.local.divide(v1, u1, c1, v2, u2, c2), isLocal: true });
    }
    return this.api.post<ApiResponse<DivisionApiResponse>>('/api/quantities/divide', {
      q1: { value: v1, unitName: u1, category: c1 },
      q2: { value: v2, unitName: u2, category: c2 }
    }).pipe(
      map(res => ({ result: res.data.result, unit: 'dimensionless' })),
      catchError(() => of({ ...this.local.divide(v1, u1, c1, v2, u2, c2), isLocal: true }))
    );
  }
}
