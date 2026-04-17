import type {QueryClient} from "@tanstack/react-query";
import {redirect} from "@tanstack/react-router";
import {util} from "@/entry/util.ts";
import {authorizationInfoSuspenseQueryOptions} from "@/services/hooks/authorization/use-authorization-info-suspense.ts";
import {useRoleStore} from "@/stores/use-role-store.ts";

/**
 * @summary 역할 스토어를 최신 로그인 정보로 동기화합니다.
 */
export const syncRoleState = async (queryClient: QueryClient) => {
	const responseAuthorizationInfo = await queryClient.ensureQueryData(authorizationInfoSuspenseQueryOptions());
	const roleName = responseAuthorizationInfo.data.permissionGroup.name;
	const roleStore = useRoleStore.getState();
	const isSuperAdmin = util.auth.isSuperAdminRoleName(roleName);

	if (!roleStore.isRoleReady || roleStore.isSuperAdmin !== isSuperAdmin) {
		roleStore.setRoleName(roleName);
	}

	return isSuperAdmin;
};

/**
 * @summary 슈퍼관리자 전용 라우트 접근을 검증합니다.
 */
export const ensureSuperAdminRouteAccess = async (queryClient: QueryClient) => {
	const isSuperAdmin = await syncRoleState(queryClient);
	if (isSuperAdmin) {
		return;
	}

	throw redirect({to: "/project", replace: true});
};
