import { DataProvider, useDataState } from './context/DataContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { FileDropZone } from './components/Upload/FileDropZone';
import { DashboardLayout } from './components/Layout/DashboardLayout';

function AppContent() {
  const { parsedData } = useDataState();
  return parsedData ? <DashboardLayout /> : <FileDropZone />;
}

function App() {
  return (
    <ScheduleProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ScheduleProvider>
  );
}

export default App;
