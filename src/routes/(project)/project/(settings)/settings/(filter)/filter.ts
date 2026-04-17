import type {ContentFolderNodeResponse} from "@/services/types/content-folder-node-response.ts";
import {contentTypeColumnResponseFieldTypeEnum, type ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import type {ContentManagerGetTableInfoQueryParams} from "@/services/types/content-manager/content-manager-get-table-info.ts";
import {filterSearchFiltersQueryKey} from "@/services/hooks/filter/use-filter-search-filters.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {FilterSaveRequest} from "@/services/types/filter-save-request.ts";
import {config} from "@/entry/config.ts";
import {util} from "@/entry/util.ts";
import type {FilterItemOptionResponse} from "@/services/types/filter-item-option-response";

export const FILTER_ROUTE_PATH = "/project/settings/filter" as const;

export const FILTER_OPERATOR_OPTIONS = [
	"eq",
	"ne",
	"contains",
	"startsWith",
	"endsWith",
	"gt",
	"gte",
	"lt",
	"lte",
	"between",
	"in",
	"notIn",
] as const;

export const FILTER_COMPONENT_OPTIONS = ["datetime", "radio", "checkbox", "text", "select"] as const;

export type FilterOperatorOption = (typeof FILTER_OPERATOR_OPTIONS)[number];
export type FilterComponentOption = (typeof FILTER_COMPONENT_OPTIONS)[number];

export interface FilterListSearch {
	table?: string;
}

export interface FilterRouteConfig {
	menuKey: (typeof config.navigation.projectMenuKey)[keyof typeof config.navigation.projectMenuKey];
	path: typeof FILTER_ROUTE_PATH;
}

export interface FilterSidebarNode {
	id: number;
	nodeType: "FOLDER" | "TABLE";
	name: string;
	tableName?: string;
	children: FilterSidebarNode[];
}

export interface FilterTableNode {
	id: number;
	name: string;
	tableName: string;
}

export interface SelectedFilterTableState {
	selectedTableNode: FilterTableNode | undefined;
	selectedTableName: string | undefined;
	hasSelectedTable: boolean;
	tableNameForQuery: string;
}

export interface FilterTreeSelectData {
	sidebarNodes: FilterSidebarNode[];
	tableNodes: FilterTableNode[];
	hasInvalidNode: boolean;
}

export interface FilterTreeRenderers {
	renderTitle: (node: FilterSidebarNode) => unknown;
	renderIcon: (node: FilterSidebarNode) => unknown;
}

export interface FilterDraftSetting {
	tableName: string;
	columnName: string;
	label?: string;
	items?: string;
	enabled: boolean;
	operators?: FilterOperatorOption[];
	component?: FilterComponentOption;
}

export type FilterDraftTableState = Record<string, FilterDraftSetting>;
export type FilterDraftState = Record<string, FilterDraftTableState>;
export type FilterSavedTableState = Record<string, FilterResponse[]>;

export interface FilterFieldCompatibility {
	supported: boolean;
	operators: FilterOperatorOption[];
	components: FilterComponentOption[];
	unsupportedReason?: string;
}

export interface FilterRowStatus {
	label: string;
	tone: "idle" | "draft" | "active" | "unsupported" | "unchanged";
}

export interface FilterColumnRow {
	key: string;
	name: string;
	label: string;
	items: string;
	fieldType: ContentTypeColumnResponse["fieldType"];
	columnType: string;
	ordinalPosition: number;
	supported: boolean;
	supportedOperators: FilterOperatorOption[];
	supportedComponents: FilterComponentOption[];
	canEditItems: boolean;
	unsupportedReason?: string;
	enabled: boolean;
	operators: FilterOperatorOption[];
	component?: FilterComponentOption;
	status: FilterRowStatus;
	hasChanges: boolean;
	canSave: boolean;
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperatorOption, string> = {
	eq: "eq",
	ne: "ne",
	contains: "contains",
	startsWith: "startsWith",
	endsWith: "endsWith",
	gt: "gt",
	gte: "gte",
	lt: "lt",
	lte: "lte",
	between: "between",
	in: "in",
	notIn: "notIn",
};

export const FILTER_COMPONENT_LABELS: Record<FilterComponentOption, string> = {
	datetime: "datetime",
	radio: "radio",
	checkbox: "checkbox",
	text: "text",
	select: "select",
};

const FILTER_FIELD_TYPE_OPERATOR_COMPONENT_RULES = {
	[contentTypeColumnResponseFieldTypeEnum.TEXT]: {
		eq: ["radio", "text"],
		ne: ["radio", "text"],
		contains: ["text"],
		startsWith: ["text"],
		endsWith: ["text"],
		in: ["checkbox", "select", "text"],
		notIn: ["checkbox", "select", "text"],
	},
	[contentTypeColumnResponseFieldTypeEnum.BOOLEAN]: {eq: ["radio", "checkbox"], ne: ["radio", "checkbox"]},
	[contentTypeColumnResponseFieldTypeEnum.NUMBER]: {
		eq: ["radio", "text"],
		ne: ["radio", "text"],
		gt: ["text"],
		gte: ["text"],
		lt: ["text"],
		lte: ["text"],
		between: ["text"],
		in: ["text"],
		notIn: ["text"],
	},
	[contentTypeColumnResponseFieldTypeEnum.DATE]: {
		eq: ["radio", "datetime"],
		ne: ["radio", "datetime"],
		gt: ["datetime"],
		gte: ["datetime"],
		lt: ["datetime"],
		lte: ["datetime"],
		between: ["datetime"],
	},
	[contentTypeColumnResponseFieldTypeEnum.ENUMERATION]: {
		eq: ["radio", "select", "text"],
		ne: ["radio", "select", "text"],
		in: ["checkbox", "select", "text"],
		notIn: ["checkbox", "select", "text"],
	},
	[contentTypeColumnResponseFieldTypeEnum.JSON]: {},
	[contentTypeColumnResponseFieldTypeEnum.MEDIA]: {},
	[contentTypeColumnResponseFieldTypeEnum.RELATION]: {},
} satisfies Record<ContentTypeColumnResponse["fieldType"], Partial<Record<FilterOperatorOption, FilterComponentOption[]>>>;

export const FILTER_ROUTE_CONFIG: FilterRouteConfig = {menuKey: config.navigation.projectMenuKey.settingsFilter, path: FILTER_ROUTE_PATH};

export const FILTER_FIELD_TYPE_COMPATIBILITY = {
	[contentTypeColumnResponseFieldTypeEnum.TEXT]: {
		supported: true,
		operators: ["eq", "ne", "contains", "startsWith", "endsWith", "in", "notIn"],
		components: ["radio", "checkbox", "text", "select"],
	},
	[contentTypeColumnResponseFieldTypeEnum.BOOLEAN]: {supported: true, operators: ["eq", "ne"], components: ["radio", "checkbox", "text"]},
	[contentTypeColumnResponseFieldTypeEnum.NUMBER]: {
		supported: true,
		operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "notIn"],
		components: ["radio", "text"],
	},
	[contentTypeColumnResponseFieldTypeEnum.DATE]: {
		supported: true,
		operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
		components: ["radio", "datetime"],
	},
	[contentTypeColumnResponseFieldTypeEnum.ENUMERATION]: {
		supported: true,
		operators: ["eq", "ne", "in", "notIn"],
		components: ["radio", "checkbox", "select", "text"],
	},
	[contentTypeColumnResponseFieldTypeEnum.JSON]: {
		supported: false,
		operators: [],
		components: [],
		unsupportedReason: "복합 구조(JSON) 컬럼은 이번 차수에서 지원하지 않습니다.",
	},
	[contentTypeColumnResponseFieldTypeEnum.MEDIA]: {
		supported: false,
		operators: [],
		components: [],
		unsupportedReason: "미디어 컬럼은 별도 필터 UX 규칙이 필요합니다.",
	},
	[contentTypeColumnResponseFieldTypeEnum.RELATION]: {
		supported: false,
		operators: [],
		components: [],
		unsupportedReason: "관계 컬럼은 대상 추적 규칙이 정의되지 않았습니다.",
	},
} satisfies Record<ContentTypeColumnResponse["fieldType"], FilterFieldCompatibility>;

const FILTER_UNKNOWN_COMPATIBILITY: FilterFieldCompatibility = {
	supported: false,
	operators: [],
	components: [],
	unsupportedReason: "이 컬럼 타입은 이번 차수에서 지원하지 않습니다.",
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const isContentFolderNodeResponse = (value: unknown): value is ContentFolderNodeResponse => {
	if (!isObjectRecord(value)) {
		return false;
	}

	return !(!("id" in value) || !("nodeType" in value) || !("name" in value) || !("orderNumber" in value) || !("displayed" in value));
};

const getFilterChildNodes = (node: ContentFolderNodeResponse): ContentFolderNodeResponse[] => {
	if (Array.isArray(node.children)) {
		return node.children as ContentFolderNodeResponse[];
	}

	if (isContentFolderNodeResponse(node.children)) {
		return [node.children];
	}

	return [];
};

const mapFilterNodes = (
	nodes: ContentFolderNodeResponse[],
): {sidebarNodes: FilterSidebarNode[]; tableNodes: FilterTableNode[]; hasInvalidNode: boolean} => {
	const sidebarNodes: FilterSidebarNode[] = [];
	const tableNodes: FilterTableNode[] = [];
	let hasInvalidNode = false;

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderNodeResponse;

		if (currentNode.nodeType === "TABLE") {
			if (currentNode.name.trim().length < 1) {
				hasInvalidNode = true;
				continue;
			}

			if (typeof currentNode.tableName !== "string" || currentNode.tableName.trim().length < 1) {
				hasInvalidNode = true;
				continue;
			}

			const tableNode: FilterTableNode = {id: currentNode.id, name: currentNode.name, tableName: currentNode.tableName};
			tableNodes.push(tableNode);
			sidebarNodes.push({...tableNode, nodeType: "TABLE", children: []});
			continue;
		}

		const mappedChildNodes = mapFilterNodes(getFilterChildNodes(currentNode));
		if (mappedChildNodes.hasInvalidNode) {
			hasInvalidNode = true;
		}

		if (mappedChildNodes.sidebarNodes.length < 1) {
			continue;
		}

		sidebarNodes.push({id: currentNode.id, nodeType: "FOLDER", name: currentNode.name, children: mappedChildNodes.sidebarNodes});
		tableNodes.push(...mappedChildNodes.tableNodes);
	}

	return {sidebarNodes, tableNodes, hasInvalidNode};
};

const getFilterDraftStatus = (row: {
	supported: boolean;
	unsupportedReason?: string;
	enabled: boolean;
	operators: FilterOperatorOption[];
	component?: FilterComponentOption;
	hasSavedFilters: boolean;
	hasChanges: boolean;
}): FilterRowStatus => {
	if (!row.supported) {
		return {label: row.unsupportedReason ?? "지원하지 않음", tone: "unsupported"};
	}

	if (row.hasSavedFilters && !row.hasChanges) {
		return {label: "변경사항 없음", tone: "unchanged"};
	}

	if (!row.enabled) {
		return {label: "사용 안 함", tone: "idle"};
	}

	if (row.operators.length > 0 && typeof row.component === "string") {
		return {label: "초안 구성 완료", tone: "active"};
	}

	return {label: "초안 미완료", tone: "draft"};
};

export const normalizeFilterListSearch = (search: FilterListSearch | undefined): FilterListSearch => {
	if (typeof search?.table !== "string") {
		return {};
	}

	const normalizedTable = search.table.trim();
	if (normalizedTable.length < 1) {
		return {};
	}

	return {table: normalizedTable};
};

export const getFilterTreeFolderKey = (id: number): string => {
	return `folder:${id}`;
};

export const getFilterTreeTableKey = (tableName: string): string => {
	return `table:${tableName}`;
};

export const selectFilterTreeDataFromApi = (nodes: ContentFolderNodeResponse[]): FilterTreeSelectData => {
	const mappedNodes = mapFilterNodes(nodes);

	return {sidebarNodes: mappedNodes.sidebarNodes, tableNodes: mappedNodes.tableNodes, hasInvalidNode: mappedNodes.hasInvalidNode};
};

export const collectFilterFolderKeys = (nodes: FilterSidebarNode[]): string[] => {
	const folderKeys: string[] = [];

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as FilterSidebarNode;
		if (currentNode.nodeType !== "FOLDER") {
			continue;
		}

		folderKeys.push(getFilterTreeFolderKey(currentNode.id));
		folderKeys.push(...collectFilterFolderKeys(currentNode.children));
	}

	return folderKeys;
};

