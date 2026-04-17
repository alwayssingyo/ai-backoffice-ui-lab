import {GridPlus, Home, ImageAlt, KeyAlt, ListBulleted, Settings, Shield, Users} from "griddy-icons";
import type {ItemType} from "antd/es/menu/interface";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {config} from "@/entry/config.ts";

export const buildProjectSidebarItems = (isSuperAdmin: boolean): ItemType[] => {
	if (!isSuperAdmin) {
		return [
			{key: config.navigation.projectMenuKey.home, label: "Home", icon: <Home {...iconPreset.outlined()} />},
			{key: config.navigation.projectMenuKey.contentManager, label: "Content Manager", icon: <GridPlus {...iconPreset.outlined()} />},
			{key: config.navigation.projectMenuKey.mediaLibrary, label: "Media Library", icon: <ImageAlt {...iconPreset.outlined()} />},
		];
	}

	return [
		{key: config.navigation.projectMenuKey.home, label: "Home", icon: <Home {...iconPreset.outlined()} />},
		{
			key: config.navigation.projectMenuKey.contentManager,
			label: "Content Manager",
			icon: <GridPlus {...iconPreset.outlined()} />,
			children: [
				{key: config.navigation.projectMenuKey.contentManagerEntries, label: "Entries"},
				{key: config.navigation.projectMenuKey.contentManagerFolders, label: "Folders"},
			],
		},
		{key: config.navigation.projectMenuKey.mediaLibrary, label: "Media Library", icon: <ImageAlt {...iconPreset.outlined()} />},
		{key: config.navigation.projectMenuKey.members, label: "Members", icon: <Users {...iconPreset.outlined()} />},
		{key: config.navigation.projectMenuKey.permissions, label: "Permissions", icon: <Shield {...iconPreset.outlined()} />},
		{key: config.navigation.projectMenuKey.auditLog, label: "Audit Log", icon: <KeyAlt {...iconPreset.outlined()} />},
		{
			key: config.navigation.projectMenuKey.board,
			label: "Board",
			icon: <ListBulleted {...iconPreset.outlined()} />,
			children: [
				{key: config.navigation.projectMenuKey.boardNotice, label: "Notice"},
				{key: config.navigation.projectMenuKey.boardReleaseNote, label: "Release Note"},
			],
		},
		{
			key: config.navigation.projectMenuKey.settings,
			label: "Settings",
			icon: <Settings {...iconPreset.outlined()} />,
			children: [
				{key: config.navigation.projectMenuKey.settingsTheme, label: "Theme"},
				{key: config.navigation.projectMenuKey.settingsTenant, label: "Tenant"},
				{key: config.navigation.projectMenuKey.settingsFilter, label: "Filter"},
				{key: config.navigation.projectMenuKey.settingsSystemFilter, label: "System Filter"},
			],
		},
	];
};

export const resolveSelectedProjectMenuKey = (pathname: string, isSuperAdmin: boolean) => {
	if (pathname.startsWith("/project/content-manager/folders")) {
		if (isSuperAdmin) {
			return config.navigation.projectMenuKey.contentManagerFolders;
		}

		return config.navigation.projectMenuKey.contentManager;
	}

	if (pathname.startsWith("/project/content-manager")) {
		if (isSuperAdmin) {
			return config.navigation.projectMenuKey.contentManagerEntries;
		}

		return config.navigation.projectMenuKey.contentManager;
	}

	if (pathname.startsWith("/project/media-library")) {
		return config.navigation.projectMenuKey.mediaLibrary;
	}

	if (pathname.startsWith("/project/members")) {
		if (isSuperAdmin) {
			return config.navigation.projectMenuKey.members;
		}

		return config.navigation.projectMenuKey.home;
	}

	if (pathname.startsWith("/project/permissions")) {
		if (isSuperAdmin) {
			return config.navigation.projectMenuKey.permissions;
		}

		return config.navigation.projectMenuKey.home;
	}

	if (pathname.startsWith("/project/audit-log")) {
		if (isSuperAdmin) {
			return config.navigation.projectMenuKey.auditLog;
		}

		return config.navigation.projectMenuKey.home;
	}

	if (pathname.startsWith("/project/board")) {
		if (isSuperAdmin) {
			if (pathname.startsWith("/project/board/release-note")) {
				return config.navigation.projectMenuKey.boardReleaseNote;
			}

			return config.navigation.projectMenuKey.boardNotice;
		}

		return config.navigation.projectMenuKey.home;
	}

	if (pathname.startsWith("/project/settings")) {
		if (isSuperAdmin) {
			if (pathname.startsWith("/project/settings/system-filter")) {
				return config.navigation.projectMenuKey.settingsSystemFilter;
			}

			if (pathname.startsWith("/project/settings/filter")) {
				return config.navigation.projectMenuKey.settingsFilter;
			}

			if (pathname.startsWith("/project/settings/tenant")) {
				return config.navigation.projectMenuKey.settingsTenant;
			}

			return config.navigation.projectMenuKey.settingsTheme;
		}

		return config.navigation.projectMenuKey.home;
	}

	return config.navigation.projectMenuKey.home;
};
