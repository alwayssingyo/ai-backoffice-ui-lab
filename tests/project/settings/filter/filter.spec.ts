import {expect, test, type Page} from "@playwright/test";
import {createApiResultOneListContentFolderNodeResponse} from "@/services/mocks/create-api-result-one-list-content-folder-node-response.ts";
import {createContentFolderNodeResponse} from "@/services/mocks/create-content-folder-node-response.ts";
import {createApiResultOneListContentTypeColumnResponse} from "@/services/mocks/create-api-result-one-list-content-type-column-response.ts";
import {createContentTypeColumnResponse} from "@/services/mocks/create-content-type-column-response.ts";
import {contentTypeColumnResponseFieldTypeEnum} from "@/services/types/content-type-column-response.ts";
import {support} from "../../../support.ts";

const installFilterApiRoutes = async (page: Page) => {
	let orderTableInfoFailureCount = 0;

	await page.route("**/v1/content-folders", async (route) => {
		const response = createApiResultOneListContentFolderNodeResponse({
			result: "SUCCESS",
			data: {
				list: [
					createContentFolderNodeResponse({
						id: 1,
						parentId: undefined,
						nodeType: "FOLDER",
						name: "Catalog",
						orderNumber: 1,
						displayed: true,
						children: [
							createContentFolderNodeResponse({
								id: 11,
								parentId: 1,
								nodeType: "TABLE",
								name: "Products",
								tableName: "products",
								orderNumber: 1,
								displayed: true,
								children: undefined,
							}),
							createContentFolderNodeResponse({
								id: 12,
								parentId: 1,
								nodeType: "TABLE",
								name: "Orders",
								tableName: "orders",
								orderNumber: 2,
								displayed: true,
								children: undefined,
							}),
							createContentFolderNodeResponse({
								id: 13,
								parentId: 1,
								nodeType: "TABLE",
								name: "Empty Columns",
								tableName: "empty_columns",
								orderNumber: 3,
								displayed: true,
								children: undefined,
							}),
						] as unknown as ReturnType<typeof createContentFolderNodeResponse>,
					}),
				],
			},
		});

		await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(response)});
	});

	await page.route("**/v1/content-manager/contents/table-info?*", async (route) => {
		const url = new URL(route.request().url());
		const tableName = url.searchParams.get("tableName");

		if (tableName === "orders" && orderTableInfoFailureCount < 1) {
			orderTableInfoFailureCount += 1;
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({result: "SYSTEM_ERROR", data: null}),
			});
			return;
		}

		if (tableName === "empty_columns") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createApiResultOneListContentTypeColumnResponse({result: "SUCCESS", data: {list: []}})),
			});
			return;
		}

		if (tableName === "orders") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createApiResultOneListContentTypeColumnResponse({
						result: "SUCCESS",
						data: {
							list: [
								createContentTypeColumnResponse({
									name: "orderedAt",
									ordinalPosition: 1,
									columnType: "timestamp",
									fieldType: contentTypeColumnResponseFieldTypeEnum.DATE,
								}),
							],
						},
					}),
				),
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(
				createApiResultOneListContentTypeColumnResponse({
					result: "SUCCESS",
					data: {
						list: [
							createContentTypeColumnResponse({
								name: "title",
								ordinalPosition: 1,
								columnType: "varchar",
								fieldType: contentTypeColumnResponseFieldTypeEnum.TEXT,
							}),
							createContentTypeColumnResponse({
								name: "published",
								ordinalPosition: 2,
								columnType: "boolean",
								fieldType: contentTypeColumnResponseFieldTypeEnum.BOOLEAN,
							}),
							createContentTypeColumnResponse({
								name: "price",
								ordinalPosition: 3,
								columnType: "decimal",
								fieldType: contentTypeColumnResponseFieldTypeEnum.NUMBER,
							}),
							createContentTypeColumnResponse({
								name: "metadata",
								ordinalPosition: 4,
								columnType: "json",
								fieldType: contentTypeColumnResponseFieldTypeEnum.JSON,
							}),
						],
					},
				}),
			),
		});
	});
};

test.describe("Settings Filter", () => {
	test.beforeEach(async ({page}) => {
		page.on("pageerror", (error) => {
			console.error("filter.spec pageerror", error.stack ?? error.message);
		});
	});

	test("메뉴 진입 후 tree 선택, empty state, draft 선택과 refresh reset이 동작한다", async ({page}) => {
		await support.route.setupAuthenticatedSession(page);
		await installFilterApiRoutes(page);

		await page.goto("/project/settings/filter");

		await expect(page.getByRole("heading", {name: "Filter"})).toBeVisible();
		await expect(page).toHaveURL(/\/project\/settings\/filter\?table=products$/);
		await expect(page.getByRole("menuitem", {name: "Filter"})).toBeVisible();
		await expect(page.getByRole("cell", {name: "title", exact: true})).toBeVisible();

		await page.getByText("Empty Columns", {exact: true}).click();
		await expect(page).toHaveURL(/table=empty_columns$/);
		await expect(page.getByText("선택한 엔트리에 필터 대상 컬럼이 없습니다.")).toBeVisible();

		await page.getByText("Products", {exact: true}).click();
		await expect(page).toHaveURL(/table=products$/);

		const titleRow = page.getByRole("row", {name: /title/});
		await titleRow.getByTestId("filter-toggle-title").click();
		await titleRow.getByTestId("filter-operator-title").click();
		await page.getByRole("option", {name: "contains", exact: true}).click();
		await titleRow.getByTestId("filter-component-title").click();
		await page.getByRole("option", {name: "text", exact: true}).click();
		await expect(page.getByTestId("filter-status-title")).toContainText("초안 구성 완료");

		await titleRow.getByTestId("filter-toggle-title").click();
		await expect(page.getByTestId("filter-status-title")).toContainText("사용 안 함");

		await page.reload();
		await expect(page).toHaveURL(/table=products$/);
		await expect(page.getByTestId("filter-status-title")).toContainText("사용 안 함");
	});

	test("unsupported 컬럼과 query failure/retry를 같은 화면에서 처리한다", async ({page}) => {
		await support.route.setupAuthenticatedSession(page);
		await installFilterApiRoutes(page);

		await page.goto("/project/settings/filter");

		await expect(page.getByTestId("filter-status-metadata")).toContainText("JSON");
		await expect(page.getByTestId("filter-toggle-metadata")).toBeDisabled();

		await page.getByText("Orders", {exact: true}).click();
		await expect(page.getByText("컬럼 목록을 불러오지 못했습니다.")).toBeVisible();
		await page.getByRole("button", {name: "다시 시도"}).click();
		await expect(page.getByRole("cell", {name: "orderedAt", exact: true})).toBeVisible();
	});

	test("권한 없는 사용자는 direct route access 시 project로 되돌아간다", async ({page}) => {
		await support.route.setupAuthenticatedSession(page, {permissionGroupName: "editor", permissionGroupId: 2});
		await installFilterApiRoutes(page);

		await page.goto("/project/settings/filter");

		await expect(page).toHaveURL(/\/project$/);
		await expect(page.getByRole("heading", {name: "Filter"})).toHaveCount(0);
	});
});
