import type { ColumnMeta, ColumnStats, EmployeeSummary, Row } from '../types/data';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    return isNaN(n) ? null : n;
  }
  return null;
}

function normalize(key: string) {
  return key.toLowerCase().replace(/\s+/g, '');
}

function findTimeColumn(columns: ColumnMeta[], patterns: string[]) {
  // Exact match first (avoids "A M OffDuty" matching before "P M OffDuty")
  for (const p of patterns) {
    const exact = columns.find(
      (c) => c.type === 'time' && normalize(c.key) === p
    );
    if (exact) return exact;
  }

  // Fallback to includes
  return columns.find(
    (c) =>
      c.type === 'time' &&
      patterns.some((p) => normalize(c.key).includes(p))
  );
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdDev(values: number[], mean: number): number {
  const sumSq = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return Math.sqrt(sumSq / values.length);
}

export function computeStats(rows: Row[], columns: ColumnMeta[]): ColumnStats[] {
  return columns
    .filter((col) => col.type === 'numeric')
    .map((col) => {
      const allValues = rows.map((r) => r[col.key]);
      const missing = allValues.filter((v) => v === null || v === undefined || v === '').length;
      const nums = allValues.map(toNumber).filter((n): n is number => n !== null);

      if (nums.length === 0) {
        return {
          key: col.key, label: col.label, count: 0, missing,
          min: 0, max: 0, sum: 0, mean: 0, median: 0, stdDev: 0,
        };
      }

      const sorted = [...nums].sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;

      return {
        key: col.key, label: col.label, count: nums.length, missing,
        min: sorted[0], max: sorted[sorted.length - 1],
        sum, mean: avg, median: median(sorted), stdDev: stdDev(nums, avg),
      };
    });
}

function parseTimeString(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = Math.round(minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function computeAttendanceStats(rows: Row[], columns: ColumnMeta[]): EmployeeSummary[] {
  const userIdCol = columns.find((c) => {
    const lower = normalize(c.key);
    return ['userid', 'employeeid', 'idusuario'].some((p) => lower.includes(p));
  });
  const userNameCol = columns.find((c) => {
    const lower = normalize(c.key);
    return ['username', 'employeename', 'nombre', 'colaborador'].some((p) => lower.includes(p));
  });
  const clockInCol = findTimeColumn(columns, [
    'amonduty', 'clockin', 'checkin', 'entrada', 'onduty',
  ]);
  const clockOutCol = findTimeColumn(columns, [
    'pmoffduty', 'clockout', 'checkout', 'salida', 'offduty',
  ]);

  if (!userIdCol) return [];

  // Group by user
  const groups: Record<string, Row[]> = {};
  for (const row of rows) {
    const id = String(row[userIdCol.key] ?? 'unknown');
    if (!groups[id]) groups[id] = [];
    groups[id].push(row);
  }

  return Object.entries(groups).map(([userId, userRows]) => {
    const userName = userNameCol ? String(userRows[0][userNameCol.key] ?? userId) : userId;

    const hours: number[] = [];
    const entries: number[] = [];
    const exits: number[] = [];

    for (const row of userRows) {
      const decimal = row['_horasDecimal'];
      if (typeof decimal === 'number' && decimal > 0) {
        hours.push(decimal);
      }
      if (clockInCol) {
        const min = parseTimeString(row[clockInCol.key]);
        if (min !== null) entries.push(min);
      }
      if (clockOutCol) {
        const min = parseTimeString(row[clockOutCol.key]);
        if (min !== null) exits.push(min);
      }
    }

    const totalHours = hours.reduce((a, b) => a + b, 0);
    const daysPresent = hours.length;

    return {
      userId,
      userName,
      daysPresent,
      totalHours: parseFloat(totalHours.toFixed(2)),
      avgHoursPerDay: daysPresent > 0 ? parseFloat((totalHours / daysPresent).toFixed(2)) : 0,
      earliestEntry: entries.length > 0 ? minutesToTimeStr(Math.min(...entries)) : '—',
      latestExit: exits.length > 0 ? minutesToTimeStr(Math.max(...exits)) : '—',
    };
  }).sort((a, b) => b.totalHours - a.totalHours);
}
