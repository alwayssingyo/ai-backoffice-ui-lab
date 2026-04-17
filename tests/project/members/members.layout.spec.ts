import {expect, test} from "@playwright/test";
import {createHomeDashboardGetBuildNotesQueryResponse} from "@/services/mocks/home-dashboard/create-home-dashboard-get-build-notes.ts";
import {createHomeDashboardGetNoticesQueryResponse} from "@/services/mocks/home-dashboard/create-home-dashboard-get-notices.ts";
import {createHomeDashboardGetUserActivitiesQueryResponse} from "@/services/mocks/home-dashboard/create-home-dashboard-get-user-activities.ts";
import {support} from "../../support.ts";

test.describe("멤버 권한", () => {
	test("슈퍼 관리자가 아니면 멤버 화면 대신 프로젝트 홈으로 이동한다", async ({page}) => {
		await support.route.setupAuthenticatedSession(page, {
			adminId: 21,
			loginId: "editor@hnine.com",
			name: "콘텐츠 에디터",
			permissionGroupId: 2,
			permissionGroupName: "editor",
		});

		await page.route("**/v1/home-dashboard/notices", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createHomeDashboardGetNoticesQueryResponse({result: "SUCCESS", data: {list: []}})),
			});
		});

		await page.route("**/v1/home-dashboard/build-notes", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createHomeDashboardGetBuildNotesQueryResponse({result: "SUCCESS", data: {list: []}})),
			});
		});

		await page.route("**/v1/home-dashboard/user-activity", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createHomeDashboardGetUserActivitiesQueryResponse({result: "SUCCESS", data: {list: []}})),
			});
		});

		await page.goto("/project/members");

		await expect(page).toHaveURL(/\/project$/);
		await expect(page.getByRole("heading", {name: /Project Home|프로젝트 홈/})).toBeVisible();
	});
});
