import XLSX from 'xlsx-js-style';
import type { Row, AttendanceKeys, ScheduleConfig } from '../types/data';
import { getEmployeeLimits, minutesToTimeStr } from '../context/ScheduleContext';

/* ── helpers ─────────────────────────────────────────────── */

/** Convert "HH:MM" 24h string to "h:mm a.m./p.m." */
function to12h(value: unknown): string {
  if (value === null || value === undefined || value === '—' || value === '') return '';
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return str;
  let h = parseInt(match[1]);
  const m = match[2];
  const suffix = h >= 12 ? 'p.m.' : 'a.m.';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

/** Parse "HH:MM" to minutes since midnight */
function parseMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '—' || value === '') return null;
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/** Format a Date to Spanish day label: "martes 01 de abril" */
function formatDayLabel(date: Date): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = days[date.getDay()];
  const dd = date.getDate().toString().padStart(2, '0');
  const mon = months[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${d} ${dd} de ${mon} del ${yyyy}`;
}

/** Normalize a date value to "YYYY-MM-DD" string for grouping */
function normalizeDateKey(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const d = value.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string') {
    // Try ISO-ish formats
    const match = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[0];
    // Try dd/mm/yyyy
    const match2 = value.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (match2) return `${match2[3]}-${match2[2].padStart(2, '0')}-${match2[1].padStart(2, '0')}`;
  }
  return null;
}

/* ── styles ──────────────────────────────────────────────── */

const HEADER_STYLE: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } },
  },
};

const SUB_HEADER_STYLE: XLSX.CellStyle = {
  font: { bold: true, sz: 10 },
  fill: { fgColor: { rgb: 'D6E4F0' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } },
  },
};

const CELL_BORDER: XLSX.CellStyle['border'] = {
  top: { style: 'thin', color: { rgb: 'E0E0E0' } },
  bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
  left: { style: 'thin', color: { rgb: 'E0E0E0' } },
  right: { style: 'thin', color: { rgb: 'E0E0E0' } },
};

function greenCell(value: string): XLSX.CellObject {
  return {
    v: value, t: 's',
    s: {
      font: { color: { rgb: '006100' }, sz: 10 },
      fill: { fgColor: { rgb: 'C6EFCE' } },
      alignment: { horizontal: 'center' },
      border: CELL_BORDER,
    },
  };
}

function redCell(value: string): XLSX.CellObject {
  return {
    v: value, t: 's',
    s: {
      font: { color: { rgb: '9C0006' }, sz: 10 },
      fill: { fgColor: { rgb: 'FFC7CE' } },
      alignment: { horizontal: 'center' },
      border: CELL_BORDER,
    },
  };
}

function plainCell(value: string): XLSX.CellObject {
  return {
    v: value, t: 's',
    s: {
      alignment: { horizontal: 'center' },
      border: CELL_BORDER,
    },
  };
}

function textCell(value: string): XLSX.CellObject {
  return {
    v: value, t: 's',
    s: {
      alignment: { horizontal: 'left' },
      border: CELL_BORDER,
    },
  };
}

/* ── main export ─────────────────────────────────────────── */

interface EmployeeDayData {
  entrada: string; // "HH:MM" 24h from parsed data
  salida: string;
}

export function exportAttendanceExcel(rows: Row[], keys: AttendanceKeys, schedules: ScheduleConfig = {}): void {
  const {
    departmentKey,
    userIdKey,
    userNameKey,
    dateKey,
    clockInKey,
    clockOutKey,
  } = keys;

  if (!dateKey || !clockInKey || !clockOutKey) return;

  // ── 1. Collect unique dates (sorted) and build per-employee map ──
  const dateSet = new Set<string>();
  // Map: empUniqueKey -> { team, userId, userName, days: { dateKey: { entrada, salida } } }
  const empMap = new Map<string, {
    team: string;
    userId: string;
    userName: string;
    days: Map<string, EmployeeDayData>;
  }>();

  for (const row of rows) {
    const dk = normalizeDateKey(row[dateKey]);
    if (!dk) continue;
    dateSet.add(dk);

    const uid = userIdKey ? String(row[userIdKey] ?? '').trim() : '';
    const uname = userNameKey ? String(row[userNameKey] ?? '').trim() : '';
    const team = departmentKey ? String(row[departmentKey] ?? '').trim() : '';
    const empKey = uid || uname;
    if (!empKey) continue;

    if (!empMap.has(empKey)) {
      empMap.set(empKey, { team, userId: uid, userName: uname, days: new Map() });
    }

    const entrada = String(row[clockInKey] ?? '').trim();
    const salida = String(row[clockOutKey] ?? '').trim();
    empMap.get(empKey)!.days.set(dk, { entrada, salida });
  }

  const sortedDates = Array.from(dateSet).sort();

  // ── 2. Build worksheet data (2 header rows + data rows) ──
  // Fixed columns: Team, User ID, User Name, Check-in time (Entrada), Check-in time (Salida)
  // Then for each date: Entrada, Salida
  const FIXED_COLS = 3; // Team, User ID, User Name
  const CHECKIN_COLS = 3; // Entrada base, Salida base, Observación
  // Row 0: main headers (with merges)
  // Row 1: sub-headers (Entrada / Salida)
  const wsData: XLSX.CellObject[][] = [];

  // ── Header row 0 ──
  const headerRow: XLSX.CellObject[] = [];
  headerRow.push({ v: 'Team', t: 's', s: HEADER_STYLE });
  headerRow.push({ v: 'User ID', t: 's', s: HEADER_STYLE });
  headerRow.push({ v: 'User Name', t: 's', s: HEADER_STYLE });
  headerRow.push({ v: 'Check-in time', t: 's', s: HEADER_STYLE });
  headerRow.push({ v: '', t: 's', s: HEADER_STYLE }); // merged with prev
  headerRow.push({ v: '', t: 's', s: HEADER_STYLE }); // merged with prev (Observación)

  for (const dk of sortedDates) {
    const d = new Date(dk + 'T12:00:00');
    const label = formatDayLabel(d);
    headerRow.push({ v: label, t: 's', s: HEADER_STYLE });
    headerRow.push({ v: '', t: 's', s: HEADER_STYLE }); // merged with prev
    headerRow.push({ v: '', t: 's', s: HEADER_STYLE }); // merged with prev (Observación)
  }
  wsData.push(headerRow);

  // ── Header row 1: sub-headers ──
  const subRow: XLSX.CellObject[] = [];
  subRow.push({ v: '', t: 's', s: SUB_HEADER_STYLE }); // Team (merged from row 0)
  subRow.push({ v: '', t: 's', s: SUB_HEADER_STYLE }); // User ID
  subRow.push({ v: '', t: 's', s: SUB_HEADER_STYLE }); // User Name
  subRow.push({ v: 'Entrada', t: 's', s: SUB_HEADER_STYLE });
  subRow.push({ v: 'Salida', t: 's', s: SUB_HEADER_STYLE });
  subRow.push({ v: 'Observación', t: 's', s: SUB_HEADER_STYLE });

  for (let i = 0; i < sortedDates.length; i++) {
    subRow.push({ v: 'Entrada', t: 's', s: SUB_HEADER_STYLE });
    subRow.push({ v: 'Salida', t: 's', s: SUB_HEADER_STYLE });
    subRow.push({ v: 'Observación', t: 's', s: SUB_HEADER_STYLE });
  }
  wsData.push(subRow);

  // ── Data rows ──

  for (const [, emp] of empMap) {
    const row: XLSX.CellObject[] = [];
    row.push(textCell(emp.team));
    row.push(plainCell(emp.userId));
    row.push(textCell(emp.userName));

    // Get employee's scheduled entry/exit from ScheduleConfig
    const { entryLimit, exitLimit } = getEmployeeLimits(
      schedules,
      emp.team || undefined,
      emp.userId || undefined
    );
    const scheduledEntry12 = to12h(minutesToTimeStr(entryLimit));
    const scheduledExit12 = to12h(minutesToTimeStr(exitLimit));

    row.push(plainCell(scheduledEntry12));
    row.push(plainCell(scheduledExit12));
    row.push(plainCell('')); // Observación base

    // Day columns — use employee's scheduled entry as late threshold
    for (const dk of sortedDates) {
      const dayData = emp.days.get(dk);
      if (!dayData) {
        row.push(plainCell(''));
        row.push(plainCell(''));
        row.push(plainCell('')); // Observación
        continue;
      }
      const ent12 = to12h(dayData.entrada);
      const sal12 = to12h(dayData.salida);
      const entMin = parseMinutes(dayData.entrada);

      if (ent12) {
        row.push(entMin !== null && entMin <= entryLimit
          ? greenCell(ent12) : redCell(ent12));
      } else {
        row.push(plainCell(''));
      }
      row.push(plainCell(sal12));
      row.push(plainCell('')); // Observación
    }

    wsData.push(row);
  }

  // ── 3. Build worksheet ──
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // ── Merges ──
  const merges: XLSX.Range[] = [];
  // Fixed columns: merge row 0 & row 1 vertically
  for (let c = 0; c < FIXED_COLS; c++) {
    merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  }
  // "Check-in time" header: merge 3 cols horizontally in row 0
  merges.push({ s: { r: 0, c: FIXED_COLS }, e: { r: 0, c: FIXED_COLS + 2 } });
  // Each date header: merge 3 cols horizontally in row 0
  for (let i = 0; i < sortedDates.length; i++) {
    const startCol = FIXED_COLS + CHECKIN_COLS + i * 3;
    merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 2 } });
  }
  ws['!merges'] = merges;

  // ── Column widths (auto-fit approximation) ──
  const colWidths: XLSX.ColInfo[] = [];
  colWidths.push({ wch: 18 }); // Team
  colWidths.push({ wch: 10 }); // User ID
  colWidths.push({ wch: 22 }); // User Name
  colWidths.push({ wch: 14 }); // Base Entrada
  colWidths.push({ wch: 14 }); // Base Salida
  colWidths.push({ wch: 18 }); // Base Observación
  for (let i = 0; i < sortedDates.length; i++) {
    colWidths.push({ wch: 14 }); // Entrada
    colWidths.push({ wch: 14 }); // Salida
    colWidths.push({ wch: 18 }); // Observación
  }
  ws['!cols'] = colWidths;

  // ── Freeze top 2 rows ──
  ws['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', state: 'frozen' };
  // Also try the views approach for broader compatibility
  if (!ws['!views']) ws['!views'] = [];
  (ws['!views'] as Array<Record<string, unknown>>).push({
    state: 'frozen',
    ySplit: 2,
    xSplit: FIXED_COLS,
    topLeftCell: XLSX.utils.encode_cell({ r: 2, c: FIXED_COLS }),
  });

  // ── 4. Write and download ──
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

  XLSX.writeFile(wb, 'control_asistencia.xlsx');
}
