import { Injectable } from '@angular/core';

export interface LocalResult {
  result?: number;
  equal?:  boolean;
  unit?:   string;
  error?:  string;
}

// Conversion factors to base unit per category
const TO_BASE: Record<string, Record<string, number>> = {
  LENGTH: { Feet: 1, Inch: 1 / 12, Yard: 3, Centimeter: 0.0328084 },
  WEIGHT: { Kilogram: 1, Gram: 0.001, Pound: 0.453592 },
  VOLUME: { Litre: 1, Millilitre: 0.001, Gallon: 3.78541 }
};

function toBase(value: number, unit: string, cat: string): number {
  const factor = TO_BASE[cat]?.[unit];
  if (factor === undefined) throw new Error(`Unknown unit "${unit}" for category "${cat}".`);
  return value * factor;
}

function fromBase(base: number, unit: string, cat: string): number {
  const factor = TO_BASE[cat]?.[unit];
  if (factor === undefined) throw new Error(`Unknown unit "${unit}" for category "${cat}".`);
  return base / factor;
}

function tempToCelsius(v: number, unit: string): number {
  if (unit === 'Celsius')    return v;
  if (unit === 'Fahrenheit') return (v - 32) * 5 / 9;
  if (unit === 'Kelvin')     return v - 273.15;
  throw new Error(`Unknown temperature unit "${unit}".`);
}

function celsiusToUnit(c: number, unit: string): number {
  if (unit === 'Celsius')    return c;
  if (unit === 'Fahrenheit') return c * 9 / 5 + 32;
  if (unit === 'Kelvin')     return c + 273.15;
  throw new Error(`Unknown temperature unit "${unit}".`);
}

@Injectable({ providedIn: 'root' })
export class LocalComputeService {

  compare(v1: number, u1: string, cat1: string, v2: number, u2: string, cat2: string): LocalResult {
    try {
      if (cat1 !== cat2) return { error: 'Categories must match for comparison.' };
      let b1: number, b2: number;
      if (cat1 === 'TEMPERATURE') {
        b1 = tempToCelsius(v1, u1); b2 = tempToCelsius(v2, u2);
      } else {
        b1 = toBase(v1, u1, cat1); b2 = toBase(v2, u2, cat2);
      }
      return { equal: Math.abs(b1 - b2) < 1e-9 };
    } catch (e: any) { return { error: e.message }; }
  }

  convert(val: number, unit: string, cat: string, target: string): LocalResult {
    try {
      if (cat === 'TEMPERATURE') {
        const c = tempToCelsius(val, unit);
        return { result: celsiusToUnit(c, target), unit: target };
      }
      return { result: fromBase(toBase(val, unit, cat), target, cat), unit: target };
    } catch (e: any) { return { error: e.message }; }
  }

  add(v1: number, u1: string, cat1: string, v2: number, u2: string, cat2: string): LocalResult {
    try {
      if (cat1 !== cat2)          return { error: 'Categories must match for addition.' };
      if (cat1 === 'TEMPERATURE') return { error: 'Temperature addition is not supported.' };
      const sum = toBase(v1, u1, cat1) + toBase(v2, u2, cat2);
      return { result: fromBase(sum, u1, cat1), unit: u1 };
    } catch (e: any) { return { error: e.message }; }
  }

  subtract(v1: number, u1: string, cat1: string, v2: number, u2: string, cat2: string): LocalResult {
    try {
      if (cat1 !== cat2)          return { error: 'Categories must match for subtraction.' };
      if (cat1 === 'TEMPERATURE') return { error: 'Temperature subtraction is not supported.' };
      const diff = toBase(v1, u1, cat1) - toBase(v2, u2, cat2);
      return { result: fromBase(diff, u1, cat1), unit: u1 };
    } catch (e: any) { return { error: e.message }; }
  }

  divide(v1: number, u1: string, cat1: string, v2: number, u2: string, cat2: string): LocalResult {
    try {
      if (cat1 !== cat2)          return { error: 'Categories must match for division.' };
      if (cat1 === 'TEMPERATURE') return { error: 'Temperature division is not supported.' };
      const b1 = toBase(v1, u1, cat1);
      const b2 = toBase(v2, u2, cat2);
      if (Math.abs(b2) < 1e-12)  return { error: 'Division by zero.' };
      return { result: b1 / b2, unit: 'dimensionless' };
    } catch (e: any) { return { error: e.message }; }
  }
}
