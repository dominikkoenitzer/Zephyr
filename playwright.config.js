import { defineConfig, devices } from '@playwright/test';

// Browser tests against the real production build. They exist to catch what a
// unit test cannot see: a colour that is not the app's, a message that says
// the wrong thing, a flow that logs what it should not, a layout that spills
// off a phone.
//
// One worker, so one browser for the whole run. On the author's Windows
// machine every browser launch costs a failed-logon event, and these flags keep
// the headless browser away from the credential paths that cause it.
const HARDENED_ARGS = [
  '--password-store=basic',
  '--use-mock-keychain',
  '--auth-server-allowlist=_none_',
  '--auth-negotiate-delegate-allowlist=_none_',
  '--disable-features=PasswordManagerOnboarding,BiometricAuthenticationForFilling,BiometricAuthenticationInSettings',
  '--block-new-web-contents',
];

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    launchOptions: {
      args: HARDENED_ARGS,
      // Optional: point local runs at a browser that is already installed
      // instead of downloading the build this Playwright version pins. CI
      // leaves it unset and installs its own.
      executablePath: process.env.E2E_CHROMIUM || undefined,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `bun run build && bunx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
