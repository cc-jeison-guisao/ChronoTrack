import * as XLSX from 'xlsx';
import { detectColumns } from './columnDetector';
import type { ParsedData, Row, ColumnMeta } from '../types/data';

function deduplicateHeaders(headers: string[]): string[] {
  const counts: Record<string, number> = {};
  return headers.map((h) => {
    const name = h || 'Column';
    if (counts[name] === undefined) {
      counts[name] = 0;
      return name;
    }
    counts[name]++;
    return `${name}_${counts[name]}`;
  });
}

function findColumnByPattern(columns: ColumnMeta[], patterns: string[]): ColumnMeta | undefined {
  // 1. Exact match first (avoids "A M OffDuty" matching before "P M OffDuty")
  for (const p of patterns) {
    const exact = columns.find((c) => {
      const key = c.key.toLowerCase().replace(/\s+/g, '');
      return key === p;
    });
    if (exact) return exact;
  }

  // 2. Fallback to includes
  return columns.find((c) => {
    const lower = c.key.toLowerCase().replace(/\s+/g, '');
    return patterns.some((p) => lower.includes(p));
  });
}

function detectAttendanceMode(columns: ColumnMeta[]): {
  isAttendance: boolean;
  clockInKey?: string;
  clockOutKey?: string;
  pmOnDutyKey?: string;
  userIdKey?: string;
  userNameKey?: string;
  dateKey?: string;
  departmentKey?: string;
} {
  const clockIn = findColumnByPattern(columns, ['amonduty', 'onduty', 'clockin', 'entrada', 'checkin']);
  const clockOut = findColumnByPattern(columns, ['pmoffduty', 'clockout', 'checkout', 'salida', 'offduty']);
  const pmOnDuty = findColumnByPattern(columns, ['pmonduty']);
  const userId = findColumnByPattern(columns, ['userid', 'employeeid', 'idusuario', 'idcolaborador']);
  const userName = findColumnByPattern(columns, ['username', 'employeename', 'nombre', 'colaborador']);
  const dateCol = columns.find((c) => c.type === 'date') ?? findColumnByPattern(columns, ['date', 'fecha']);
  const department = findColumnByPattern(columns, ['department', 'departamento', 'dept', 'area']);

  const isAttendance = !!(clockIn && clockOut);

  return {
    isAttendance,
    clockInKey: clockIn?.key,
    clockOutKey: clockOut?.key,
    pmOnDutyKey: pmOnDuty?.key,
    userIdKey: userId?.key,
    userNameKey: userName?.key,
    dateKey: dateCol?.key,
    departmentKey: department?.key,
  };
}

function timeToMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Date object (SheetJS cellDates:true)
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.getHours() * 60 + value.getMinutes();
  }

  // String "HH:MM" or "HH:MM:SS"
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
  }

  // Decimal fraction (Excel time: 0.354166 = 8:30)
  if (typeof value === 'number' && value >= 0 && value < 1) {
    return Math.round(value * 24 * 60);
  }

  return null;
}

function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function timeToDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  if (value instanceof Date && !isNaN(value.getTime())) {
    const h = value.getHours().toString().padStart(2, '0');
    const m = value.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value.trim())) {
    return value.trim().substring(0, 5);
  }

  if (typeof value === 'number' && value >= 0 && value < 1) {
    const totalMin = Math.round(value * 24 * 60);
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  return String(value);
}

