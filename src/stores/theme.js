import { writable, derived } from 'svelte/store';

export const currentTheme = writable('electricAurora');
export const themeTransitionDuration = writable(300); // ms
export const customThemes = writable({});
export const glassmorphismIntensity = writable(0.7);

// Combined themes (built-in + custom)
export const allThemes = derived([customThemes], ([$customThemes]) => ({
  ...themes,
  ...$customThemes
}));

export const themes = {
  electricAurora: {
    name: 'Electric Aurora',
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a25',
    bgCard: 'rgba(26, 26, 37, 0.7)',
    accentPrimary: '#00d4ff',
    accentSecondary: '#00a8cc',
    accentGlow: 'rgba(0, 212, 255, 0.4)',
    accentDim: 'rgba(0, 212, 255, 0.1)',
    success: '#00ff9d',
    warning: '#ffb800',
    error: '#ff4757',
    info: '#00d4ff',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0b0',
    textMuted: '#606070',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a0a1a',
    bgTertiary: '#2a102a',
    bgCard: 'rgba(42, 16, 42, 0.7)',
    accentPrimary: '#ff00ff',
    accentSecondary: '#ff66ff',
    accentGlow: 'rgba(255, 0, 255, 0.4)',
    accentDim: 'rgba(255, 0, 255, 0.1)',
    success: '#00ff66',
    warning: '#ffff00',
    error: '#ff0066',
    info: '#ff00ff',
    textPrimary: '#ffffff',
    textSecondary: '#e0a0e0',
    textMuted: '#804080',
  },
  solarizedDark: {
    name: 'Solarized Dark',
    bgPrimary: '#002b36',
    bgSecondary: '#073642',
    bgTertiary: '#0a3d4a',
    bgCard: 'rgba(10, 61, 74, 0.7)',
    accentPrimary: '#268bd2',
    accentSecondary: '#2aa198',
    accentGlow: 'rgba(38, 139, 210, 0.4)',
    accentDim: 'rgba(38, 139, 210, 0.1)',
    success: '#859900',
    warning: '#b58900',
    error: '#dc322f',
    info: '#268bd2',
    textPrimary: '#fdf6e3',
    textSecondary: '#93a1a1',
    textMuted: '#657b83',
  },
  dracula: {
    name: 'Dracula',
    bgPrimary: '#282a36',
    bgSecondary: '#44475a',
    bgTertiary: '#6272a4',
    bgCard: 'rgba(68, 71, 90, 0.7)',
    accentPrimary: '#bd93f9',
    accentSecondary: '#ff79c6',
    accentGlow: 'rgba(189, 147, 249, 0.4)',
    accentDim: 'rgba(189, 147, 249, 0.1)',
    success: '#50fa7b',
    warning: '#f1fa8c',
    error: '#ff5555',
    info: '#8be9fd',
    textPrimary: '#f8f8f2',
    textSecondary: '#bfbfbf',
    textMuted: '#6272a4',
  },
  nord: {
    name: 'Nord',
    bgPrimary: '#2e3440',
    bgSecondary: '#3b4252',
    bgTertiary: '#434c5e',
    bgCard: 'rgba(59, 66, 82, 0.7)',
    accentPrimary: '#88c0d0',
    accentSecondary: '#81a1c1',
    accentGlow: 'rgba(136, 192, 208, 0.4)',
    accentDim: 'rgba(136, 192, 208, 0.1)',
    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    info: '#88c0d0',
    textPrimary: '#eceff4',
    textSecondary: '#d8dee9',
    textMuted: '#5e6779',
  },
  monokai: {
    name: 'Monokai',
    bgPrimary: '#272822',
    bgSecondary: '#383830',
    bgTertiary: '#49483e',
    bgCard: 'rgba(56, 56, 48, 0.7)',
    accentPrimary: '#f92672',
    accentSecondary: '#fd971f',
    accentGlow: 'rgba(249, 38, 114, 0.4)',
    accentDim: 'rgba(249, 38, 114, 0.1)',
    success: '#a6e22e',
    warning: '#e6db74',
    error: '#f92672',
    info: '#66d9ef',
    textPrimary: '#f8f8f2',
    textSecondary: '#cfcfc2',
    textMuted: '#75715e',
  },
  midnight: {
    name: 'Midnight Blue',
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    bgCard: 'rgba(33, 38, 45, 0.7)',
    accentPrimary: '#58a6ff',
    accentSecondary: '#79c0ff',
    accentGlow: 'rgba(88, 166, 255, 0.4)',
    accentDim: 'rgba(88, 166, 255, 0.1)',
    success: '#238636',
    warning: '#d29922',
    error: '#da3633',
    info: '#58a6ff',
    textPrimary: '#f0f6fc',
    textSecondary: '#c9d1d9',
    textMuted: '#8b949e',
  },
  forest: {
    name: 'Forest',
    bgPrimary: '#0a1a0a',
    bgSecondary: '#0f2f0f',
    bgTertiary: '#1a4a1a',
    bgCard: 'rgba(26, 74, 26, 0.7)',
    accentPrimary: '#4ade80',
    accentSecondary: '#22c55e',
    accentGlow: 'rgba(74, 222, 128, 0.4)',
    accentDim: 'rgba(74, 222, 128, 0.1)',
    success: '#86efac',
    warning: '#facc15',
    error: '#f87171',
    info: '#4ade80',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
    textMuted: '#4a7c59',
  },
  sunset: {
    name: 'Sunset',
    bgPrimary: '#1a0a0a',
    bgSecondary: '#2f1510',
    bgTertiary: '#4a2015',
    bgCard: 'rgba(74, 32, 21, 0.7)',
    accentPrimary: '#fb923c',
    accentSecondary: '#f97316',
    accentGlow: 'rgba(251, 146, 60, 0.4)',
    accentDim: 'rgba(251, 146, 60, 0.1)',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444',
    info: '#fb923c',
    textPrimary: '#fff7ed',
    textSecondary: '#fed7aa',
    textMuted: '#9a6b4a',
  },
  lavender: {
    name: 'Lavender',
    bgPrimary: '#1a0a1a',
    bgSecondary: '#251525',
    bgTertiary: '#362036',
    bgCard: 'rgba(54, 32, 54, 0.7)',
    accentPrimary: '#c084fc',
    accentSecondary: '#a855f7',
    accentGlow: 'rgba(192, 132, 252, 0.4)',
    accentDim: 'rgba(192, 132, 252, 0.1)',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f472b6',
    info: '#c084fc',
    textPrimary: '#faf5ff',
    textSecondary: '#e9d5ff',
    textMuted: '#8b6fa8',
  },
};

