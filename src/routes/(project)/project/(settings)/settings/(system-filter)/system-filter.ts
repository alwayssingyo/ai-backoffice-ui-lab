import type {FilterSidebarNode, FilterTableNode} from "../(filter)/filter.ts";
import {collectFilterFolderKeys} from "../(filter)/filter.ts";
import {
	contentTypeColumnResponseDateTypeEnum,
	contentTypeColumnResponseFieldTypeEnum,
	type ContentTypeColumnResponse,
} from "@/services/types/content-type-column-response.ts";
import {config} from "@/entry/config.ts";

export const SYSTEM_FILTER_ROUTE_PATH = "/project/settings/system-filter" as const;

export interface SystemFilterRouteConfig {
	menuKey: (typeof config.navigation.projectMenuKey)[keyof typeof config.navigation.projectMenuKey];
	path: typeof SYSTEM_FILTER_ROUTE_PATH;
}

export const SYSTEM_FILTER_ROUTE_CONFIG: SystemFilterRouteConfig = {
	menuKey: config.navigation.projectMenuKey.settingsSystemFilter,
	path: SYSTEM_FILTER_ROUTE_PATH,
};

export const SYSTEM_FILTER_SIDEBAR_NODES: FilterSidebarNode[] = [
	{
		id: 1,
		nodeType: "FOLDER",
		name: "System",
		children: [
			{id: 11, nodeType: "TABLE", name: "Files", tableName: "files", children: []},
			{id: 12, nodeType: "TABLE", name: "Members", tableName: "admins", children: []},
			{id: 13, nodeType: "TABLE", name: "Boards", tableName: "board", children: []},
			{id: 14, nodeType: "TABLE", name: "Audit Logs", tableName: "audit_log", children: []},
		],
	},
];

export const SYSTEM_FILTER_TABLE_NODES: FilterTableNode[] = [
	{id: 11, name: "Files", tableName: "files"},
	{id: 12, name: "Members", tableName: "admins"},
	{id: 13, name: "Boards", tableName: "board"},
	{id: 14, name: "Audit Logs", tableName: "audit_log"},
];

export const SYSTEM_FILTER_FOLDER_KEYS = collectFilterFolderKeys(SYSTEM_FILTER_SIDEBAR_NODES);

export const SYSTEM_FILTER_REQUIRED_COLUMNS: ContentTypeColumnResponse[] = [
	{
		name: "created_at",
		ordinalPosition: 99_998,
		columnType: "timestamp",
		fieldType: contentTypeColumnResponseFieldTypeEnum.DATE,
		dateType: contentTypeColumnResponseDateTypeEnum.DATE_TIME,
		required: false,
		privateField: false,
	},
	{
		name: "updated_at",
		ordinalPosition: 99_999,
		columnType: "timestamp",
		fieldType: contentTypeColumnResponseFieldTypeEnum.DATE,
		dateType: contentTypeColumnResponseDateTypeEnum.DATE_TIME,
		required: false,
		privateField: false,
	},
];

export const mergeSystemFilterColumns = (columns: ContentTypeColumnResponse[] | undefined): ContentTypeColumnResponse[] => {
	const nextColumns = Array.isArray(columns) ? [...columns] : [];

	for (const requiredColumn of SYSTEM_FILTER_REQUIRED_COLUMNS) {
		const hasColumn = nextColumns.some((column) => column.name === requiredColumn.name);
		if (hasColumn) {
			continue;
		}

		nextColumns.push(requiredColumn);
	}

	return nextColumns;
};
