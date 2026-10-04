import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Notifications from './components/layout/Notifications';
import UpdatePrompt from './components/layout/UpdatePrompt';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/authStore';
import { isRtl } from './i18n';
import { THEME_MODES, useUiStore } from './store/uiStore';
import { cacheFor } from './theme/emotionCache';
import { createAppTheme } from './theme/muiTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30000 },
  },
});

/**
 * Application root: theme, data cache, router and session restoration.
 *
 * The stylesheet owns the page chrome, so no Material UI baseline is mounted.
 * The Material UI theme exists only so dialogs, dropdowns and alerts inherit
 * the same palette as the rest of the design.
 *
 * @returns {JSX.Element} The application.
 */
export default function App() {
  // Subscribing to the language is what rebuilds the theme and swaps the style
  // cache when it changes. Without it the previous direction's rules would stay
  // in the page until a reload.
  useTranslation();
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const themeMode = useUiStore((state) => state.themeMode);
  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  const [systemTheme, setSystemTheme] = useState(() => resolvedTheme());

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (themeMode !== THEME_MODES.SYSTEM) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(query.matches ? 'dark' : 'light');
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [themeMode]);

  const mode = themeMode === THEME_MODES.SYSTEM ? systemTheme : themeMode;
  const rightToLeft = isRtl();
  const theme = useMemo(
    () => createAppTheme(mode, rightToLeft ? 'rtl' : 'ltr'),
    [mode, rightToLeft],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={cacheFor(rightToLeft)}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Notifications />
          <UpdatePrompt />
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
}
