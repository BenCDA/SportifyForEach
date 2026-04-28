import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#FFFFFF',
          border: '1px solid rgba(26,26,26,0.12)',
          color: '#1A1A1A',
          borderRadius: '0',
          fontFamily: '"Inter Tight", system-ui, sans-serif',
          fontSize: '13px',
        },
      }}
    />
  </React.StrictMode>,
);
