import { useCallback, useEffect, useState } from 'react';
import { themeService, THEME_EVENT } from '../services/themeService';

/**
 * The live theme: what the user picked (`preference`) and what that resolves
 * to right now (`colorMode`).
 *
 * Seeded from the service rather than from an effect — the class is already on
 * <html> before React renders, so the first paint is correct. The listeners
 * only follow later changes: the app's own `themechange` event, and the native
 * `storage` event so switching theme in one tab moves the others too.
 */
export function useTheme() {
  const [state, setState] = useState(() => ({
    preference: themeService.getPreference(),
    colorMode: themeService.getCurrentColorMode(),
  }));

  useEffect(() => {
    const sync = () =>
      setState({
        preference: themeService.getPreference(),
        colorMode: themeService.getCurrentColorMode(),
      });

    const onStorage = (event) => {
      if (event.key && event.key !== 'theme') return;
      // Another tab wrote the preference; repaint before reading it back.
      themeService.applyColorMode(themeService.resolve());
      sync();
    };

    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setPreference = useCallback((preference) => {
    themeService.setPreference(preference);
  }, []);

  const cycle = useCallback(() => themeService.cyclePreference(), []);

  return { ...state, setPreference, cycle };
}

export default useTheme;
