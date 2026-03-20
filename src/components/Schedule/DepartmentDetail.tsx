import { useCallback, useMemo } from 'react';
import { useScheduleState, useScheduleDispatch, minutesToTimeStr, timeStrToMinutes } from '../../context/ScheduleContext';

interface Props {
  department: string;
  onBack: () => void;
}

export function DepartmentDetail({ department, onBack }: Props) {
  const schedules = useScheduleState();
  const { setDepartmentSchedule, setEmployeeSchedule, resetEmployeeSchedule } = useScheduleDispatch();

  const deptSchedule = schedules[department];

  const deptEntry = deptSchedule ? minutesToTimeStr(deptSchedule.entryTime) : '08:00';
  const deptExit = deptSchedule ? minutesToTimeStr(deptSchedule.exitTime) : '18:00';

  const employees = useMemo(() => {
    if (!deptSchedule) return [];
    return deptSchedule.employees;
  }, [deptSchedule]);

  const handleDeptEntryChange = useCallback((value: string) => {
    if (!value || !deptSchedule) return;
    setDepartmentSchedule(department, timeStrToMinutes(value), deptSchedule.exitTime);
  }, [department, deptSchedule, setDepartmentSchedule]);

  const handleDeptExitChange = useCallback((value: string) => {
    if (!value || !deptSchedule) return;
    setDepartmentSchedule(department, deptSchedule.entryTime, timeStrToMinutes(value));
  }, [department, deptSchedule, setDepartmentSchedule]);

  const handleEmpEntryChange = useCallback((employeeId: string, value: string) => {
    if (!value) return;
    const emp = deptSchedule?.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    setEmployeeSchedule(department, employeeId, timeStrToMinutes(value), emp.exitTime);
  }, [department, deptSchedule, setEmployeeSchedule]);

  const handleEmpExitChange = useCallback((employeeId: string, value: string) => {
    if (!value) return;
    const emp = deptSchedule?.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    setEmployeeSchedule(department, employeeId, emp.entryTime, timeStrToMinutes(value));
  }, [department, deptSchedule, setEmployeeSchedule]);

  const hasCustomSchedule = useCallback((emp: { entryTime: number | null; exitTime: number | null }) => {
    return emp.entryTime !== null || emp.exitTime !== null;
  }, []);

  if (!deptSchedule) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Departamento no encontrado</p>
        <button onClick={onBack} className="mt-2 text-blue-600 text-sm hover:underline">Volver</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver a departamentos
        </button>
        <h3 className="text-xl font-bold text-gray-900">{department}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {employees.length} {employees.length === 1 ? 'colaborador' : 'colaboradores'}
        </p>
      </div>

      {/* Department-wide schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Horario general del departamento</h4>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora de entrada</label>
            <input
              type="time"
              value={deptEntry}
              onChange={(e) => handleDeptEntryChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora de salida</label>
            <input
              type="time"
              value={deptExit}
              onChange={(e) => handleDeptExitChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Este horario aplica a todos los colaboradores del departamento que no tengan un horario personalizado.
        </p>
      </div>

      {/* Employee list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">Horarios individuales</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {employees.map((emp) => {
            const isCustom = hasCustomSchedule(emp);
            const displayEntry = emp.entryTime !== null
              ? minutesToTimeStr(emp.entryTime)
              : deptEntry;
            const displayExit = emp.exitTime !== null
              ? minutesToTimeStr(emp.exitTime)
              : deptExit;

            return (
              <div key={emp.employeeId} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {emp.employeeName.charAt(0).toUpperCase()}
                </div>

                {/* Name & ID */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.employeeName}</p>
                    {isCustom && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">ID: {emp.employeeId}</p>
                </div>

                {/* Time inputs */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Entrada</label>
                    <input
                      type="time"
                      value={displayEntry}
                      onChange={(e) => handleEmpEntryChange(emp.employeeId, e.target.value)}
                      className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isCustom ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Salida</label>
                    <input
                      type="time"
                      value={displayExit}
                      onChange={(e) => handleEmpExitChange(emp.employeeId, e.target.value)}
                      className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isCustom ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                      }`}
                    />
                  </div>

                  {/* Reset button */}
                  {isCustom && (
                    <button
                      onClick={() => resetEmployeeSchedule(department, emp.employeeId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Restaurar horario del departamento"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
