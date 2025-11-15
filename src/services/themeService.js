// Theme service for managing garden themes
export const GARDEN_THEMES = {
  spring: {
    name: 'Spring Garden',
    id: 'spring',
    colors: {
      primary: '142 76% 36%', // Fresh green
      accent: '142 50% 95%',
      background: '142 20% 98%',
      foreground: '142 30% 15%',
      muted: '142 15% 90%',
      border: '142 30% 85%',
    },
    dark: {
      primary: '142 76% 50%',
      accent: '142 40% 15%',
      background: '142 30% 8%',
      foreground: '142 20% 95%',
      muted: '142 20% 20%',
      border: '142 20% 25%',
    }
  },
  summer: {
    name: 'Summer Garden',
    id: 'summer',
    colors: {
      primary: '120 60% 45%', // Vibrant green
      accent: '120 40% 95%',
      background: '120 15% 98%',
      foreground: '120 25% 12%',
      muted: '120 10% 92%',
      border: '120 25% 88%',
    },
    dark: {
      primary: '120 60% 55%',
      accent: '120 35% 15%',
      background: '120 25% 6%',
      foreground: '120 15% 95%',
      muted: '120 20% 18%',
      border: '120 20% 22%',
    }
  },
  autumn: {
    name: 'Autumn Garden',
    id: 'autumn',
    colors: {
      primary: '25 85% 50%', // Warm orange
      accent: '25 50% 96%',
      background: '25 20% 99%',
      foreground: '25 30% 12%',
      muted: '25 15% 94%',
      border: '25 30% 90%',
    },
    dark: {
      primary: '25 85% 60%',
      accent: '25 40% 15%',
      background: '25 30% 8%',
      foreground: '25 20% 95%',
      muted: '25 20% 20%',
      border: '25 20% 25%',
    }
  },
  forest: {
    name: 'Forest Garden',
    id: 'forest',
    colors: {
      primary: '150 50% 35%', // Deep forest green
      accent: '150 40% 96%',
      background: '150 15% 98%',
      foreground: '150 30% 10%',
      muted: '150 10% 93%',
      border: '150 25% 89%',
    },
    dark: {
      primary: '150 50% 45%',
      accent: '150 35% 15%',
      background: '150 25% 5%',
      foreground: '150 15% 96%',
      muted: '150 20% 18%',
      border: '150 20% 22%',
    }
  },
  lavender: {
    name: 'Lavender Garden',
    id: 'lavender',
    colors: {
      primary: '270 50% 60%', // Soft purple
      accent: '270 40% 97%',
      background: '270 15% 99%',
      foreground: '270 30% 12%',
      muted: '270 10% 95%',
      border: '270 25% 91%',
    },
    dark: {
      primary: '270 50% 70%',
      accent: '270 35% 15%',
      background: '270 25% 7%',
      foreground: '270 20% 96%',
      muted: '270 20% 19%',
      border: '270 20% 23%',
    }
  },
  rose: {
    name: 'Rose Garden',
    id: 'rose',
    colors: {
      primary: '340 70% 55%', // Soft rose
      accent: '340 50% 97%',
      background: '340 15% 99%',
      foreground: '340 30% 12%',
      muted: '340 10% 95%',
      border: '340 25% 91%',
    },
    dark: {
      primary: '340 70% 65%',
      accent: '340 35% 15%',
      background: '340 25% 7%',
      foreground: '340 20% 96%',
      muted: '340 20% 19%',
      border: '340 20% 23%',
    }
  },
  ocean: {
    name: 'Ocean Garden',
    id: 'ocean',
    colors: {
      primary: '195 80% 50%', // Ocean blue
      accent: '195 50% 96%',
      background: '195 15% 98%',
      foreground: '195 30% 12%',
      muted: '195 10% 93%',
      border: '195 25% 89%',
    },
    dark: {
      primary: '195 80% 60%',
      accent: '195 40% 15%',
      background: '195 25% 6%',
      foreground: '195 20% 95%',
      muted: '195 20% 18%',
      border: '195 20% 22%',
    }
  },
  default: {
    name: 'Default',
    id: 'default',
    colors: null, // Uses CSS variables
  }
};

class ThemeService {
  constructor() {
    this.currentTheme = 'default';
    this.currentColorMode = 'light';
  }

  getCurrentTheme() {
    return localStorage.getItem('gardenTheme') || 'default';
  }

  getCurrentColorMode() {
    const root = window.document.documentElement;
    return root.classList.contains('dark') ? 'dark' : 'light';
  }

  applyTheme(themeId = 'default', colorMode = 'light') {
    this.currentTheme = themeId;
    this.currentColorMode = colorMode;
    
    const root = window.document.documentElement;
    
    // Remove all theme data attributes
    Object.keys(GARDEN_THEMES).forEach(key => {
      root.removeAttribute(`data-theme-${key}`);
    });
    
    if (themeId === 'default') {
      root.removeAttribute('data-garden-theme');
      return;
    }
    
    const theme = GARDEN_THEMES[themeId];
    if (!theme) return;
    
    root.setAttribute('data-garden-theme', themeId);
    
    const colors = colorMode === 'dark' ? theme.dark : theme.colors;
    
    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    localStorage.setItem('gardenTheme', themeId);
  }

  initialize() {
    const savedTheme = this.getCurrentTheme();
    const colorMode = this.getCurrentColorMode();
    this.applyTheme(savedTheme, colorMode);
  }
}

export const themeService = new ThemeService();

