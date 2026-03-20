import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useDataStore, type DataState } from '../hooks/useDataStore';
import { computeStats, computeAttendanceStats } from '../utils/statsEngine';
import { suggestCharts } from '../utils/chartSuggester';
import { recomputeLateness } from '../utils/excelParser';
import { useScheduleState, getEmployeeLimits } from './ScheduleContext';
import type { ParsedData, ScheduleConfig } from '../types/data';

type Dispatch = {
  setLoading: () => void;
  setData: (data: ParsedData) => void;
  setError: (error: string) => void;
  reset: () => void;
};

const DataStateContext = createContext<DataState | null>(null);
const DataDispatchContext = createContext<Dispatch | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useDataStore();

  const actions: Dispatch = {
    setLoading: () => dispatch({ type: 'SET_LOADING' }),
    setData: (data) => dispatch({ type: 'SET_DATA', payload: data }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  const schedules = useScheduleState();
  const prevSchedulesRef = useRef<ScheduleConfig>(schedules);

  useEffect(() => {
    if (!state.parsedData) return;
    const { rows, columns, isAttendance } = state.parsedData;

    if (isAttendance) {
      dispatch({ type: 'SET_ATTENDANCE_SUMMARIES', payload: computeAttendanceStats(rows, columns) });
    } else {
      dispatch({ type: 'SET_STATS', payload: computeStats(rows, columns) });
    }

    dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: suggestCharts(columns, isAttendance) });
  }, [state.parsedData, dispatch]);

  // Recompute lateness when schedules change
  useEffect(() => {
    if (!state.parsedData?.isAttendance || !state.parsedData.attendanceKeys) return;
    if (Object.keys(schedules).length === 0) return;
    // Skip on first render (initial schedules match defaults)
    if (prevSchedulesRef.current === schedules) return;
    prevSchedulesRef.current = schedules;

    const { rows, columns, attendanceKeys } = state.parsedData;
    const updatedRows = recomputeLateness(rows, attendanceKeys, (dept, empId) =>
      getEmployeeLimits(schedules, dept, empId)
    );
    dispatch({
      type: 'SET_DATA',
      payload: { ...state.parsedData, rows: updatedRows, columns },
    });
  }, [schedules, state.parsedData, dispatch]);

  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={actions}>
        {children}
      </DataDispatchContext.Provider>
    </DataStateContext.Provider>
  );
}

export function useDataState() {
  const ctx = useContext(DataStateContext);
  if (!ctx) throw new Error('useDataState must be used within DataProvider');
  return ctx;
}

export function useDataDispatch() {
  const ctx = useContext(DataDispatchContext);
  if (!ctx) throw new Error('useDataDispatch must be used within DataProvider');
  return ctx;
}
