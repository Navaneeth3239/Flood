
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Direct import for essential dashboard & telemetry routes
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveMonitoringPage } from '@/pages/LiveMonitoringPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { StationsPage } from '@/pages/StationsPage';
import { PredictionPage } from '@/pages/PredictionPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { EmergencyPage } from '@/pages/EmergencyPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { SystemHealthPage } from '@/pages/SystemHealthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Lazy-loaded heavy geospatial & 3D WebGL routes per engineering requirements
const MapPage = lazy(() =>
  import('@/pages/MapPage').then((m) => ({ default: m.MapPage }))
);
const TerrainPage = lazy(() =>
  import('@/pages/TerrainPage').then((m) => ({ default: m.TerrainPage }))
);
const SatellitePage = lazy(() =>
  import('@/pages/SatellitePage').then((m) => ({ default: m.SatellitePage }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="live" element={<LiveMonitoringPage />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading GIS flood mapping engine..." size="lg" />}>
                <MapPage />
              </Suspense>
            }
          />
          <Route path="prediction" element={<PredictionPage />} />
          <Route
            path="terrain"
            element={
              <Suspense fallback={<LoadingSpinner label="Initializing CesiumJS 3D GIS terrain viewer..." size="lg" />}>
                <TerrainPage />
              </Suspense>
            }
          />
          <Route
            path="satellite"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading satellite comparison viewer..." size="lg" />}>
                <SatellitePage />
              </Suspense>
            }
          />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="health" element={<SystemHealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
