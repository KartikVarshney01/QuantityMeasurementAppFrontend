// ── Request DTOs ──────────────────────────────────────────────────────────────
export interface QuantityRequest {
  value: number;
  unitName: string;
  category: string;
}

export interface BinaryOperationRequest {
  q1: QuantityRequest;
  q2: QuantityRequest;
}

export interface ConversionRequest {
  quantity: QuantityRequest;
  targetUnit: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  userId: number;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ComparisonApiResponse {
  areEqual: boolean;
  message: string;
}

export interface ConversionApiResponse {
  result: number;
  unit: string;
  category: string;
}

export interface ArithmeticApiResponse {
  result: number;
  unit: string;
  category: string;
}

export interface DivisionApiResponse {
  result: number;
}

export interface HistoryEntry {
  id: number;
  operation: string;
  operand1: QuantityRequest | string | null;
  operand2: QuantityRequest | string | null;
  result: any;
  hasError: boolean;
  errorMessage?: string;
  createdAt: string;
}

// ── Domain constants ──────────────────────────────────────────────────────────
export const UNITS: Record<string, string[]> = {
  LENGTH:      ['Feet', 'Inch', 'Yard', 'Centimeter'],
  WEIGHT:      ['Kilogram', 'Gram', 'Pound'],
  VOLUME:      ['Litre', 'Millilitre', 'Gallon'],
  TEMPERATURE: ['Celsius', 'Fahrenheit', 'Kelvin']
};

export const CATEGORIES: string[] = ['LENGTH', 'WEIGHT', 'VOLUME', 'TEMPERATURE'];
export const OPERATIONS:  string[] = ['Compare', 'Convert', 'Add', 'Subtract', 'Divide'];
