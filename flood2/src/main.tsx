import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import './index.css';
import './i18n';
import { ThemeProvider } from './hooks/useTheme';
import { terrainCacheService } from './services/terrainCacheService';

// Initialize 3D Terrain Database Cache & Auto-Clearing Lifecycle
terrainCacheService.installInterceptor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