export const resolveSelectedFilterTableState = (
	tableNodes: FilterTableNode[],
	searchTableName: string | undefined,
): SelectedFilterTableState => {
	let selectedTableNode: FilterTableNode | undefined;

	for (let index = 0; index < tableNodes.length; index += 1) {
		const currentNode = tableNodes[index] as FilterTableNode;
		if (currentNode.tableName !== searchTableName) {
			continue;
		}

		selectedTableNode = currentNode;
		break;
	}

	if (typeof selectedTableNode === "undefined" && tableNodes.length > 0) {
		selectedTableNode = tableNodes[0];
	}

	const selectedTableName = selectedTableNode?.tableName;
	const hasSelectedTable = typeof selectedTableName === "string";
	if (!hasSelectedTable) {
		return {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery: ""};
	}

	return {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery: selectedTableName};
};

export const mapFilterNodeToTreeData = (node: FilterSidebarNode, renderers: FilterTreeRenderers): Record<string, unknown> => {
	if (node.nodeType === "TABLE") {
		return {
			key: getFilterTreeTableKey(node.tableName as string),
			title: renderers.renderTitle(node),
			icon: renderers.renderIcon(node),
			isLeaf: true,
		};
	}

	return {
		key: getFilterTreeFolderKey(node.id),
		title: renderers.renderTitle(node),
		icon: renderers.renderIcon(node),
		selectable: false,
		children: node.children.map((childNode) => {
			return mapFilterNodeToTreeData(childNode, renderers);
		}),
	};
};

