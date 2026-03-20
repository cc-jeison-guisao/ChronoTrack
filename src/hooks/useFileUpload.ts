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