export function parseExcel(buffer: ArrayBuffer, sheetIndex = 0): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const sheetName = sheetNames[sheetIndex] ?? sheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: null });

  if (rawRows.length === 0) {
    return { rows: [], columns: [], sheetName, sheetNames, isAttendance: false };
  }

  const rawHeaders = Object.keys(rawRows[0]);
  const headers = deduplicateHeaders(rawHeaders);

  // Remap rows if headers were deduplicated
  const rows: Row[] = rawHeaders.some((h, i) => h !== headers[i])
    ? rawRows.map((row) => {
        const newRow: Row = {};
        rawHeaders.forEach((rawH, i) => {
          newRow[headers[i]] = row[rawH];
        });
        return newRow;
      })
    : rawRows;

  // Filter out completely empty rows
  const filteredRows = rows.filter((row) =>
    headers.some((h) => row[h] !== null && row[h] !== undefined && row[h] !== '')
  );

  const columns = detectColumns(filteredRows, headers);
  const attendance = detectAttendanceMode(columns);

  if (!attendance.isAttendance) {
    return {
      rows: filteredRows, columns, sheetName, sheetNames, isAttendance: false,
      attendanceKeys: {
        clockInKey: attendance.clockInKey,
        clockOutKey: attendance.clockOutKey,
        userIdKey: attendance.userIdKey,
        userNameKey: attendance.userNameKey,
        dateKey: attendance.dateKey,
        departmentKey: attendance.departmentKey,
        pmOnDutyKey: attendance.pmOnDutyKey,
      },
    };
  }

  // Attendance mode: compute derived columns
  const { clockInKey, clockOutKey, pmOnDutyKey } = attendance;
  const LATE_ENTRY_LIMIT = 8 * 60; // 08:00 in minutes
  const LATE_EXIT_LIMIT = 18 * 60; // 18:00 in minutes

  const enrichedRows = filteredRows.map((row) => {
    const newRow = { ...row };

    // Resolve effective clock-out: use P M OffDuty if it has a value, otherwise P M OnDuty
    const rawClockOut = clockOutKey ? row[clockOutKey] : null;
    const rawPmOnDuty = pmOnDutyKey ? row[pmOnDutyKey] : null;
    const hasClockOut = rawClockOut !== null && rawClockOut !== undefined && rawClockOut !== '';
    const effectiveClockOut = hasClockOut ? rawClockOut : rawPmOnDuty;

    // Compute minutes from raw values BEFORE formatting
    const rawInMin = clockInKey ? timeToMinutes(row[clockInKey]) : null;
    const outMin = effectiveClockOut ? timeToMinutes(effectiveClockOut) : null;

    // Validation: if clock-in is >= 12:00 PM, treat as "no entry"
    const NO_ENTRY_LIMIT = 12 * 60; // 12:00 in minutes
    const noMarcoEntrada = rawInMin !== null && rawInMin >= NO_ENTRY_LIMIT;
    const inMin = noMarcoEntrada ? null : rawInMin;

    // If no entry was recorded and no clock-out exists, use the raw clock-in time as clock-out
    const finalOutMin = (noMarcoEntrada && outMin === null) ? rawInMin : outMin;
    const finalClockOutDisplay = (noMarcoEntrada && outMin === null && clockInKey)
      ? timeToDisplay(row[clockInKey])
      : (effectiveClockOut ? timeToDisplay(effectiveClockOut) : '—');

    // Write renamed columns with formatted values
    newRow['Entrada'] = noMarcoEntrada ? '—' : (clockInKey ? timeToDisplay(row[clockInKey]) : '—');
    newRow['Salida'] = finalClockOutDisplay;

    // Compute worked hours
    if (inMin !== null && finalOutMin !== null && finalOutMin > inMin) {
      const worked = finalOutMin - inMin;
      newRow['Horas Trabajadas'] = minutesToDisplay(worked);
      newRow['_horasDecimal'] = parseFloat((worked / 60).toFixed(2));
    } else {
      newRow['Horas Trabajadas'] = '—';
      newRow['_horasDecimal'] = null;
    }

    // Late entry: arrived after 08:00
    if (inMin !== null && inMin > LATE_ENTRY_LIMIT) {
      const lateBy = inMin - LATE_ENTRY_LIMIT;
      newRow['Entrada Tardía'] = `Tarde ${minutesToDisplay(lateBy)}`;
      newRow['_entradaTardeMin'] = lateBy;
      newRow['_llegadaTarde'] = 1;
    } else {
      newRow['Entrada Tardía'] = inMin !== null ? 'A tiempo' : '—';
      newRow['_entradaTardeMin'] = 0;
      newRow['_llegadaTarde'] = 0;
    }

    // Late exit: left after 18:00
    if (finalOutMin !== null && finalOutMin > LATE_EXIT_LIMIT) {
      const extraBy = finalOutMin - LATE_EXIT_LIMIT;
      newRow['Salida Tardía'] = `Extra ${minutesToDisplay(extraBy)}`;
      newRow['_salidaTardeMin'] = extraBy;
    } else {
      newRow['Salida Tardía'] = finalOutMin !== null ? 'A tiempo' : '—';
      newRow['_salidaTardeMin'] = 0;
    }

    return newRow;
  });

  // Update columns: replace original clock columns with renamed ones, add derived columns
  const updatedColumns: ColumnMeta[] = [
    ...columns
      .filter((c) => c.key !== clockInKey && c.key !== clockOutKey && c.key !== pmOnDutyKey)
      .map((c) => c),
    { key: 'Entrada', label: 'Entrada', type: 'time' as const, uniqueCount: 0 },
    { key: 'Salida', label: 'Salida', type: 'time' as const, uniqueCount: 0 },
    { key: 'Horas Trabajadas', label: 'Horas Trabajadas', type: 'text' as const, uniqueCount: 0 },
    { key: 'Entrada Tardía', label: 'Entrada Tardía', type: 'text' as const, uniqueCount: 0 },
    { key: 'Salida Tardía', label: 'Salida Tardía', type: 'text' as const, uniqueCount: 0 },
    { key: '_horasDecimal', label: 'Horas (decimal)', type: 'numeric' as const, uniqueCount: 0 },
    { key: '_entradaTardeMin', label: 'Entrada tarde (min)', type: 'numeric' as const, uniqueCount: 0 },
    { key: '_salidaTardeMin', label: 'Salida tarde (min)', type: 'numeric' as const, uniqueCount: 0 },
    { key: '_llegadaTarde', label: 'Llegada tarde (flag)', type: 'numeric' as const, uniqueCount: 0 },
  ];

  return {
    rows: enrichedRows,
    columns: updatedColumns,
    sheetName,
    sheetNames,
    isAttendance: true,
    attendanceKeys: {
      departmentKey: attendance.departmentKey,
      userIdKey: attendance.userIdKey,
      userNameKey: attendance.userNameKey,
      dateKey: attendance.dateKey,
      clockInKey: 'Entrada',
      clockOutKey: 'Salida',
      pmOnDutyKey: attendance.pmOnDutyKey,
    },
  };
}