export const getFilterFieldCompatibility = (fieldType: ContentTypeColumnResponse["fieldType"]): FilterFieldCompatibility => {
	return FILTER_FIELD_TYPE_COMPATIBILITY[fieldType] ?? FILTER_UNKNOWN_COMPATIBILITY;
};

export const buildFilterTableInfoQueryParams = (tableName: string): ContentManagerGetTableInfoQueryParams => {
	return {tableName, includeSystemColumns: false, includePrivate: true};
};

export const getFilterDraftTableState = (draftState: FilterDraftState, tableName: string): FilterDraftTableState => {
	return draftState[tableName] ?? {};
};

export const getFilterSavedTableState = (savedState: FilterSavedTableState | undefined): FilterSavedTableState => {
	return savedState ?? {};
};

const getFilterDraftLabel = (label: string | undefined): string => {
	return typeof label === "string" ? label : "";
};

const getFilterDraftItems = (items: string | undefined): string => {
	return typeof items === "string" ? items : "";
};

const toFilterItemsDraftString = (items: FilterResponse["items"]): string => {
	if (!Array.isArray(items) || items.length < 1) {
		return "";
	}

	return JSON.stringify(items);
};

const canEditFilterItems = (fieldType: ContentTypeColumnResponse["fieldType"], component: FilterComponentOption | undefined): boolean => {
	if (fieldType === contentTypeColumnResponseFieldTypeEnum.ENUMERATION) {
		return false;
	}

	return component === "select" || component === "radio" || component === "checkbox";
};

