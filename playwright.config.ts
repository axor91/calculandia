import { defineConfig, devices } from "@playwright/test";

const localChromiumExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (!process.env.CI ? "/usr/bin/google-chrome" : undefined);
const localWebkitLibraryPath = process.env.PLAYWRIGHT_WEBKIT_LIBRARY_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL: "http://127.0.0.1:3212",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: localChromiumExecutable
          ? { executablePath: localChromiumExecutable }
          : {},
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        launchOptions: localWebkitLibraryPath
          ? {
              env: {
                ...process.env,
                LD_LIBRARY_PATH: localWebkitLibraryPath,
              },
            }
          : {},
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3212/healthz",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
