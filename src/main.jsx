import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initAnalytics } from '@/lib/analytics.js';
import { initErrorTracking } from '@/lib/errorTracking.js';
import '@/index.css';

initErrorTracking();
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