const getFilterSaveLabel = (label: string | undefined, columnName: string): string => {
	if (typeof label === "string" && label.length > 0) {
		return label;
	}

	return columnName;
};

const normalizeFilterOperators = (operators: FilterOperatorOption[] | undefined): FilterOperatorOption[] => {
	if (!Array.isArray(operators)) {
		return [];
	}

	return [...new Set(operators)].sort();
};

const getSupportedComponentsByOperators = (
	fieldType: ContentTypeColumnResponse["fieldType"],
	baseComponents: FilterComponentOption[],
	operators: FilterOperatorOption[],
): FilterComponentOption[] => {
	if (operators.length < 1) {
		return baseComponents;
	}

	let nextComponents = [...baseComponents];
	const operatorRules = FILTER_FIELD_TYPE_OPERATOR_COMPONENT_RULES[fieldType] as Partial<
		Record<FilterOperatorOption, FilterComponentOption[]>
	>;

	for (let index = 0; index < operators.length; index += 1) {
		const operator = operators[index] as FilterOperatorOption;
		const limitedComponents = operatorRules?.[operator];
		if (!limitedComponents) {
			continue;
		}

		nextComponents = nextComponents.filter((component) => limitedComponents.includes(component));
	}

	return nextComponents;
};

export const isSameFilterOperators = (left: FilterOperatorOption[] | undefined, right: FilterOperatorOption[] | undefined): boolean => {
	const normalizedLeft = normalizeFilterOperators(left);
	const normalizedRight = normalizeFilterOperators(right);
	if (normalizedLeft.length !== normalizedRight.length) {
		return false;
	}

	return normalizedLeft.every((operator, index) => operator === normalizedRight[index]);
};

