import {expect, type Page, test} from "@playwright/test";
import {createAdminRemoveAdminsMutationResponse} from "@/services/mocks/admin/create-admin-remove-admins.ts";
import {createAdminSearchAdminsQueryResponse} from "@/services/mocks/admin/create-admin-search-admins.ts";
import {createAdminSummaryResponse} from "@/services/mocks/create-admin-summary-response.ts";
import {createPermissionGroupResponse} from "@/services/mocks/create-permission-group-response.ts";
import {support} from "../../support.ts";

/**
 * @summary 멤버 폼 suspense bootstrap 완료 대기
 */
const waitForMemberFormBootstrap = async (page: Page) => {
	await Promise.all([
		page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/v1/admins/permission-groups")),
		page.waitForResponse((response) => response.request().method() === "GET" && /\/v1\/tenants(?:\?.*)?$/.test(response.url())),
	]);
};

test.describe("멤버 목록", () => {
	test("목록을 렌더링하고 선택한 멤버를 삭제할 수 있다", async ({page}) => {
		const firstMember = createAdminSummaryResponse({
			id: 101,
			name: "문경혁",
			loginId: "kyunghyuk.moon@hnine.com",
			permissionGroupName: "슈퍼 관리자",
			removed: false,
			lastLoginAt: "2026-03-20T09:30:00.000Z",
			createdAt: "2026-03-01T08:00:00.000Z",
		});
		const secondMember = createAdminSummaryResponse({
			id: 202,
			name: "홍길동",
			loginId: "hong.gildong@hnine.com",
			permissionGroupName: "에디터",
			removed: false,
			lastLoginAt: "2026-03-21T10:00:00.000Z",
			createdAt: "2026-03-02T08:00:00.000Z",
		});
		const deletedIds: string[] = [];
		let currentMembers = [firstMember, secondMember];

		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins*", async (route) => {
			const request = route.request();
			const url = new URL(request.url());

			if (request.method() === "DELETE") {
				const requestIds = [...url.searchParams.getAll("ids"), ...url.searchParams.getAll("ids[]")];

				if (requestIds.length === 0) {
					const joinedIds = url.searchParams.get("ids");

					if (joinedIds) {
						requestIds.push(...joinedIds.split(","));
					}
				}

				// 삭제 후 refetch가 실제 사용자 결과를 바꾸는지 검증하기 위해 응답 목록도 함께 갱신한다.
				currentMembers = currentMembers.filter((member) => !requestIds.includes(String(member.id)));
				deletedIds.splice(0, deletedIds.length, ...requestIds);
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(createAdminRemoveAdminsMutationResponse({result: "SUCCESS"})),
				});
				return;
			}

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminSearchAdminsQueryResponse({
						result: "SUCCESS",
						data: {page: 1, totalCount: currentMembers.length, list: currentMembers},
					}),
				),
			});
		});

		await page.goto("/project/members");

		await expect(page.getByRole("heading", {name: "Members"})).toBeVisible();
		await expect(page.getByTestId("members-table-count")).toContainText("2");
		await expect(page.getByRole("cell", {name: "문경혁", exact: true})).toBeVisible();
		await expect(page.getByRole("cell", {name: "홍길동", exact: true})).toBeVisible();
		await expect(page.getByRole("button", {name: "Delete"})).toBeDisabled();

		const firstMemberRow = page.getByRole("row", {name: /문경혁/});
		await firstMemberRow.getByRole("checkbox").check();

		await expect(page.getByTestId("members-table-count")).toContainText("1");
		await expect(page.getByRole("button", {name: "Delete"})).toBeEnabled();

		await page.getByRole("button", {name: "Delete"}).click();
		const deleteConfirmDialog = page.getByRole("dialog").last();
		await expect(deleteConfirmDialog).toContainText("삭제하시겠습니까?");
		await deleteConfirmDialog.getByRole("button", {name: "삭제"}).click();

		await expect(page.getByRole("cell", {name: "문경혁", exact: true})).toHaveCount(0);
		await expect(page.getByRole("cell", {name: "홍길동", exact: true})).toBeVisible();
		await expect(page.getByTestId("members-table-count")).toContainText("1");
		await expect(page.getByRole("button", {name: "Delete"})).toBeDisabled();
		await expect(deletedIds).toEqual(["101"]);
	});

	test("생성 버튼과 수정 버튼이 각각 생성 화면과 수정 화면으로 이동한다", async ({page}) => {
		const firstMember = createAdminSummaryResponse({
			id: 101,
			name: "문경혁",
			loginId: "kyunghyuk.moon@hnine.com",
			permissionGroupName: "슈퍼 관리자",
			removed: false,
			lastLoginAt: "2026-03-20T09:30:00.000Z",
			createdAt: "2026-03-01T08:00:00.000Z",
		});

		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminSearchAdminsQueryResponse({result: "SUCCESS", data: {page: 1, totalCount: 1, list: [firstMember]}}),
				),
			});
		});

		await page.route("**/v1/admins/permission-groups", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({result: "SUCCESS", data: {list: [createPermissionGroupResponse({id: 1, name: "super_admin"})]}}),
			});
		});

		await page.route("**/v1/tenants", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({result: "SUCCESS", data: {page: 1, totalCount: 0, list: []}}),
			});
		});

		await page.route("**/v1/admins/101", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					result: "SUCCESS",
					data: {
						id: 101,
						loginId: "kyunghyuk.moon@hnine.com",
						name: "문경혁",
						permissionGroup: createPermissionGroupResponse({id: 1, name: "super_admin"}),
						removed: false,
						createdAt: "2026-03-01T08:00:00.000Z",
						lastLoginAt: "2026-03-20T09:30:00.000Z",
					},
				}),
			});
		});

		await page.goto("/project/members");
		const createBootstrapPromise = waitForMemberFormBootstrap(page);
		await page.getByRole("button", {name: "Create"}).click();
		await createBootstrapPromise;

		await expect(page).toHaveURL(/\/project\/members\/form$/);
		await expect(page.getByRole("heading", {name: "Create member"})).toBeVisible();
		await expect(page.getByTestId("member-permission-group-select")).toBeVisible();

		await page.goto("/project/members");
		const editBootstrapPromise = Promise.all([
			waitForMemberFormBootstrap(page),
			page.waitForResponse((response) => response.request().method() === "GET" && /\/v1\/admins\/101$/.test(response.url())),
		]);
		await page.getByRole("button", {name: "Edit member 문경혁"}).click();
		await editBootstrapPromise;

		await expect(page).toHaveURL(/\/project\/members\/form\/101$/);
		await expect(page.getByRole("heading", {name: "Edit member"})).toBeVisible();
		await expect(page.getByLabel("Email")).toHaveValue("kyunghyuk.moon@hnine.com");
	});

	test("페이지를 변경하면 검색 파라미터와 목록이 함께 바뀐다", async ({page}) => {
		const firstPageMember = createAdminSummaryResponse({
			id: 101,
			name: "페이지 1 멤버",
			loginId: "page-1@hnine.com",
			permissionGroupName: "슈퍼 관리자",
			removed: false,
			lastLoginAt: "2026-03-20T09:30:00.000Z",
			createdAt: "2026-03-01T08:00:00.000Z",
		});
		const secondPageMember = createAdminSummaryResponse({
			id: 202,
			name: "페이지 2 멤버",
			loginId: "page-2@hnine.com",
			permissionGroupName: "에디터",
			removed: true,
			lastLoginAt: "2026-03-21T10:00:00.000Z",
			createdAt: "2026-03-02T08:00:00.000Z",
		});

		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins*", async (route) => {
			const url = new URL(route.request().url());
			const requestedPage = Number(url.searchParams.get("page") ?? "1");
			const list = requestedPage === 2 ? [secondPageMember] : [firstPageMember];

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createAdminSearchAdminsQueryResponse({result: "SUCCESS", data: {page: requestedPage, totalCount: 21, list}})),
			});
		});

		await page.goto("/project/members");

		await expect(page.getByRole("cell", {name: "페이지 1 멤버", exact: true})).toBeVisible();

		await page.getByRole("listitem", {name: "2", exact: true}).click();

		await expect(page).toHaveURL(/\/project\/members\?page=2&size=10$/);
		await expect(page.getByRole("cell", {name: "페이지 2 멤버", exact: true})).toBeVisible();
		await expect(page.getByRole("cell", {name: "Removed"})).toBeVisible();
	});
});
