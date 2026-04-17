import {expect, test} from "@playwright/test";
import {support} from "../support.ts";

const PLATFORM_LOGIN_FAILURE_TOAST_TITLE = /Platform login failed|플랫폼 로그인에 실패했습니다\./;

test.describe("로그인", () => {
	test.beforeEach(async ({page}) => {
		test.skip(!support.auth.hasCredentials, support.auth.missingCredentialsMessage);
		await support.auth.installGoogleOAuthStubs(page);
	});

	test("유효한 관리자 계정으로 로그인한다", {tag: "@smoke"}, async ({page}) => {
		const loginOutcome = await support.auth.loginAsAdmin(page);

		if (loginOutcome === "project") {
			await expect(page).toHaveURL(/\/project$/);
			await expect(page.getByRole("heading", {name: "Project Home"})).toBeVisible();
			return;
		}

		await expect(page.getByRole("heading", {name: /OTP Verification|OTP 인증/})).toBeVisible();
	});

	test("잘못된 비밀번호를 입력하면 로그인 실패 토스트를 보여주고 로그인 화면에 머문다", async ({page}) => {
		const invalidLoginId = `pw.invalid.${Date.now()}@hnine.com`;

		await page.goto("/login");
		await page.getByLabel("Login ID").fill(invalidLoginId);
		await page.getByLabel("Password").fill(`${support.auth.adminPassword}__playwright_invalid__`);
		await page.getByRole("button", {name: "Sign in"}).click();

		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByText(PLATFORM_LOGIN_FAILURE_TOAST_TITLE)).toBeVisible();
	});
});
