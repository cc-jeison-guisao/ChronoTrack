import { DataProvider, useDataState } from './context/DataContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { ThemeProvider } from './context/ThemeContext';
import { FileDropZone } from './components/Upload/FileDropZone';
import { DashboardLayout } from './components/Layout/DashboardLayout';

function AppContent() {
  const { parsedData } = useDataState();
  return parsedData ? <DashboardLayout /> : <FileDropZone />;
}

function App() {
  return (
    <ThemeProvider>
      <ScheduleProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ScheduleProvider>
    </ThemeProvider>
  );
}

export default App;
