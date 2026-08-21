// Light / dark / system, expressed as a class on <html>.
//
// Two values are in play and they are not the same thing: the *preference*
// ('light' | 'dark' | 'system', persisted under `theme`) and the *colour mode*
// it currently resolves to ('light' | 'dark'). "System" only means anything if
// something keeps watching the media query, which is what `initialize` starts.

const STORAGE_KEY = 'theme';
export const THEME_EVENT = 'themechange';
export const THEME_PREFERENCES = ['light', 'dark', 'system'];

const prefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    // jsdom and very old browsers have no matchMedia — assume light.
    return false;
  }
};

class ThemeService {
  constructor() {
    this.mediaQuery = null;
    this.onSystemChange = null;
  }

  /** @returns {'light'|'dark'|'system'} what the user asked for. */
  getPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return THEME_PREFERENCES.includes(saved) ? saved : 'system';
    } catch {
      return 'system';
    }
  }

  /** @returns {'light'|'dark'} what a preference means right now. */
  resolve(preference = this.getPreference()) {
    return preference === 'system' ? (prefersDark() ? 'dark' : 'light') : preference;
  }

  /** @returns {'light'|'dark'} what is actually painted. */
  getCurrentColorMode() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /** Paint a colour mode. Does not touch the stored preference. */
  applyColorMode(colorMode) {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(colorMode === 'dark' ? 'dark' : 'light');
    root.style.colorScheme = colorMode === 'dark' ? 'dark' : 'light';
    // Legacy themes from an older version of the app, stripped on sight.
    root.removeAttribute('data-garden-theme');
    try {
      localStorage.removeItem('gardenTheme');
    } catch {
      // Storage can be unavailable (private mode); the class is what matters.
    }
  }

  /** Store a preference, paint it, and tell the app. */
  setPreference(preference) {
    const next = THEME_PREFERENCES.includes(preference) ? preference : 'system';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-persistent is still better than not switching at all.
    }
    const colorMode = this.resolve(next);
    this.applyColorMode(colorMode);
    try {
      window.dispatchEvent(
        new CustomEvent(THEME_EVENT, { detail: { preference: next, colorMode } })
      );
    } catch {
      // Non-browser — nothing is listening anyway.
    }
    return { preference: next, colorMode };
  }

  /** Light → Dark → System → Light. */
  cyclePreference() {
    const order = ['light', 'dark', 'system'];
    const index = order.indexOf(this.getPreference());
    return this.setPreference(order[(index + 1) % order.length]);
  }

  /**
   * Paint the stored preference and keep following the OS while it is
   * "system". Safe to call more than once — the listener is replaced, never
   * stacked, which matters because both the layout and main.jsx call it.
   */
  initialize() {
    const preference = this.getPreference();
    this.applyColorMode(this.resolve(preference));

    try {
      if (!this.mediaQuery) this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (this.onSystemChange) this.mediaQuery.removeEventListener('change', this.onSystemChange);
      this.onSystemChange = () => {
        if (this.getPreference() !== 'system') return;
        const colorMode = this.resolve('system');
        this.applyColorMode(colorMode);
        window.dispatchEvent(
          new CustomEvent(THEME_EVENT, { detail: { preference: 'system', colorMode } })
        );
      };
      this.mediaQuery.addEventListener('change', this.onSystemChange);
    } catch {
      // No matchMedia: "system" still resolves once, it just can't follow.
    }
    return preference;
  }
}

export const themeService = new ThemeService();
export default themeService;
