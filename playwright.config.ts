import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...(process.env.INBOXVAULT_TEST_DATABASE_URL
        ? {
            DATABASE_URL: process.env.INBOXVAULT_TEST_DATABASE_URL,
            GOOGLE_CLIENT_ID: "local-fixture",
            GOOGLE_CLIENT_SECRET: "local-fixture",
            TOKEN_ENCRYPTION_KEY: "1".repeat(64),
          }
        : {
            DATABASE_URL: "",
            GOOGLE_CLIENT_ID: "",
            GOOGLE_CLIENT_SECRET: "",
            TOKEN_ENCRYPTION_KEY: "",
          }),
      NEXTAUTH_URL: "http://127.0.0.1:3100",
      NEXTAUTH_SECRET: "inboxvault-local-test-secret-not-for-production",
    },
  },
});
