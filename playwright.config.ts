import {defineConfig, devices} from "@playwright/test";
import {loadEnv} from "vite";

const loadedEnv = loadEnv(process.env.PLAYWRIGHT_MODE ?? "development", process.cwd(), "");

for (const envKey of ["PLAYWRIGHT_API_BASE_URL", "PLAYWRIGHT_GOOGLE_CLIENT_ID", "PLAYWRIGHT_ADMIN_LOGIN_ID", "PLAYWRIGHT_ADMIN_PASSWORD"]) {
	if (!process.env[envKey] && loadedEnv[envKey]) {
		process.env[envKey] = loadedEnv[envKey];
	}
}

const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const PLAYWRIGHT_PORT = Number.parseInt(process.env.PLAYWRIGHT_PORT ?? "3001", 10);
const PLAYWRIGHT_APP_BASE_URL = process.env.PLAYWRIGHT_APP_BASE_URL ?? `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`;
const PLAYWRIGHT_API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? loadedEnv.VITE_API_BASE_URL ?? "http://127.0.0.1:4010";
const PLAYWRIGHT_GOOGLE_CLIENT_ID = process.env.PLAYWRIGHT_GOOGLE_CLIENT_ID ?? loadedEnv.VITE_GOOGLE_CLIENT_ID ?? "playwright-google-client-id";
const PLAYWRIGHT_BROWSER_PROJECTS = [
	{name: "chrome", device: devices["Desktop Chrome"]},
	{name: "firefox", device: devices["Desktop Firefox"]},
	{name: "webkit", device: devices["Desktop Safari"]},
] as const;
const PLAYWRIGHT_WEB_SERVER_COMMAND = [
	`VITE_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL}"`,
	`VITE_GOOGLE_CLIENT_ID="${PLAYWRIGHT_GOOGLE_CLIENT_ID}"`,
	"DISABLE_TANSTACK_DEVTOOLS_VITE=true",
	`./node_modules/.bin/vite --host ${PLAYWRIGHT_HOST} --port ${PLAYWRIGHT_PORT} --strictPort`,
].join(" ");

export default defineConfig({
	testDir: ".",
	testIgnore: ["**/node_modules/**", "**/dist/**", "**/playwright-report/**", "**/test-results/**"],
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.PLAYWRIGHT_SERIAL === "true" ? 1 : process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [["github"], ["html", {open: "never"}]] : [["list"], ["html", {open: "never"}]],
	use: {
		baseURL: PLAYWRIGHT_APP_BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		testIdAttribute: "data-testid",
	},
	projects: [
		...PLAYWRIGHT_BROWSER_PROJECTS.map(({name, device}) => ({
			name: `integration-${name}`,
			testMatch: /tests\/.*\.spec\.ts$/,
			testIgnore: /tests\/.*\.e2e\.spec\.ts$/,
			use: {
				...device,
			},
		})),
		...PLAYWRIGHT_BROWSER_PROJECTS.map(({name, device}) => ({
			name: `e2e-${name}`,
			testMatch: /tests\/.*\.e2e\.spec\.ts$/,
			use: {
				...device,
			},
		})),
	],
	webServer: {
		command: PLAYWRIGHT_WEB_SERVER_COMMAND,
		url: PLAYWRIGHT_APP_BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
