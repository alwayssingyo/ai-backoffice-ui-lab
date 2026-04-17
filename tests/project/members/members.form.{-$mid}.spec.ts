import {expect, type Page, test} from "@playwright/test";
import {createAdminGetItemQueryResponse} from "@/services/mocks/admin/create-admin-get-item.ts";
import {createAdminSearchAdminsQueryResponse} from "@/services/mocks/admin/create-admin-search-admins.ts";
import {createAdminUpsertMutationResponse} from "@/services/mocks/admin/create-admin-upsert.ts";
import {createAdminSummaryResponse} from "@/services/mocks/create-admin-summary-response.ts";
import {createPermissionGroupResponse} from "@/services/mocks/create-permission-group-response.ts";
import {createTenantResponse} from "@/services/mocks/create-tenant-response.ts";
import {createPermissionGroupGetListQueryResponse} from "@/services/mocks/permission-group/create-permission-group-get-list.ts";
import {createTenantSearchTenantsQueryResponse} from "@/services/mocks/tenant/create-tenant-search-tenants.ts";
import {support} from "../../support.ts";

const waitForMemberFormBootstrap = async (page: Page) => {
	await Promise.all([
		page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/v1/admins/permission-groups")),
		page.waitForResponse((response) => response.request().method() === "GET" && /\/v1\/tenants(?:\?.*)?$/.test(response.url())),
	]);
};

