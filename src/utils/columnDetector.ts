import type { ColumnMeta, ColumnType, Row } from '../types/data';

function isDate(value: unknown): boolean {
  if (!(value instanceof Date) || isNaN(value.getTime())) return false;
  // SheetJS with cellDates:true converts time-only values to dates on 1899-12-30
  // A real date has year > 1900
  return value.getFullYear() > 1900;
}

function isTimeValue(value: unknown): boolean {
  // SheetJS time-only cells become Date objects on 1899-12-30
  if (value instanceof Date && !isNaN(value.getTime()) && value.getFullYear() <= 1900) {
    return true;
  }
  // String time format: HH:MM or HH:MM:SS
  if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) {
    return true;
  }
  // Excel decimal time fraction (0.0 - 0.99999)
  if (typeof value === 'number' && value >= 0 && value < 1) {
    return true;
  }
  return false;
}

function isNumeric(value: unknown): boolean {
  if (typeof value === 'number' && !isNaN(value)) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && !isNaN(Number(trimmed));
  }
  return false;
}

function inferType(values: unknown[], totalRows: number): ColumnType {
  if (values.length === 0) return 'text';

  const sample = values.slice(0, 100);

  // Check time first (before date, since time values are also Date objects)
  const timeCount = sample.filter(isTimeValue).length;
  if (timeCount / sample.length >= 0.8) return 'time';

  const dateCount = sample.filter(isDate).length;
  if (dateCount / sample.length >= 0.8) return 'date';

  const numericCount = sample.filter(isNumeric).length;
  if (numericCount / sample.length >= 0.8) return 'numeric';

  const uniqueValues = new Set(sample.map(String));
  if (uniqueValues.size <= 20 && totalRows > 20) return 'categorical';

  return 'text';
}

export function detectColumns(rows: Row[], headers: string[]): ColumnMeta[] {
  return headers
    .filter((header) => {
      return rows.some((row) => row[header] !== null && row[header] !== undefined && row[header] !== '');
    })
    .map((header) => {
      const values = rows
        .map((row) => row[header])
        .filter((v) => v !== null && v !== undefined && v !== '');

      const uniqueCount = new Set(values.map(String)).size;
      const type = inferType(values, rows.length);

      return {
        key: header,
        label: header,
        type,
        uniqueCount,
      };
    });
}
