import { useDataState } from '../../context/DataContext';
import type { ViewType } from './Sidebar';

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  list: 'Lista de Registros',
  charts: 'Gráficas',
  schedule: 'Configuración de Horarios',
};

export function Header({ activeView }: { activeView: ViewType }) {
  const { parsedData } = useDataState();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{viewTitles[activeView]}</h2>
        {parsedData && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {parsedData.sheetName} — {parsedData.rows.length} registros
          </span>
        )}
      </div>
    </header>
  );
}
