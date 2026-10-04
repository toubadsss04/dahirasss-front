import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
// Imported before the app so the language and its reading direction are on the
// document before the first paint, rather than swapping in after it.
import './i18n';
import './theme/tokens.css';
import './theme/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
