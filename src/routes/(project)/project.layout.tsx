import {createFileRoute, Outlet, redirect, useLocation, useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import {Fragment, useEffect, useState} from "react";
import WidgetSidebar from "@/components/widget/sidebar/widget-sidebar.tsx";
import "./project.css";
import {useTokenStore} from "@/stores/use-token-store.ts";
import {useRoleStore} from "@/stores/use-role-store.ts";
import type {MenuClickEventHandler} from "@rc-component/menu/lib/interface";
import {z} from "zod";
import {config} from "@/entry/config.ts";
import {syncRoleState} from "@/routes/(project)/-local/project-role-guard.ts";
import {buildProjectSidebarItems, resolveSelectedProjectMenuKey} from "@/routes/(project)/project/-local/project-sidebar.tsx";
import {useConfigValueGetItem} from "@/services/hooks/config-value/use-config-value-get-item.ts";
import {
	THEME_MODE_CONFIG_KEY,
	THEME_PRIMARY_COLOR_CONFIG_KEY,
	normalizeThemeMode,
	normalizeThemePrimaryColor,
	useThemeStore,
} from "@/stores/use-theme-store.ts";

export const Route = createFileRoute("/(project)/project")({
	component: ProjectPid,
	beforeLoad: async ({context}) => {
		const accessToken = useTokenStore.getState().accessToken;

		if (!accessToken) {
			throw redirect({to: "/login", replace: true});
		}

		await syncRoleState(context.queryClient);
	},
	validateSearch: z.object({table: z.string().optional()}),
});

const resolveDefaultProjectMenuOpenKeys = (pathname: string, isSuperAdmin: boolean) => {
	if (!isSuperAdmin) {
		return [];
	}

	if (pathname.startsWith("/project/settings")) {
		return [config.navigation.projectMenuKey.settings];
	}

	if (pathname.startsWith("/project/board")) {
		return [config.navigation.projectMenuKey.board];
	}

	if (pathname.startsWith("/project/content-manager")) {
		return [config.navigation.projectMenuKey.contentManager];
	}

	return [];
};

function ProjectPid() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const location = useLocation();
	const roleStore = useRoleStore();
	const isSuperAdmin = roleStore.isSuperAdmin;
	const [openKeys, setOpenKeys] = useState<string[]>([]);
	const [isSidebarOpenInitialized, setIsSidebarOpenInitialized] = useState(false);

	/**
	 * @summary 현재 경로 기준으로 서브메뉴 최초 펼침 상태를 설정합니다.
	 */
	useEffect(() => {
		if (isSidebarOpenInitialized) {
			return;
		}

		setOpenKeys(resolveDefaultProjectMenuOpenKeys(location.pathname, isSuperAdmin));
		setIsSidebarOpenInitialized(true);
	}, [isSuperAdmin, isSidebarOpenInitialized, location.pathname]);

	/**
	 * @summary 메뉴 클릭 시 네비게이션
	 */
	const handleSidebarItemClick: MenuClickEventHandler = (info) => {
		if (info.key === config.navigation.projectMenuKey.home) {
			return navigate({to: "/project"});
		}
		if (info.key === config.navigation.projectMenuKey.contentManager) {
			if (!isSuperAdmin) {
				return navigate({to: "/project/content-manager/entries", search: {table: search.table}});
			}
			return;
		}
		if (info.key === config.navigation.projectMenuKey.contentManagerEntries) {
			return navigate({to: "/project/content-manager/entries", search: {table: search.table}});
		}
		if (info.key === config.navigation.projectMenuKey.contentManagerFolders) {
			return navigate({to: "/project/content-manager/folders"});
		}
		if (info.key === config.navigation.projectMenuKey.mediaLibrary) {
			return navigate({to: "/project/media-library"});
		}
		if (info.key === config.navigation.projectMenuKey.members) {
			return navigate({to: "/project/members"});
		}
		if (info.key === config.navigation.projectMenuKey.permissions) {
			return navigate({to: "/project/permissions"});
		}
		if (info.key === config.navigation.projectMenuKey.auditLog) {
			return navigate({to: "/project/audit-log"});
		}
		if (info.key === config.navigation.projectMenuKey.board) {
			return navigate({to: "/project/board"});
		}
		if (info.key === config.navigation.projectMenuKey.boardNotice) {
			return navigate({to: "/project/board/notice"});
		}
		if (info.key === config.navigation.projectMenuKey.boardReleaseNote) {
			return navigate({to: "/project/board/release-note"});
		}
		if (info.key === config.navigation.projectMenuKey.settings) {
			return navigate({to: "/project/settings"});
		}
		if (info.key === config.navigation.projectMenuKey.settingsTheme) {
			return navigate({to: "/project/settings/theme"});
		}
		if (info.key === config.navigation.projectMenuKey.settingsTenant) {
			return navigate({to: "/project/settings/tenant"});
		}
		if (info.key === config.navigation.projectMenuKey.settingsFilter) {
			return navigate({to: "/project/settings/filter"});
		}
		if (info.key === config.navigation.projectMenuKey.settingsSystemFilter) {
			return navigate({to: "/project/settings/system-filter"});
		}
	};

	/**
	 * @summary 슈퍼관리자일 때만 서브메뉴 열림 상태를 제어합니다.
	 */
	const getSidebarOpenOptions = () => {
		if (!isSuperAdmin) {
			return {};
		}

		return {openKeys, onOpenChange: (keys: string[]) => setOpenKeys(keys)};
	};

	return (
		<Fragment>
			<div className={clsx("rt_pl")}>
				<ProjectThemeSync />
				<WidgetSidebar
					menuOptions={{
						onClick: handleSidebarItemClick,
						selectedKeys: [resolveSelectedProjectMenuKey(location.pathname, isSuperAdmin)],
						items: buildProjectSidebarItems(isSuperAdmin),
						...getSidebarOpenOptions(),
					}}
				/>
				<main className={clsx("rt_pl__main")}>
					<Outlet />
				</main>
			</div>
		</Fragment>
	);
}

function ProjectThemeSync() {
	const setTheme = useThemeStore((state) => state.setTheme);
	const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor);

	/**
	 * @description 설정 조회 API
	 */
	const responseThemeMode = useConfigValueGetItem(
		{config: THEME_MODE_CONFIG_KEY},
		{
			query: {
				meta: {errorToast: null},
				select: ({data}) => {
					return normalizeThemeMode(data.value);
				},
			},
		},
	);
	/**
	 * @description 설정 조회 API
	 */
	const responseThemePrimaryColor = useConfigValueGetItem(
		{config: THEME_PRIMARY_COLOR_CONFIG_KEY},
		{
			query: {
				meta: {errorToast: null},
				select: ({data}) => {
					return normalizeThemePrimaryColor(data.value);
				},
			},
		},
	);

	/**
	 * @summary 저장된 테마 모드 설정을 스토어에 동기화합니다.
	 */
	useEffect(() => {
		if (!responseThemeMode.data) {
			return;
		}

		setTheme(responseThemeMode.data);
	}, [responseThemeMode.data, setTheme]);

	/**
	 * @summary 저장된 기본 색상 설정을 스토어에 동기화합니다.
	 */
	useEffect(() => {
		if (!responseThemePrimaryColor.data) {
			return;
		}

		setPrimaryColor(responseThemePrimaryColor.data);
	}, [responseThemePrimaryColor.data, setPrimaryColor]);

	return null;
}