export function applyTheme(themeName, transitionDuration = 300) {
  const allThemes = { ...themes, ...$customThemes };
  const theme = allThemes[themeName];
  if (!theme) return;

  const root = document.documentElement;

  // Apply glassmorphism intensity
  const glassIntensity = $glassmorphismIntensity;
  const bgCard = theme.bgCard.includes('rgba') ?
    theme.bgCard.replace(/[\d.]+\)$/g, `${glassIntensity})`) :
    theme.bgCard;

  // Set CSS custom properties with transition
  const properties = {
    '--color-bg-primary': theme.bgPrimary,
    '--color-bg-secondary': theme.bgSecondary,
    '--color-bg-tertiary': theme.bgTertiary,
    '--color-bg-card': bgCard,
    '--color-accent-primary': theme.accentPrimary,
    '--color-accent-secondary': theme.accentSecondary,
    '--color-accent-glow': theme.accentGlow,
    '--color-accent-dim': theme.accentDim,
    '--color-success': theme.success,
    '--color-warning': theme.warning,
    '--color-error': theme.error,
    '--color-info': theme.info,
    '--color-text-primary': theme.textPrimary,
    '--color-text-secondary': theme.textSecondary,
    '--color-text-muted': theme.textMuted,
  };

  // Apply transition duration
  root.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);

  // Apply all properties
  Object.entries(properties).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });

  currentTheme.set(themeName);
  localStorage.setItem('bluest-teeth-theme', themeName);
  localStorage.setItem('bluest-teeth-glass-intensity', $glassmorphismIntensity.toString());
}

export function createCustomTheme(name, baseTheme) {
  const newTheme = { ...baseTheme, name, isCustom: true };
  customThemes.update(themes => ({ ...themes, [name]: newTheme }));
  saveCustomThemes();
  return name;
}

export function updateCustomThemeAccent(themeName, primaryColor, secondaryColor) {
  customThemes.update(themes => {
    if (themes[themeName]) {
      themes[themeName].accentPrimary = primaryColor;
      themes[themeName].accentSecondary = secondaryColor;
      themes[themeName].accentGlow = primaryColor.replace(')', ', 0.4)').replace('rgb', 'rgba');
      themes[themeName].accentDim = primaryColor.replace(')', ', 0.1)').replace('rgb', 'rgba');
    }
    return themes;
  });
  saveCustomThemes();
}

export function deleteCustomTheme(themeName) {
  customThemes.update(themes => {
    delete themes[themeName];
    return themes;
  });
  saveCustomThemes();
}

function saveCustomThemes() {
  customThemes.subscribe(themes => {
    localStorage.setItem('bluest-teeth-custom-themes', JSON.stringify(themes));
  });
}

export function loadCustomThemes() {
  const saved = localStorage.getItem('bluest-teeth-custom-themes');
  if (saved) {
    try {
      const themes = JSON.parse(saved);
      customThemes.set(themes);
    } catch (e) {
      console.error('Failed to load custom themes:', e);
    }
  }
}

export function setGlassmorphismIntensity(intensity) {
  glassmorphismIntensity.set(Math.max(0, Math.min(1, intensity)));
  localStorage.setItem('bluest-teeth-glass-intensity', intensity.toString());
  // Reapply current theme to update glassmorphism
  applyTheme($currentTheme, 0);
}

export function loadSavedTheme() {
  loadCustomThemes();

  const savedTheme = localStorage.getItem('bluest-teeth-theme');
  const savedGlassIntensity = localStorage.getItem('bluest-teeth-glass-intensity');

  if (savedGlassIntensity) {
    glassmorphismIntensity.set(parseFloat(savedGlassIntensity));
  }

  if (savedTheme) {
    // Check both built-in and custom themes
    const allThemes = { ...themes, ...$customThemes };
    if (allThemes[savedTheme]) {
      applyTheme(savedTheme, 0); // No transition on load
    }
  }
}
