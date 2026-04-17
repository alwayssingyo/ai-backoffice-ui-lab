import {expect, type Page} from "@playwright/test";
import {adminRemoveAdmins} from "@/services/clients/admin/admin-remove-admins.ts";
import {adminSearchAdmins} from "@/services/clients/admin/admin-search-admins.ts";
import {adminUpsert} from "@/services/clients/admin/admin-upsert.ts";
import {authorizationLogin} from "@/services/clients/authorization/authorization-login.ts";
import {permissionGroupGetList} from "@/services/clients/permission-group/permission-group-get-list.ts";
import {createAuthorizationInfoQueryResponse} from "@/services/mocks/authorization/create-authorization-info.ts";
import {createConfigValueGetItemQueryResponse} from "@/services/mocks/config-value/create-config-value-get-item.ts";
import {createPermissionGroupResponse} from "@/services/mocks/create-permission-group-response.ts";
import {adminSearchAdminsQueryParamsSearchOptionEnum} from "@/services/types/admin/admin-search-admins.ts";

const GOOGLE_OAUTH_URL_PATTERNS = ["https://accounts.google.com/**", "https://apis.google.com/**"] as const;
const OTP_VERIFICATION_PATTERN = /OTP Verification|OTP 인증/;
const PLATFORM_LOGIN_FAILURE_TOAST_PATTERN = /Platform login failed|플랫폼 로그인에 실패했습니다\./;
const PLAYWRIGHT_SESSION_STATE = {
	state: {otpToken: null, accessToken: "playwright-access-token", refreshToken: "playwright-refresh-token"},
	version: 0,
} as const;

const PLAYWRIGHT_ADMIN_LOGIN_ID = process.env.PLAYWRIGHT_ADMIN_LOGIN_ID ?? "";
const PLAYWRIGHT_ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "";
const PLAYWRIGHT_API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "";

/**
 * @summary 인증 정보 mock 응답 오버라이드 값
 * @property adminId mock 관리자 ID
 * @property loginId mock 로그인 ID
 * @property name mock 관리자 이름
 * @property permissionGroupId mock 권한 그룹 ID
 * @property permissionGroupName mock 권한 그룹 이름
 */
interface MockAuthorizationInfoOptions {
	adminId?: number;
	loginId?: string;
	name?: string;
	permissionGroupId?: number;
	permissionGroupName?: string;
}

/**
 * @summary 관리자 API seed/cleanup 호출 컨텍스트
 * @property apiBaseUrl Playwright 대상 API base URL
 * @property headers 관리자 인증 헤더
 */
interface AdminApiContext {
	apiBaseUrl: string;
	headers: {Authorization: string};
}

/**
 * @summary 멤버 seed 생성 파라미터
 * @property loginId 생성할 멤버 로그인 ID
 * @property name 생성할 멤버 이름
 * @property password 생성할 멤버 비밀번호
 */
interface SeedMemberOptions {
	loginId: string;
	name: string;
	password: string;
}

/**
 * @summary 로그인 다음 단계 판정 결과
 */
type PlaywrightLoginOutcome = "project" | "otp";

/**
 * @summary 로그인 API 최소 응답 형태
 * @property data OTP 여부와 토큰 정보
 */
type LoginResponsePayload = {
	data?: {
		otpRequired?: boolean;
		otpToken?: string | null;
		tokenInfo?: {accessToken?: string | null; refreshToken?: string | null} | null;
	};
};