export const isSameFilterSavedFilters = (params: {
	enabled: boolean;
	label: string;
	items: string;
	operators: FilterOperatorOption[];
	component?: FilterComponentOption;
	savedFilters: FilterResponse[];
}): boolean => {
	const {enabled, label, items, operators, component, savedFilters} = params;
	if (savedFilters.length < 1) {
		return enabled === false;
	}

	if (!enabled) {
		return false;
	}

	const savedOperators = savedFilters
		.map((filter) => filter.operator)
		.filter((operator): operator is FilterOperatorOption => isFilterOperatorOption(operator));
	const savedComponent = savedFilters.find((filter) => isFilterComponentOption(filter.component))?.component as
		| FilterComponentOption
		| undefined;
	const savedLabel = getFilterDraftLabel(savedFilters[0]?.label);
	const savedItems = getFilterDraftItems(toFilterItemsDraftString(savedFilters[0]?.items));

	return isSameFilterOperators(operators, savedOperators) && component === savedComponent && savedLabel === label && savedItems === items;
};

export const toFilterColumnRows = (
	columns: ContentTypeColumnResponse[] | undefined,
	draftTableState: FilterDraftTableState | undefined,
	savedTableState?: FilterSavedTableState,
): FilterColumnRow[] => {
	if (!Array.isArray(columns)) {
		return [];
	}

	const nextDraftTableState = draftTableState ?? {};
	const nextSavedTableState = getFilterSavedTableState(savedTableState);

	return [...columns]
		.sort((leftColumn, rightColumn) => leftColumn.ordinalPosition - rightColumn.ordinalPosition)
		.map((column) => {
			const compatibility = getFilterFieldCompatibility(column.fieldType);
			const draftSetting = nextDraftTableState[column.name];
			const label = getFilterDraftLabel(draftSetting?.label);
			const items = getFilterDraftItems(draftSetting?.items);
			const operators = normalizeFilterOperators(draftSetting?.operators).filter((operator) => compatibility.operators.includes(operator));
			const supportedComponents = getSupportedComponentsByOperators(column.fieldType, compatibility.components, operators);
			const hasValidComponent = typeof draftSetting?.component === "string" && supportedComponents.includes(draftSetting.component);
			const enabled = compatibility.supported && draftSetting?.enabled === true;
			const nextOperators = enabled ? operators : [];
			const component = enabled && hasValidComponent ? draftSetting?.component : undefined;
			const canEditItems = enabled && canEditFilterItems(column.fieldType, component);
			const savedFilters = nextSavedTableState[column.name] ?? [];
			const hasChanges = !isSameFilterSavedFilters({enabled, label, items, operators: nextOperators, component, savedFilters});
			const status = getFilterDraftStatus({
				supported: compatibility.supported,
				unsupportedReason: compatibility.unsupportedReason,
				enabled,
				operators: nextOperators,
				component,
				hasSavedFilters: savedFilters.length > 0,
				hasChanges,
			});
			const canSave = hasChanges && (!enabled || (nextOperators.length > 0 && typeof component === "string"));

			return {
				key: column.name,
				name: column.name,
				label,
				items,
				fieldType: column.fieldType,
				columnType: column.columnType,
				ordinalPosition: column.ordinalPosition,
				supported: compatibility.supported,
				supportedOperators: compatibility.operators,
				supportedComponents,
				canEditItems,
				unsupportedReason: compatibility.unsupportedReason,
				enabled,
				operators: nextOperators,
				component,
				status,
				hasChanges,
				canSave,
			} satisfies FilterColumnRow;
		});
};

