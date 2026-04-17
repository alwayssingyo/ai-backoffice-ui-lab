import {createEnvironmentGetAuthPlatformQueryResponse} from "@/services/mocks/environment/create-environment-get-auth-platform.ts";
import {expect, test} from "@playwright/test";
import {support} from "../support.ts";

test.describe("로그인 폼", () => {
	test.beforeEach(async ({page}) => {
		await support.auth.installGoogleOAuthStubs(page);
	});

	test("플랫폼 로그인이 활성화되면 로그인 입력창을 보여준다", async ({page}) => {
		await page.route("**/v1/environments/auth-platform", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createEnvironmentGetAuthPlatformQueryResponse({result: "SUCCESS", data: {usePlatformLogin: true, useGcpLogin: false}}),
				),
			});
		});

		await page.goto("/login");

		await expect(page.getByLabel("Login ID")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", {name: "Sign in"})).toBeVisible();
	});

	test("인증 플랫폼 조회가 실패하면 기본 오류 문구를 보여준다", async ({page}) => {
		await page.route("**/v1/environments/auth-platform", async (route) => {
			await route.fulfill({status: 500, contentType: "application/json", body: JSON.stringify({result: "SYSTEM_ERROR"})});
		});

		await page.goto("/login");

		await expect(page.getByText("Sorry, something went wrong.")).toBeVisible();
	});
});
