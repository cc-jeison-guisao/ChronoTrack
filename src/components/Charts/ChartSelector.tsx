import type { ColumnMeta } from '../../types/data';

interface Props {
  columns: ColumnMeta[];
  chartType: 'bar' | 'line' | 'pie';
  xKey: string;
  yKey: string;
  onChangeType: (t: 'bar' | 'line' | 'pie') => void;
  onChangeX: (key: string) => void;
  onChangeY: (key: string) => void;
}

export function ChartSelector({ columns, chartType, xKey, yKey, onChangeType, onChangeX, onChangeY }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap text-sm">
      <select value={chartType} onChange={(e) => onChangeType(e.target.value as 'bar' | 'line' | 'pie')} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5">
        <option value="bar">Barras</option>
        <option value="line">Líneas</option>
        <option value="pie">Circular</option>
      </select>
      <select value={xKey} onChange={(e) => onChangeX(e.target.value)} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5">
        {columns.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
      <span className="text-gray-400 dark:text-gray-500">vs</span>
      <select value={yKey} onChange={(e) => onChangeY(e.target.value)} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5">
        {columns.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}
