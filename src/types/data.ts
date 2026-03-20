export type ColumnType = 'numeric' | 'date' | 'categorical' | 'text' | 'time';

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  uniqueCount: number;
}

export interface ColumnStats {
  key: string;
  label: string;
  count: number;
  missing: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
}

export type Row = Record<string, string | number | Date | null>;

export interface AttendanceKeys {
  departmentKey?: string;
  userIdKey?: string;
  userNameKey?: string;
  dateKey?: string;
  clockInKey?: string;
  clockOutKey?: string;
  pmOnDutyKey?: string;
}

export interface ParsedData {
  rows: Row[];
  columns: ColumnMeta[];
  sheetName: string;
  sheetNames: string[];
  isAttendance: boolean;
  attendanceKeys?: AttendanceKeys;
}

export interface EmployeeSummary {
  userId: string;
  userName: string;
  daysPresent: number;
  totalHours: number;
  avgHoursPerDay: number;
  earliestEntry: string;
  latestExit: string;
}

export interface ChartSuggestion {
  type: 'bar' | 'line' | 'pie';
  xKey: string;
  yKey: string;
  title: string;
}

export interface EmployeeSchedule {
  employeeId: string;
  employeeName: string;
  entryTime: number | null;  // minutos desde medianoche, null = usa default del depto
  exitTime: number | null;
}

export interface DepartmentSchedule {
  department: string;
  entryTime: number;   // minutos desde medianoche (default 480 = 08:00)
  exitTime: number;    // minutos desde medianoche (default 1080 = 18:00)
  employees: EmployeeSchedule[];
}

export type ScheduleConfig = Record<string, DepartmentSchedule>;

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}
