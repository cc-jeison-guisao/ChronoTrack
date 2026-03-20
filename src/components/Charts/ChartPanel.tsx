import { useState } from 'react';
import { useDataState } from '../../context/DataContext';
import { BarChartView } from './BarChartView';
import { LineChartView } from './LineChartView';
import { PieChartView } from './PieChartView';
import { ChartSelector } from './ChartSelector';
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
  const [customChart, setCustomChart] = useState<{ type: 'bar' | 'line' | 'pie'; xKey: string; yKey: string } | null>(null);

  if (!parsedData || parsedData.columns.length < 2) return null;

  const { rows, columns: allColumns } = parsedData;
  // Hide internal columns from the custom chart selector
  const columns = allColumns.filter((c) => !c.key.startsWith('_'));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Gráficos</h2>
      </div>

      {/* Auto-suggested charts */}
      {chartSuggestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {chartSuggestions.map((s, i) => (
            <ChartByType key={i} type={s.type} rows={rows} xKey={s.xKey} yKey={s.yKey} title={s.title} />
          ))}
        </div>
      )}

      {/* Custom chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Gráfico personalizado</h3>
          <ChartSelector
            columns={columns}
            chartType={customChart?.type ?? 'bar'}
            xKey={customChart?.xKey ?? columns[0].key}
            yKey={customChart?.yKey ?? (columns[1]?.key ?? columns[0].key)}
            onChangeType={(t) => setCustomChart((prev) => ({ type: t, xKey: prev?.xKey ?? columns[0].key, yKey: prev?.yKey ?? columns[1]?.key ?? columns[0].key }))}
            onChangeX={(k) => setCustomChart((prev) => ({ type: prev?.type ?? 'bar', xKey: k, yKey: prev?.yKey ?? columns[1]?.key ?? columns[0].key }))}
            onChangeY={(k) => setCustomChart((prev) => ({ type: prev?.type ?? 'bar', xKey: prev?.xKey ?? columns[0].key, yKey: k }))}
          />
        </div>
        <ChartByType
          type={customChart?.type ?? 'bar'}
          rows={rows}
          xKey={customChart?.xKey ?? columns[0].key}
          yKey={customChart?.yKey ?? (columns[1]?.key ?? columns[0].key)}
          title="Gráfico personalizado"
        />
      </div>
    </div>
  );
}