const auth = {
	adminLoginId: PLAYWRIGHT_ADMIN_LOGIN_ID,
	adminPassword: PLAYWRIGHT_ADMIN_PASSWORD,
	apiBaseUrl: PLAYWRIGHT_API_BASE_URL,
	hasCredentials:
		PLAYWRIGHT_ADMIN_LOGIN_ID.length > 0 && PLAYWRIGHT_ADMIN_PASSWORD.length > 0 && PLAYWRIGHT_API_BASE_URL.length > 0,
	missingCredentialsMessage: "PLAYWRIGHT_API_BASE_URL, PLAYWRIGHT_ADMIN_LOGIN_ID, PLAYWRIGHT_ADMIN_PASSWORD가 필요합니다.",

	/**
	 * @summary 외부 Google OAuth 요청 무효화
	 */
	async installGoogleOAuthStubs(page: Page) {
		for (const urlPattern of GOOGLE_OAUTH_URL_PATTERNS) {
			await page.route(urlPattern, async (route) => {
				await route.fulfill({status: 204, body: ""});
			});
		}
	},
	/**
	 * @summary 관리자 로그인 후 다음 화면 상태 판정
	 */
	async loginAsAdmin(page: Page): Promise<PlaywrightLoginOutcome> {
		await page.goto("/login");
		await page.getByLabel("Login ID").fill(auth.adminLoginId);
		await page.getByLabel("Password").fill(auth.adminPassword);
		// URL polling보다 로그인 API 결과를 먼저 고정해야 실패 원인을 바로 분리할 수 있다.
		const loginResponsePromise = page.waitForResponse(
			(response) => response.request().method() === "POST" && response.url().includes("/v1/cms/auth/login"),
		);
		await page.getByRole("button", {name: "Sign in"}).click();
		const loginResponse = await loginResponsePromise;
		const loginResponseText = await loginResponse.text().catch(() => "");

		if (!loginResponse.ok()) {
			const hasFailureToast = (await page.getByText(PLATFORM_LOGIN_FAILURE_TOAST_PATTERN).count()) > 0;
			const responseSummary = loginResponseText.slice(0, 500) || "<empty>";

			throw new Error(
				[
					`Admin login failed before reaching project or OTP flow.`,
					`POST /v1/cms/auth/login returned ${loginResponse.status()}.`,
					`Current URL: ${page.url()}.`,
					`Failure toast visible: ${hasFailureToast}.`,
					`Response body: ${responseSummary}`,
				].join(" "),
			);
		}

		const loginResponsePayload = (() => {
			try {
				return JSON.parse(loginResponseText) as LoginResponsePayload;
			} catch {
				return null;
			}
		})();
		const loginData = loginResponsePayload?.data;

		if (loginData?.otpRequired) {
			if (!loginData.otpToken) {
				throw new Error("Login response required OTP but did not include otpToken.");
			}

			await expect(page.getByRole("heading", {name: OTP_VERIFICATION_PATTERN})).toBeVisible({timeout: 10000});
			return "otp";
		}

		if (loginData?.tokenInfo?.accessToken && loginData?.tokenInfo?.refreshToken) {
			await expect(page).toHaveURL(/\/project/, {timeout: 10000});
			return "project";
		}

		throw new Error(
			[
				`Login response succeeded but did not produce a usable next state.`,
				`Current URL: ${page.url()}.`,
				`Response body: ${loginResponseText.slice(0, 500) || "<empty>"}`,
			].join(" "),
		);
	},
};

const route = {
	/**
	 * @summary 앱 부팅 전 인증 세션 주입
	 */
	async installAuthenticatedSession(page: Page) {
		// 라우터 진입 전에 세션을 심어야 인증 리다이렉트를 피할 수 있다.
		await page.addInitScript((sessionState) => {
			sessionStorage.setItem("t_s", JSON.stringify(sessionState));
		}, PLAYWRIGHT_SESSION_STATE);
	},
	/**
	 * @summary 권한 정보 조회 mock 설치
	 */
	async mockAuthorizationInfo(page: Page, options: MockAuthorizationInfoOptions = {}) {
		const {
			adminId = 1,
			loginId = "super.admin@hnine.com",
			name = "슈퍼 관리자",
			permissionGroupId = 1,
			permissionGroupName = "super_admin",
		} = options;

		await page.route("**/v1/cms/auth/info", async (routeRequest) => {
			await routeRequest.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(
					createAuthorizationInfoQueryResponse({
						result: "SUCCESS",
						data: {
							id: adminId,
							loginId,
							name,
							permissionGroup: createPermissionGroupResponse({id: permissionGroupId, name: permissionGroupName}),
							removed: false,
							createdAt: "2026-03-01T08:00:00.000Z",
						},
					}),
				),
			});
		});
	},
	/**
	 * @summary 테마/브랜드 설정 mock 설치
	 */
	async mockConfigValues(page: Page) {
		await page.route("**/v1/config-value?*", async (routeRequest) => {
			const url = new URL(routeRequest.request().url());
			const config = url.searchParams.get("config");
			const value = config === "theme-mode" ? "light" : "#282828";

			await routeRequest.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(createConfigValueGetItemQueryResponse({result: "SUCCESS", data: {config: config ?? "", value}})),
			});
		});
	},
	/**
	 * @summary Integration 공통 인증 bootstrap 설치
	 */
	async setupAuthenticatedSession(page: Page, options: MockAuthorizationInfoOptions = {}) {
		await route.installAuthenticatedSession(page);
		await auth.installGoogleOAuthStubs(page);
		await route.mockAuthorizationInfo(page, options);
		await route.mockConfigValues(page);
	},
};