test.describe("멤버 폼", () => {
	test("생성 모드에서 필수값 검증을 보여준다", async ({page}) => {
		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins?*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminSearchAdminsQueryResponse({
						result: "SUCCESS",
						data: {
							page: 1,
							totalCount: 1,
							list: [createAdminSummaryResponse({id: 1, name: "슈퍼 관리자", loginId: "super.admin@hnine.com"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/admins/permission-groups", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createPermissionGroupGetListQueryResponse({
						result: "SUCCESS",
						data: {
							list: [createPermissionGroupResponse({id: 1, name: "슈퍼 관리자"}), createPermissionGroupResponse({id: 2, name: "에디터"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/tenants", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createTenantSearchTenantsQueryResponse({
						result: "SUCCESS",
						data: {page: 1, totalCount: 1, list: [createTenantResponse({id: 10, name: "Alpha Tenant"})]},
					}),
				),
			});
		});

		const bootstrapPromise = waitForMemberFormBootstrap(page);

		await page.goto("/project/members/form");
		await bootstrapPromise;

		await expect(page.getByRole("heading", {name: "Create member"})).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByText("Account info")).not.toBeVisible();
		await page.getByRole("button", {name: "Save"}).click();

		await expect(page.getByText("Email is required.")).toBeVisible();
		await expect(page.getByText("Name is required.")).toBeVisible();
		await expect(page.getByText("Password is required.")).toBeVisible();
		await expect(page.getByText("Permission group is required.")).toBeVisible();
	});

	test("생성 모드에서 입력값을 저장하고 목록으로 이동한다", async ({page}) => {
		const upsertBodies: unknown[] = [];

		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins?*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminSearchAdminsQueryResponse({
						result: "SUCCESS",
						data: {
							page: 1,
							totalCount: 1,
							list: [createAdminSummaryResponse({id: 1, name: "슈퍼 관리자", loginId: "super.admin@hnine.com"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/admins", async (route) => {
			upsertBodies.push(route.request().postDataJSON());
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createAdminUpsertMutationResponse({result: "SUCCESS"})),
			});
		});

		await page.route("**/v1/admins/permission-groups", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createPermissionGroupGetListQueryResponse({
						result: "SUCCESS",
						data: {
							list: [createPermissionGroupResponse({id: 1, name: "슈퍼 관리자"}), createPermissionGroupResponse({id: 2, name: "에디터"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/tenants", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createTenantSearchTenantsQueryResponse({
						result: "SUCCESS",
						data: {
							page: 1,
							totalCount: 2,
							list: [createTenantResponse({id: 10, name: "Alpha Tenant"}), createTenantResponse({id: 20, name: "Beta Tenant"})],
						},
					}),
				),
			});
		});

		const bootstrapPromise = waitForMemberFormBootstrap(page);

		await page.goto("/project/members/form");
		await bootstrapPromise;
		await page.getByLabel("Email").fill("  member.integration@hnine.com  ");
		await page.getByLabel("Name").fill("  통합 테스트 멤버  ");
		await page.getByLabel("Password").fill("Playwright#123");
		await page.getByTestId("member-permission-group-select").click();
		await page.getByText("에디터", {exact: true}).click();
		await page.getByTestId("member-tenant-select").click();
		await page.getByText("Beta Tenant", {exact: true}).click();
		await page.getByRole("button", {name: "Save"}).click();

		await expect(page).toHaveURL(/\/project\/members(\?.*)?$/);
		await expect(upsertBodies).toEqual([
			{loginId: "member.integration@hnine.com", name: "통합 테스트 멤버", password: "Playwright#123", permissionGroupId: 2, tenantId: 20},
		]);
	});

	test("수정 모드에서 기존 값을 보여주고 비밀번호 없이 저장한다", async ({page}) => {
		const upsertBodies: unknown[] = [];

		await support.route.setupAuthenticatedSession(page);

		await page.route("**/v1/admins?*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminSearchAdminsQueryResponse({
						result: "SUCCESS",
						data: {
							page: 1,
							totalCount: 1,
							list: [createAdminSummaryResponse({id: 99, name: "기존 멤버", loginId: "existing.member@hnine.com"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/admins", async (route) => {
			upsertBodies.push(route.request().postDataJSON());
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createAdminUpsertMutationResponse({result: "SUCCESS"})),
			});
		});

		await page.route("**/v1/admins/permission-groups", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createPermissionGroupGetListQueryResponse({
						result: "SUCCESS",
						data: {
							list: [createPermissionGroupResponse({id: 1, name: "슈퍼 관리자"}), createPermissionGroupResponse({id: 2, name: "에디터"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/tenants", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createTenantSearchTenantsQueryResponse({
						result: "SUCCESS",
						data: {
							page: 1,
							totalCount: 2,
							list: [createTenantResponse({id: 10, name: "Alpha Tenant"}), createTenantResponse({id: 20, name: "Beta Tenant"})],
						},
					}),
				),
			});
		});

		await page.route("**/v1/admins/99", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAdminGetItemQueryResponse({
						result: "SUCCESS",
						data: {
							id: 99,
							loginId: "existing.member@hnine.com",
							name: "기존 멤버",
							permissionGroup: createPermissionGroupResponse({id: 1, name: "슈퍼 관리자"}),
							tenantId: 10,
							removed: false,
							createdAt: "2026-03-01T08:00:00.000Z",
							lastLoginAt: "2026-03-20T09:30:00.000Z",
						},
					}),
				),
			});
		});

		const bootstrapPromise = waitForMemberFormBootstrap(page);
		const adminItemPromise = page.waitForResponse(
			(response) => response.request().method() === "GET" && /\/v1\/admins\/99$/.test(response.url()),
		);

		await page.goto("/project/members/form/99");
		await Promise.all([bootstrapPromise, adminItemPromise]);

		await expect(page.getByRole("heading", {name: "Edit member"})).toBeVisible();
		await expect(page.getByLabel("Email")).toHaveValue("existing.member@hnine.com");
		await expect(page.getByLabel("Email")).toHaveJSProperty("readOnly", true);
		await expect(page.getByLabel("Name")).toHaveValue("기존 멤버");
		await expect(page.getByLabel("Password")).not.toBeVisible();
		await expect(page.getByText("Account info")).toBeVisible();
		await expect(page.getByText("Status")).toBeVisible();

		await page.getByLabel("Name").fill("수정된 멤버");
		await page.getByTestId("member-permission-group-select").click();
		await page.getByText("에디터", {exact: true}).click();
		await page.getByTestId("member-tenant-select").click();
		await page.getByText("Beta Tenant", {exact: true}).click();
		await page.getByRole("button", {name: "Save"}).click();

		await expect(page).toHaveURL(/\/project\/members(\?.*)?$/);
		await expect(upsertBodies).toEqual([
			{id: 99, loginId: "existing.member@hnine.com", name: "수정된 멤버", permissionGroupId: 2, tenantId: 20},
		]);
	});
});
