import {expect, test} from "@playwright/test";
import {support} from "../../support.ts";

test.describe("멤버 관리", () => {
	test.beforeEach(async ({page}) => {
		test.skip(!support.auth.hasCredentials, support.auth.missingCredentialsMessage);
		await support.auth.installGoogleOAuthStubs(page);

		const loginOutcome = await support.auth.loginAsAdmin(page);
		test.skip(loginOutcome === "otp", "현재 계정은 OTP 인증이 필요해 멤버 E2E를 계속할 수 없습니다.");
	});

	test("생성한 멤버를 수정 화면에서 확인할 수 있다", async ({page}) => {
		const uniqueSuffix = Date.now().toString().slice(-6);
		const adminApiContext = await support.members.createAdminApiContext();
		const seededMember = await support.members.createMemberViaApi(adminApiContext, {
			loginId: `pw.${uniqueSuffix}@hnine.com`,
			name: `PW${uniqueSuffix}`,
			password: "Playwright#123",
		});

		try {
			await page.goto(`/project/members/form/${seededMember.id}`);

			await expect(page).toHaveURL(new RegExp(`/project/members/form/${seededMember.id}$`));
			await expect(page.getByLabel("Email")).toHaveValue(seededMember.loginId);
			await expect(page.getByLabel("Name")).toHaveValue(seededMember.name);
			await expect(page.getByLabel("Password")).not.toBeVisible();
			await expect(page.getByText("Account info")).toBeVisible();
			await expect(page.getByText("Status")).toBeVisible();
		} finally {
			await support.members.deleteMemberViaApi(adminApiContext, seededMember.id);
		}

		await expect(page.getByRole("heading", {name: "Edit member"})).toBeVisible();
	});
});