/**
 * Recompute lateness columns using custom schedule limits per department/employee.
 * Operates on already-parsed rows where clock-in/clock-out are display strings ("HH:MM").
 */
export function recomputeLateness(
  rows: Row[],
  attendanceKeys: { clockInKey?: string; clockOutKey?: string; departmentKey?: string; userIdKey?: string },
  getLimits: (dept: string | undefined, employeeId: string | undefined) => { entryLimit: number; exitLimit: number }
): Row[] {
  const { clockInKey, clockOutKey, departmentKey, userIdKey } = attendanceKeys;
  if (!clockInKey || !clockOutKey) return rows;

  return rows.map((row) => {
    const newRow = { ...row };
    const dept = departmentKey ? String(row[departmentKey] ?? '').trim() : undefined;
    const empId = userIdKey ? String(row[userIdKey] ?? '').trim() : undefined;
    const { entryLimit, exitLimit } = getLimits(dept, empId);

    const inMin = timeToMinutes(row[clockInKey]);
    const outMin = timeToMinutes(row[clockOutKey]);

    // Late entry
    if (inMin !== null && inMin > entryLimit) {
      const lateBy = inMin - entryLimit;
      newRow['Entrada Tardía'] = `Tarde ${minutesToDisplay(lateBy)}`;
      newRow['_entradaTardeMin'] = lateBy;
      newRow['_llegadaTarde'] = 1;
    } else {
      newRow['Entrada Tardía'] = inMin !== null ? 'A tiempo' : '—';
      newRow['_entradaTardeMin'] = 0;
      newRow['_llegadaTarde'] = 0;
    }

    // Late exit
    if (outMin !== null && outMin > exitLimit) {
      const extraBy = outMin - exitLimit;
      newRow['Salida Tardía'] = `Extra ${minutesToDisplay(extraBy)}`;
      newRow['_salidaTardeMin'] = extraBy;
    } else {
      newRow['Salida Tardía'] = outMin !== null ? 'A tiempo' : '—';
      newRow['_salidaTardeMin'] = 0;
    }

    return newRow;
  });
}

export { timeToMinutes, minutesToDisplay };
