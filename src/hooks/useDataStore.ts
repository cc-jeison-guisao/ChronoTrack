import { useReducer } from 'react';
import type { ChartSuggestion, ColumnStats, EmployeeSummary, ParsedData } from '../types/data';

export interface DataState {
  parsedData: ParsedData | null;
  stats: ColumnStats[];
  chartSuggestions: ChartSuggestion[];
  attendanceSummaries: EmployeeSummary[];
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_DATA'; payload: ParsedData }
  | { type: 'SET_STATS'; payload: ColumnStats[] }
  | { type: 'SET_CHART_SUGGESTIONS'; payload: ChartSuggestion[] }
  | { type: 'SET_ATTENDANCE_SUMMARIES'; payload: EmployeeSummary[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: DataState = {
  parsedData: null,
  stats: [],
  chartSuggestions: [],
  attendanceSummaries: [],
  isLoading: false,
  error: null,
};

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_DATA':
      return { ...state, parsedData: action.payload, isLoading: false, error: null };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_CHART_SUGGESTIONS':
      return { ...state, chartSuggestions: action.payload };
    case 'SET_ATTENDANCE_SUMMARIES':
      return { ...state, attendanceSummaries: action.payload };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'RESET':
      return initialState;
  }
}

export function useDataStore() {
  return useReducer(reducer, initialState);
}
