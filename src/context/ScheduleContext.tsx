import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ScheduleConfig, EmployeeSchedule } from '../types/data';

const DEFAULT_ENTRY = 480;  // 08:00
const DEFAULT_EXIT = 1080;  // 18:00

type Action =
  | { type: 'INIT'; payload: ScheduleConfig }
  | { type: 'SET_DEPT'; payload: { dept: string; entryTime: number; exitTime: number } }
  | { type: 'SET_EMPLOYEE'; payload: { dept: string; employeeId: string; entryTime: number | null; exitTime: number | null } }
  | { type: 'RESET_EMPLOYEE'; payload: { dept: string; employeeId: string } }
  | { type: 'RESET_ALL' };

function reducer(state: ScheduleConfig, action: Action): ScheduleConfig {
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'SET_DEPT': {
      const { dept, entryTime, exitTime } = action.payload;
      const existing = state[dept];
      if (!existing) return state;
      return { ...state, [dept]: { ...existing, entryTime, exitTime } };
    }
    case 'SET_EMPLOYEE': {
      const { dept, employeeId, entryTime, exitTime } = action.payload;
      const existing = state[dept];
      if (!existing) return state;
      return {
        ...state,
        [dept]: {
          ...existing,
          employees: existing.employees.map((e) =>
            e.employeeId === employeeId ? { ...e, entryTime, exitTime } : e
          ),
        },
      };
    }
    case 'RESET_EMPLOYEE': {
      const { dept, employeeId } = action.payload;
      const existing = state[dept];
      if (!existing) return state;
      return {
        ...state,
        [dept]: {
          ...existing,
          employees: existing.employees.map((e) =>
            e.employeeId === employeeId ? { ...e, entryTime: null, exitTime: null } : e
          ),
        },
      };
    }
    case 'RESET_ALL':
      return {};
  }
}

export function getEmployeeLimits(
  schedules: ScheduleConfig,
  dept: string | undefined,
  employeeId: string | undefined
): { entryLimit: number; exitLimit: number } {
  if (!dept || !schedules[dept]) {
    return { entryLimit: DEFAULT_ENTRY, exitLimit: DEFAULT_EXIT };
  }
  const deptSchedule = schedules[dept];
  if (employeeId) {
    const emp = deptSchedule.employees.find((e) => e.employeeId === employeeId);
    if (emp) {
      return {
        entryLimit: emp.entryTime ?? deptSchedule.entryTime,
        exitLimit: emp.exitTime ?? deptSchedule.exitTime,
      };
    }
  }
  return { entryLimit: deptSchedule.entryTime, exitLimit: deptSchedule.exitTime };
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function timeStrToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface ScheduleDispatch {
  initSchedules: (config: ScheduleConfig) => void;
  setDepartmentSchedule: (dept: string, entryTime: number, exitTime: number) => void;
  setEmployeeSchedule: (dept: string, employeeId: string, entryTime: number | null, exitTime: number | null) => void;
  resetEmployeeSchedule: (dept: string, employeeId: string) => void;
  resetAll: () => void;
}

const ScheduleStateContext = createContext<ScheduleConfig | null>(null);
const ScheduleDispatchContext = createContext<ScheduleDispatch | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {});

  const actions: ScheduleDispatch = useMemo(() => ({
    initSchedules: (config) => dispatch({ type: 'INIT', payload: config }),
    setDepartmentSchedule: (dept, entryTime, exitTime) =>
      dispatch({ type: 'SET_DEPT', payload: { dept, entryTime, exitTime } }),
    setEmployeeSchedule: (dept, employeeId, entryTime, exitTime) =>
      dispatch({ type: 'SET_EMPLOYEE', payload: { dept, employeeId, entryTime, exitTime } }),
    resetEmployeeSchedule: (dept, employeeId) =>
      dispatch({ type: 'RESET_EMPLOYEE', payload: { dept, employeeId } }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),
  }), []);

  return (
    <ScheduleStateContext.Provider value={state}>
      <ScheduleDispatchContext.Provider value={actions}>
        {children}
      </ScheduleDispatchContext.Provider>
    </ScheduleStateContext.Provider>
  );
}

export function useScheduleState() {
  const ctx = useContext(ScheduleStateContext);
  if (ctx === null) throw new Error('useScheduleState must be used within ScheduleProvider');
  return ctx;
}

export function useScheduleDispatch() {
  const ctx = useContext(ScheduleDispatchContext);
  if (!ctx) throw new Error('useScheduleDispatch must be used within ScheduleProvider');
  return ctx;
}

export function buildInitialSchedules(
  rows: Record<string, unknown>[],
  departmentKey: string,
  userIdKey: string,
  userNameKey: string
): ScheduleConfig {
  const deptMap = new Map<string, Map<string, string>>();

  for (const row of rows) {
    const dept = String(row[departmentKey] ?? '').trim();
    const empId = String(row[userIdKey] ?? '').trim();
    const empName = String(row[userNameKey] ?? '').trim();
    if (!dept || !empId) continue;

    if (!deptMap.has(dept)) deptMap.set(dept, new Map());
    const empMap = deptMap.get(dept)!;
    if (!empMap.has(empId)) empMap.set(empId, empName);
  }

  const config: ScheduleConfig = {};
  for (const [dept, empMap] of deptMap) {
    const employees: EmployeeSchedule[] = [];
    for (const [empId, empName] of empMap) {
      employees.push({ employeeId: empId, employeeName: empName, entryTime: null, exitTime: null });
    }
    config[dept] = {
      department: dept,
      entryTime: DEFAULT_ENTRY,
      exitTime: DEFAULT_EXIT,
      employees,
    };
  }
  return config;
}

export { DEFAULT_ENTRY, DEFAULT_EXIT };
