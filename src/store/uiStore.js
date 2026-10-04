import { create } from 'zustand';

const THEME_KEY = 'daara.theme';

/** The three theme states: an explicit choice, or follow the system. */
export const THEME_MODES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

/** Colour of the browser and system bars, per resolved theme. */
const BAR_COLORS = { light: '#f4f3ee', dark: '#0c1210' };

/**
 * Read the persisted theme preference.
 *
 * The light theme is the default rather than the system setting: this is a
 * daytime bookkeeping tool, and a phone left in dark mode should not decide
 * how a ledger is read.
 *
 * @returns {string} One of the theme modes, defaulting to light.
 */
function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return Object.values(THEME_MODES).includes(stored) ? stored : THEME_MODES.LIGHT;
  } catch {
    return THEME_MODES.LIGHT;
  }
}

/**
 * Stamp the chosen theme on the root element.
 *
 * The system setting stamps nothing, leaving the media query in charge.
 *
 * @param {string} mode One of the theme modes.
 */
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === THEME_MODES.SYSTEM) {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }

  // Installed on a phone the status bar sits against the page, so its colour
  // has to follow the theme rather than a media query the app no longer obeys.
  const resolved =
    mode === THEME_MODES.SYSTEM
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BAR_COLORS[resolved]);
}

/** Interface state: theme preference and mobile drawer. */
export const useUiStore = create((set, get) => ({
  themeMode: readStoredTheme(),
  isSidebarOpen: false,

  /**
   * Set the theme preference and persist it.
   *
   * @param {string} mode One of the theme modes.
   */
  setThemeMode(mode) {
    applyTheme(mode);
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* Blocked site data is tolerated, the choice just will not persist. */
    }
    set({ themeMode: mode });
  },

  /** Cycle between the light and dark themes. */
  toggleTheme() {
    const resolved = get().resolvedTheme();
    get().setThemeMode(resolved === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK);
  },

  /**
   * Resolve the effective theme, turning the system setting into a real mode.
   *
   * @returns {'light' | 'dark'} The mode actually in effect.
   */
  resolvedTheme() {
    const { themeMode } = get();
    if (themeMode !== THEME_MODES.SYSTEM) return themeMode;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? THEME_MODES.DARK : THEME_MODES.LIGHT;
  },

  /** Open or close the mobile navigation drawer. */
  toggleSidebar() {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  /** Close the mobile navigation drawer. */
  closeSidebar() {
    set({ isSidebarOpen: false });
  },
}));

applyTheme(useUiStore.getState().themeMode);
