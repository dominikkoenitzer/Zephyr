// Simplified theme service: only manage light/dark via root class, no garden themes
class ThemeService {
  constructor() {
    this.currentTheme = 'default'
    this.currentColorMode = 'light'
  }

  getCurrentTheme() {
    return 'default'
  }

  getCurrentColorMode() {
    const root = window.document.documentElement
    return root.classList.contains('dark') ? 'dark' : 'light'
  }

  applyTheme(colorMode = 'light') {
    this.currentTheme = 'default'
    this.currentColorMode = colorMode

    const root = window.document.documentElement
    root.removeAttribute('data-garden-theme')
    localStorage.removeItem('gardenTheme')
  }

  initialize() {
    const mode = this.getCurrentColorMode()
    this.applyTheme(mode)
  }
}

export const themeService = new ThemeService()

