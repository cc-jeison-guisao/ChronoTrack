import { useDataState } from '../../context/DataContext';
import { BarChartView } from './BarChartView';
import { LineChartView } from './LineChartView';
import { PieChartView } from './PieChartView';
import { LateVsOnTimeChart } from './LateVsOnTimeChart';
import type { Row } from '../../types/data';

function ChartByType({ type, rows, xKey, yKey, title }: { type: string; rows: Row[]; xKey: string; yKey: string; title: string }) {
  const props = { rows, xKey, yKey, title };
  switch (type) {
    case 'bar': return <BarChartView {...props} />;
    case 'line': return <LineChartView {...props} />;
    case 'pie': return <PieChartView {...props} />;
    default: return null;
  }
}

export function ChartPanel() {
  const { parsedData, chartSuggestions } = useDataState();

  if (!parsedData || parsedData.columns.length < 2) return null;

  const { rows } = parsedData;
  const isAttendance = parsedData.isAttendance;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gráficos</h2>
      </div>

      {/* Auto-suggested charts */}
      {chartSuggestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {chartSuggestions.map((s, i) => (
            <ChartByType key={i} type={s.type} rows={rows} xKey={s.xKey} yKey={s.yKey} title={s.title} />
          ))}
        </div>
      )}

      {/* Late vs On-time chart (attendance mode only) */}
      {isAttendance && (
        <LateVsOnTimeChart rows={rows} />
      )}
    </div>
  );
}
