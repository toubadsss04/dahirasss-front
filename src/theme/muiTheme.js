import { createTheme } from '@mui/material/styles';

/**
 * Colour values mirroring src/theme/tokens.css.
 *
 * Material UI needs real colour values rather than CSS variables, because it
 * derives hover and disabled states arithmetically. Keeping both in step is
 * the price of having MUI dialogs and dropdowns match the rest of the design.
 */
const PALETTES = {
  light: {
    ground: '#f4f3ee',
    surface: '#ffffff',
    surface2: '#faf9f5',
    ink: '#161f1d',
    muted: '#5d6b66',
    faint: '#8a958f',
    line: '#e4e1d8',
    pine2: '#12726b',
    gold: '#b98524',
    pos: '#1f8a5b',
    neg: '#c0442e',
    warn: '#b5892a',
  },
  dark: {
    ground: '#0c1210',
    surface: '#121b18',
    surface2: '#0f1714',
    ink: '#e9efeb',
    muted: '#9db0aa',
    faint: '#72827c',
    line: '#25322d',
    pine2: '#57c0b4',
    gold: '#d8ab55',
    pos: '#4cc38a',
    neg: '#e57a62',
    warn: '#d8ab55',
  },
};

const SANS = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", Georgia, "Times New Roman", serif';

/**
 * Fields must not go below this size on touch screens.
 *
 * Safari on iOS zooms the page as soon as the caret enters a field whose text
 * is smaller, and never zooms back out. Sizing the text up is the fix that
 * keeps pinch to zoom working, unlike locking the viewport scale.
 */
const TOUCH_QUERY = '@media (pointer: coarse), (max-width: 820px)';
const TOUCH_FIELD_SIZE = '16px';

/**
 * Build the Material UI theme for a resolved colour mode.
 *
 * @param {'light' | 'dark'} mode Resolved mode, never the "system" setting.
 * @returns {import('@mui/material/styles').Theme} Theme matching the tokens.
 */
export function createAppTheme(mode, direction = 'ltr') {
  const colors = PALETTES[mode] ?? PALETTES.light;

  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: colors.pine2, contrastText: mode === 'dark' ? '#04211d' : '#ffffff' },
      secondary: { main: colors.gold },
      success: { main: colors.pos },
      error: { main: colors.neg },
      warning: { main: colors.warn },
      background: { default: colors.ground, paper: colors.surface },
      text: { primary: colors.ink, secondary: colors.muted, disabled: colors.faint },
      divider: colors.line,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: SANS,
      fontSize: 15,
      h1: { fontFamily: SERIF },
      h2: { fontFamily: SERIF },
      h3: { fontFamily: SERIF },
      h6: { fontFamily: SERIF, fontSize: '18px', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.line}`,
            borderRadius: 14,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontFamily: SERIF, fontSize: '19px', fontWeight: 600 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            borderRadius: 10,
            fontSize: '14px',
            [TOUCH_QUERY]: { fontSize: TOUCH_FIELD_SIZE },
          },
          input: {
            [TOUCH_QUERY]: { fontSize: TOUCH_FIELD_SIZE },
          },
          notchedOutline: { borderColor: colors.line },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '14px',
            [TOUCH_QUERY]: { fontSize: TOUCH_FIELD_SIZE },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.line}`,
            borderRadius: 12,
            marginTop: 4,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '14px',
            [TOUCH_QUERY]: { fontSize: TOUCH_FIELD_SIZE },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.line}`,
            borderRadius: 12,
          },
          listbox: { maxHeight: 320 },
          option: {
            fontSize: '14px',
            [TOUCH_QUERY]: { fontSize: TOUCH_FIELD_SIZE },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: '12px', backgroundColor: colors.ink },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, fontSize: '13.5px' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, fontSize: '13.5px', padding: '9px 15px' },
        },
      },
    },
  });
}
