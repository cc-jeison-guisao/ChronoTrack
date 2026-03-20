import { useEffect, useState } from 'react';
import { useDataState } from '../../context/DataContext';
import { useScheduleState, useScheduleDispatch, buildInitialSchedules } from '../../context/ScheduleContext';
import { DepartmentCards } from './DepartmentCards';
import { DepartmentDetail } from './DepartmentDetail';

export function ScheduleView() {
  const { parsedData } = useDataState();
  const schedules = useScheduleState();
  const { initSchedules } = useScheduleDispatch();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Initialize schedules from parsed data (lazy — only if empty)
  useEffect(() => {
    if (!parsedData?.isAttendance || !parsedData.attendanceKeys) return;
    if (Object.keys(schedules).length > 0) return;

    const { departmentKey, userIdKey, userNameKey } = parsedData.attendanceKeys;
    if (!departmentKey || !userIdKey || !userNameKey) return;

    const config = buildInitialSchedules(parsedData.rows, departmentKey, userIdKey, userNameKey);
    initSchedules(config);
  }, [parsedData, schedules, initSchedules]);

  if (!parsedData?.isAttendance) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Esta vista solo está disponible en modo de asistencia.</p>
      </div>
    );
  }

  const { attendanceKeys } = parsedData;
  if (!attendanceKeys?.departmentKey) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm">No se detectó una columna de departamento en el archivo.</p>
        <p className="text-xs text-gray-400 mt-1">Se requiere una columna llamada "Department", "Departamento", "Dept" o "Area".</p>
      </div>
    );
  }

  if (selectedDepartment) {
    return (
      <DepartmentDetail
        department={selectedDepartment}
        onBack={() => setSelectedDepartment(null)}
      />
    );
  }

  return <DepartmentCards onSelectDepartment={setSelectedDepartment} />;
}
