import { useEffect, useState } from 'react';
import { useDataState, useDataDispatch } from '../../context/DataContext';
import { useScheduleState } from '../../context/ScheduleContext';
import { Sidebar, type ViewType } from './Sidebar';
import { Header } from './Header';
import { StatsSummary } from '../Stats/StatsSummary';
import { ChartPanel } from '../Charts/ChartPanel';
import { DataTable } from '../Table/DataTable';
import { ScheduleView } from '../Schedule/ScheduleView';
import { EmployeeDetail } from '../Employee/EmployeeDetail';
import { DashboardDepartmentDetail } from '../Stats/DashboardDepartmentDetail';

export function DashboardLayout() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<{ name: string; colorIndex: number } | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { parsedData } = useDataState();
  const { reset } = useDataDispatch();
  const schedules = useScheduleState();
  const isAttendance = parsedData?.isAttendance ?? false;
  const hasDepartmentKey = !!parsedData?.attendanceKeys?.departmentKey;
  const schedulesNotConfigured = Object.keys(schedules).length === 0;
  const showAlert = isAttendance && hasDepartmentKey && schedulesNotConfigured && !alertDismissed;

  // Clear sub-navigation when switching views
  useEffect(() => {
    setSelectedEmployeeId(null);
    setSelectedDepartment(null);
  }, [activeView]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeView={activeView}
        onChangeView={setActiveView}
        onReset={reset}
        isAttendance={isAttendance}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeView={activeView} />
        <main className="flex-1 p-6 overflow-auto">
          {showAlert && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="flex-1 text-sm text-amber-800">
                Los horarios de entrada y salida usan valores por defecto (08:00 - 18:00).{' '}
                <button
                  onClick={() => setActiveView('schedule')}
                  className="font-semibold underline hover:text-amber-900"
                >
                  Configurar horarios por departamento
                </button>
              </p>
              <button
                onClick={() => setAlertDismissed(true)}
                className="text-amber-400 hover:text-amber-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {activeView === 'dashboard' && (
            selectedEmployeeId && selectedDepartment
              ? <EmployeeDetail employeeId={selectedEmployeeId} onBack={() => setSelectedEmployeeId(null)} />
              : selectedDepartment
                ? <DashboardDepartmentDetail
                    department={selectedDepartment.name}
                    colorIndex={selectedDepartment.colorIndex}
                    onBack={() => setSelectedDepartment(null)}
                    onSelectEmployee={setSelectedEmployeeId}
                  />
                : <StatsSummary onSelectDepartment={(dept, idx) => setSelectedDepartment({ name: dept, colorIndex: idx })} />
          )}
          {activeView === 'list' && (
            selectedEmployeeId
              ? <EmployeeDetail employeeId={selectedEmployeeId} onBack={() => setSelectedEmployeeId(null)} />
              : <DataTable onSelectEmployee={setSelectedEmployeeId} />
          )}
          {activeView === 'charts' && <ChartPanel />}
          {activeView === 'schedule' && <ScheduleView />}
        </main>
      </div>
    </div>
  );
}