export const setFilterDraftEnabled = (
	draftState: FilterDraftState,
	params: {tableName: string; columnName: string; enabled: boolean; supported: boolean},
): FilterDraftState => {
	const {tableName, columnName, enabled, supported} = params;
	if (!enabled) {
		const currentTableState = getFilterDraftTableState(draftState, tableName);
		if (!currentTableState[columnName]) {
			return draftState;
		}

		return {
			...draftState,
			[tableName]: {
				...currentTableState,
				[columnName]: {
					tableName,
					columnName,
					label: currentTableState[columnName]?.label,
					items: currentTableState[columnName]?.items,
					enabled: false,
					operators: [],
					component: undefined,
				},
			},
		};
	}

	if (!supported) {
		return draftState;
	}

	const currentTableState = getFilterDraftTableState(draftState, tableName);
	const currentSetting = currentTableState[columnName];

	return {
		...draftState,
		[tableName]: {
			...currentTableState,
			[columnName]: {
				tableName,
				columnName,
				label: currentSetting?.label,
				items: currentSetting?.items,
				enabled: true,
				operators: currentSetting?.enabled === true ? currentSetting.operators : [],
				component: currentSetting?.enabled === true ? currentSetting.component : undefined,
			},
		},
	};
};

export const setFilterDraftOperator = (
	draftState: FilterDraftState,
	params: {
		tableName: string;
		columnName: string;
		fieldType: ContentTypeColumnResponse["fieldType"];
		operators: FilterOperatorOption[];
		allowedOperators: FilterOperatorOption[];
	},
): FilterDraftState => {
	const {tableName, columnName, fieldType, operators, allowedOperators} = params;
	const nextOperators = normalizeFilterOperators(operators).filter((operator) => allowedOperators.includes(operator));

	const currentTableState = getFilterDraftTableState(draftState, tableName);
	const currentSetting = currentTableState[columnName];
	if (!currentSetting || currentSetting.enabled !== true) {
		return draftState;
	}
	const nextSupportedComponents = getSupportedComponentsByOperators(
		fieldType,
		FILTER_COMPONENT_OPTIONS as unknown as FilterComponentOption[],
		nextOperators,
	);
	const nextComponent =
		typeof currentSetting.component === "string" && nextSupportedComponents.includes(currentSetting.component)
			? currentSetting.component
			: undefined;

	return {
		...draftState,
		[tableName]: {...currentTableState, [columnName]: {...currentSetting, operators: nextOperators, component: nextComponent}},
	};
};

export const setFilterDraftComponent = (
	draftState: FilterDraftState,
	params: {tableName: string; columnName: string; component: FilterComponentOption; allowedComponents: FilterComponentOption[]},
): FilterDraftState => {
	const {tableName, columnName, component, allowedComponents} = params;
	if (!allowedComponents.includes(component)) {
		return draftState;
	}

	const currentTableState = getFilterDraftTableState(draftState, tableName);
	const currentSetting = currentTableState[columnName];
	if (!currentSetting || currentSetting.enabled !== true) {
		return draftState;
	}

	return {...draftState, [tableName]: {...currentTableState, [columnName]: {...currentSetting, component}}};
};

export const setFilterDraftLabel = (
	draftState: FilterDraftState,
	params: {tableName: string; columnName: string; label: string},
): FilterDraftState => {
	const {tableName, columnName, label} = params;
	const currentTableState = getFilterDraftTableState(draftState, tableName);
	const currentSetting = currentTableState[columnName];
	if (!currentSetting) {
		return {
			...draftState,
			[tableName]: {
				...currentTableState,
				[columnName]: {tableName, columnName, label, enabled: false, operators: [], component: undefined},
			},
		};
	}

	return {...draftState, [tableName]: {...currentTableState, [columnName]: {...currentSetting, label}}};
};

export const setFilterDraftItems = (
	draftState: FilterDraftState,
	params: {tableName: string; columnName: string; items: string},
): FilterDraftState => {
	const {tableName, columnName, items} = params;
	const currentTableState = getFilterDraftTableState(draftState, tableName);
	const currentSetting = currentTableState[columnName];
	if (!currentSetting) {
		return {
			...draftState,
			[tableName]: {
				...currentTableState,
				[columnName]: {tableName, columnName, items, enabled: false, operators: [], component: undefined},
			},
		};
	}

	return {...draftState, [tableName]: {...currentTableState, [columnName]: {...currentSetting, items}}};
};

/**
 * @summary 저장된 필터 목록을 컬럼명 기준 id 맵으로 변환합니다.
 */