const members = {
	/**
	 * @summary 멤버 seed/cleanup용 관리자 API 컨텍스트 생성
	 */
	async createAdminApiContext() {
		if (!auth.hasCredentials) {
			throw new Error("Playwright admin credentials are required to call member seed APIs.");
		}

		const loginResponse = await authorizationLogin(
			{loginId: auth.adminLoginId, password: auth.adminPassword},
			{baseURL: auth.apiBaseUrl},
		);

		if (loginResponse.data.otpRequired || !loginResponse.data.tokenInfo) {
			throw new Error("The configured admin account requires OTP or did not return API tokens.");
		}

		return {
			apiBaseUrl: auth.apiBaseUrl,
			headers: {Authorization: `Bearer ${loginResponse.data.tokenInfo.accessToken}`},
		} satisfies AdminApiContext;
	},
	/**
	 * @summary API로 멤버 선행 생성
	 */
	async createMemberViaApi(adminApiContext: AdminApiContext, options: SeedMemberOptions) {
		const permissionGroups = await permissionGroupGetList({
			baseURL: adminApiContext.apiBaseUrl,
			headers: adminApiContext.headers,
		});
		const editorPermissionGroup = permissionGroups.data.list.find((permissionGroup) => permissionGroup.name !== "super_admin");

		if (!editorPermissionGroup) {
			throw new Error("No editable permission group was found for member seeding.");
		}

		await adminUpsert(
			{
				loginId: options.loginId,
				name: options.name,
				password: options.password,
				permissionGroupId: editorPermissionGroup.id,
			},
			{
				baseURL: adminApiContext.apiBaseUrl,
				headers: adminApiContext.headers,
			},
		);

		let seededMemberId: number | null = null;

		// 생성 직후 검색 인덱스 반영이 밀릴 수 있어 조회 결과가 보일 때까지 polling한다.
		await expect
			.poll(
				async () => {
					const searchResponse = await adminSearchAdmins(
						{
							page: 1,
							size: 10,
							searchOption: adminSearchAdminsQueryParamsSearchOptionEnum.LOGIN_ID,
							searchKeyword: options.loginId,
						},
						{
							baseURL: adminApiContext.apiBaseUrl,
							headers: adminApiContext.headers,
						},
					);
					const seededMember = searchResponse.data.list.find((member) => member.loginId === options.loginId);

					seededMemberId = seededMember?.id ?? null;
					return seededMemberId;
				},
				{timeout: 10000},
			)
			.not.toBeNull();

		if (seededMemberId === null) {
			throw new Error(`Failed to locate the seeded member: ${options.loginId}`);
		}

		return {id: seededMemberId, loginId: options.loginId, name: options.name};
	},
	/**
	 * @summary API로 생성한 멤버 정리
	 */
	async deleteMemberViaApi(adminApiContext: AdminApiContext, memberId: number) {
		await adminRemoveAdmins(
			{ids: [memberId]},
			{
				baseURL: adminApiContext.apiBaseUrl,
				headers: adminApiContext.headers,
			},
		);
	},
};

export const support = {auth, route, members};
