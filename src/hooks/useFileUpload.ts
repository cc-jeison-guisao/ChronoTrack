import { useCallback } from 'react';
import { parseExcel } from '../utils/excelParser';
import { useDataDispatch } from '../context/DataContext';

const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export function useFileUpload() {
  const { setLoading, setData, setError } = useDataDispatch();

  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!VALID_EXTENSIONS.includes(ext)) {
        setError('Formato no soportado. Usa archivos .xlsx, .xls o .csv');
        return;
      }

      setLoading();

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const data = parseExcel(buffer);
          if (data.rows.length === 0) {
            setError('El archivo está vacío o no contiene datos válidos.');
            return;
          }
          if (!data.isAttendance) {
            const missing: string[] = [];
            const keys = data.attendanceKeys;
            if (!keys?.clockInKey) missing.push('Hora de entrada (A M OnDuty / Clock In / Entrada)');
            if (!keys?.clockOutKey) missing.push('Hora de salida (P M OffDuty / Clock Out / Salida)');
            if (!keys?.userIdKey && !keys?.userNameKey) missing.push('Identificación del colaborador (User ID / Nombre)');
            if (!keys?.dateKey) missing.push('Fecha (Date / Fecha)');
            setError(`El archivo no contiene las columnas necesarias para asistencia.\n\nColumnas faltantes:\n• ${missing.join('\n• ')}`);
            return;
          }
          setData(data);
        } catch {
          setError('Error al leer el archivo. Asegúrate de que sea un Excel válido.');
        }
      };
      reader.onerror = () => setError('Error al leer el archivo.');
      reader.readAsArrayBuffer(file);
    },
    [setLoading, setData, setError]
  );

  return { processFile };
}