export const mapSavedFilterIdsByField = (filters: FilterResponse[] | undefined): Record<string, number> => {
	if (!Array.isArray(filters)) {
		return {};
	}

	return filters.reduce<Record<string, number>>((result, filter) => {
		if (typeof filter.field !== "string" || !Number.isInteger(filter.id)) {
			return result;
		}

		result[filter.field] = filter.id;
		return result;
	}, {});
};

/**
 * @summary 저장된 필터 목록을 컬럼명 기준 배열 맵으로 변환합니다.
 */
export const groupSavedFiltersByField = (filters: FilterResponse[] | undefined): FilterSavedTableState => {
	if (!Array.isArray(filters)) {
		return {};
	}

	return filters.reduce<FilterSavedTableState>((result, filter) => {
		if (typeof filter.field !== "string" || filter.field.length < 1) {
			return result;
		}

		const currentFilters = result[filter.field] ?? [];
		currentFilters.push(filter);
		result[filter.field] = currentFilters;
		return result;
	}, {});
};

/**
 * @summary Filter 저장 payload를 생성합니다.
 */
export const buildFilterUpsertPayload = (params: {tableName: string; row: FilterColumnRow; savedFilterId?: number}): FilterSaveRequest => {
	const {tableName, row, savedFilterId} = params;

	return {
		id: savedFilterId,
		table: tableName,
		field: row.name,
		label: getFilterSaveLabel(row.label, row.name),
		dataType: row.fieldType,
		operator: row.operators[0] as string,
		component: row.component as string,
		items: row.canEditItems ? row.items : undefined,
	};
};

const isFilterOperatorOption = (value: string): value is FilterOperatorOption => {
	return FILTER_OPERATOR_OPTIONS.includes(value as FilterOperatorOption);
};

const isFilterComponentOption = (value: string): value is FilterComponentOption => {
	return FILTER_COMPONENT_OPTIONS.includes(value as FilterComponentOption);
};

/**
 * @summary 저장된 필터 목록을 draft 상태로 변환합니다.
 */
export const toFilterDraftTableStateFromFilters = (params: {
	tableName: string;
	filters: FilterResponse[] | undefined;
}): FilterDraftTableState => {
	const {tableName, filters} = params;
	const groupedFilters = groupSavedFiltersByField(filters);
	const groupedEntries = Object.entries(groupedFilters);
	if (groupedEntries.length < 1) {
		return {};
	}

	return groupedEntries.reduce<FilterDraftTableState>((result, [field, fieldFilters]) => {
		const operators = fieldFilters
			.map((filter) => filter.operator)
			.filter((operator): operator is FilterOperatorOption => isFilterOperatorOption(operator));
		const component = fieldFilters
			.map((filter) => filter.component)
			.find((value): value is FilterComponentOption => isFilterComponentOption(value));
		if (operators.length < 1 || typeof component === "undefined") {
			return result;
		}

		result[field] = {
			tableName,
			columnName: field,
			label: getFilterDraftLabel(fieldFilters[0]?.label),
			items: toFilterItemsDraftString(fieldFilters[0]?.items),
			enabled: true,
			operators,
			component,
		};
		return result;
	}, {});
};

/**
 * @summary Filter draft table state가 동일한지 비교합니다.
 */
export const isSameFilterDraftTableState = (left: FilterDraftTableState | undefined, right: FilterDraftTableState | undefined): boolean => {
	const leftEntries = Object.entries(left ?? {});
	const rightEntries = Object.entries(right ?? {});
	if (leftEntries.length !== rightEntries.length) {
		return false;
	}

	return leftEntries.every(([columnName, leftSetting]) => {
		const rightSetting = right?.[columnName];
		if (!rightSetting) {
			return false;
		}

		return (
			leftSetting.tableName === rightSetting.tableName &&
			leftSetting.columnName === rightSetting.columnName &&
			getFilterDraftLabel(leftSetting.label) === getFilterDraftLabel(rightSetting.label) &&
			getFilterDraftItems(leftSetting.items) === getFilterDraftItems(rightSetting.items) &&
			leftSetting.enabled === rightSetting.enabled &&
			isSameFilterOperators(leftSetting.operators, rightSetting.operators) &&
			leftSetting.component === rightSetting.component
		);
	});
};

/**
 * @summary Filter 목록 조회 invalidation key를 반환합니다.
 */
export const getFilterQueryInvalidationKey = () => {
	return util.query.getBaseQueryKey(filterSearchFiltersQueryKey);
};
