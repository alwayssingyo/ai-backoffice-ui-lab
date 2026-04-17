import type {AuditLogSearchAuditLogsQueryParams} from "@/services/types/audit-log/audit-log-search-audit-logs.ts";
import {auditLogSearchAuditLogsQueryKey} from "@/services/hooks/audit-log/use-audit-log-search-audit-logs.ts";
import type {AuditLogPageResponse} from "@/services/types/audit-log-page-response.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {FilterItemOptionResponse} from "@/services/types/filter-item-option-response.ts";
import {config} from "@/entry/config.ts";
import {util} from "@/entry/util.ts";

export const AUDIT_LOG_DEFAULT_PAGE = 1;
export const AUDIT_LOG_DEFAULT_PAGE_SIZE = 10;
export const AUDIT_LOG_FILTER_TABLE_NAME = "audit_log";
export const AUDIT_LOG_COLUMN_KEYS = ["adminName", "method", "url", "description", "status", "executionTimeMs", "createdAt"] as const;
type AuditLogApiRow = AuditLogPageResponse & {adminName?: string};

interface AuditLogFilterFieldStateSyncInput {
	previousStates: AuditLogFilterFieldStateMap;
	definitions: AuditLogFilterDefinition[];
}

interface AuditLogFilterFieldStateValueInput {
	fieldStates: AuditLogFilterFieldStateMap;
	definition: AuditLogFilterDefinition;
	value: unknown;
}

interface AuditLogSearchRequestCandidateInput {
	definitions: AuditLogFilterDefinition[];
	fieldStates: AuditLogFilterFieldStateMap;
}

interface AuditLogSearchQueryParamsInput {
	search: AuditLogListSearch;
	searchCandidate: AuditLogSearchRequestCandidate;
}

const AUDIT_LOG_FILTER_SUPPORTED_COMPONENTS = ["datetime", "radio", "checkbox", "text", "select"] as const;
const AUDIT_LOG_FILTER_OPTION_COMPONENTS = ["radio", "checkbox", "select"] as const;

export const AUDIT_LOG_FILTER_EMPTY_FIELD_LABEL = "field 없음";
export const AUDIT_LOG_FILTER_OPTIONLESS_REASON = "옵션 정보가 없어 현재 차수에서는 사용할 수 없습니다.";
export const AUDIT_LOG_FILTER_MISSING_FIELD_REASON = "field 식별자가 없어 현재 차수에서는 사용할 수 없습니다.";
export const AUDIT_LOG_FILTER_UNSUPPORTED_COMPONENT_REASON = "지원하지 않는 component라 현재 차수에서는 사용할 수 없습니다.";
export const AUDIT_LOG_FILTER_OPERATOR_LABELS: Record<string, string> = {
	eq: "같은 값",
	ne: "다른 값",
	contains: "포함",
	startsWith: "시작",
	endsWith: "끝",
	gt: "초과",
	gte: "이상",
	lt: "미만",
	lte: "이하",
	between: "범위",
	in: "목록 포함",
	notIn: "목록 제외",
};

export type AuditLogFilterComponent = (typeof AUDIT_LOG_FILTER_SUPPORTED_COMPONENTS)[number];

/**
 * @summary Audit Log 목록 검색 상태
 * @property page 현재 페이지
 * @property size 페이지 크기
 */
export interface AuditLogListSearch {
	page: number;
	size: number;
}

/**
 * @summary Audit Log route 설정
 * @property menuKey LNB 선택 키
 * @property path 감사 로그 route path
 */
export interface AuditLogRouteConfig {
	menuKey: (typeof config.navigation.projectMenuKey)[keyof typeof config.navigation.projectMenuKey];
	path: "/project/audit-log";
}

/**
 * @summary Audit Log 테이블 행 모델
 * @property id 감사 로그 식별자
 * @property adminName 관리자 표시값
 * @property method 요청 메서드 표시값
 * @property url 요청 URL 표시값
 * @property description 설명 표시값
 * @property status 응답 상태 표시값
 * @property executionTimeMs 실행 시간 표시값
 * @property createdAt 생성 일시
 */
export interface AuditLogTableRow {
	id: number;
	adminName: string;
	method: string;
	url: string;
	description: string;
	status: string;
	executionTimeMs: string;
	createdAt: string;
}

export interface AuditLogFilterDefinition {
	id: number;
	field: string;
	label: string;
	displayLabel: string;
	displayField: string;
	operator: string;
	component: string;
	dataType: string;
	items: FilterItemOptionResponse[];
	isEnabled: boolean;
	restrictionReason?: string;
}

export interface AuditLogFilterFieldState {
	definitionId: number;
	field: string;
	operator: string;
	component: string;
	value: unknown;
	isEnabled: boolean;
	restrictionReason?: string;
}

export type AuditLogFilterFieldStateMap = Record<number, AuditLogFilterFieldState>;

export interface AuditLogSearchRequestCandidateItem {
	field: string;
	operator: string;
	component: string;
	value: unknown;
}

export interface AuditLogSearchRequestCandidate {
	table: string;
	filters: AuditLogSearchRequestCandidateItem[];
}

export interface AuditLogBetweenFieldValue {
	start: string;
	end: string;
}

export const AUDIT_LOG_ROUTE_CONFIG: AuditLogRouteConfig = {menuKey: config.navigation.projectMenuKey.auditLog, path: "/project/audit-log"};

/**
 * @summary Audit Log search 값을 기본값과 함께 정규화합니다.
 */
export const normalizeAuditLogListSearch = (search: Partial<AuditLogListSearch> | undefined): AuditLogListSearch => {
	const page = typeof search?.page === "number" && search.page > 0 ? search.page : AUDIT_LOG_DEFAULT_PAGE;
	const size = typeof search?.size === "number" && search.size > 0 ? search.size : AUDIT_LOG_DEFAULT_PAGE_SIZE;

	return {page, size};
};

const isSupportedAuditLogFilterComponent = (component: string): component is AuditLogFilterComponent => {
	return AUDIT_LOG_FILTER_SUPPORTED_COMPONENTS.includes(component as AuditLogFilterComponent);
};

const getAuditLogFilterRestrictionReason = (input: {field: string; component: string}): string | undefined => {
	if (input.field.length < 1) {
		return AUDIT_LOG_FILTER_MISSING_FIELD_REASON;
	}

	if (!isSupportedAuditLogFilterComponent(input.component)) {
		return AUDIT_LOG_FILTER_UNSUPPORTED_COMPONENT_REASON;
	}

	return undefined;
};

export const getAuditLogFilterDisplayLabel = (label: string, field: string): string => {
	return `${label}(${field.length > 0 ? field : AUDIT_LOG_FILTER_EMPTY_FIELD_LABEL})`;
};

export const getAuditLogFilterOperatorLabel = (operator: string): string => {
	return AUDIT_LOG_FILTER_OPERATOR_LABELS[operator] ?? operator;
};

export const isAuditLogBetweenOperator = (operator: string): boolean => {
	return operator === "between";
};

export const getAuditLogFilterPlaceholder = (
	definition: Pick<AuditLogFilterDefinition, "label" | "operator" | "component">,
	boundary?: "start" | "end",
): string => {
	const operatorLabel = getAuditLogFilterOperatorLabel(definition.operator);
	if (isAuditLogBetweenOperator(definition.operator)) {
		return `${definition.label} ${boundary === "end" ? "종료값" : "시작값"} ${definition.component === "datetime" ? "선택" : "입력"}`;
	}

	if (definition.component === "datetime") {
		return `${definition.label} ${operatorLabel} 조건 선택`;
	}

	return `${definition.label} ${operatorLabel} 조건 입력`;
};

export const toAuditLogFilterDefinition = (value: FilterResponse): AuditLogFilterDefinition | undefined => {
	if (value.table !== AUDIT_LOG_FILTER_TABLE_NAME) {
		return undefined;
	}

	const field = value.field.trim();
	const label = value.label.trim().length > 0 ? value.label.trim() : field;
	const displayField = field.length > 0 ? field : AUDIT_LOG_FILTER_EMPTY_FIELD_LABEL;
	const items = Array.isArray(value.items) ? value.items.filter((item) => item.label.length > 0 && item.value.length > 0) : [];
	const restrictionReason =
		AUDIT_LOG_FILTER_OPTION_COMPONENTS.includes(value.component as "radio" | "checkbox" | "select") && items.length < 1
			? AUDIT_LOG_FILTER_OPTIONLESS_REASON
			: getAuditLogFilterRestrictionReason({field, component: value.component});

	return {
		id: value.id,
		field,
		label: label.length > 0 ? label : displayField,
		displayLabel: getAuditLogFilterDisplayLabel(label.length > 0 ? label : displayField, field),
		displayField,
		operator: value.operator,
		component: value.component,
		dataType: value.dataType,
		items,
		isEnabled: typeof restrictionReason === "undefined",
		...(restrictionReason ? {restrictionReason} : {}),
	};
};

export const normalizeAuditLogFilterDefinitions = (value: FilterResponse[] | undefined): AuditLogFilterDefinition[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => toAuditLogFilterDefinition(item))
		.filter((item): item is AuditLogFilterDefinition => typeof item !== "undefined")
		.sort((left, right) => {
			const labelCompare = left.label.localeCompare(right.label, "ko");
			if (labelCompare !== 0) {
				return labelCompare;
			}

			const fieldCompare = left.field.localeCompare(right.field, "ko");
			if (fieldCompare !== 0) {
				return fieldCompare;
			}

			return left.id - right.id;
		});
};

const createAuditLogFilterFieldState = (definition: AuditLogFilterDefinition): AuditLogFilterFieldState => {
	return {
		definitionId: definition.id,
		field: definition.field,
		operator: definition.operator,
		component: definition.component,
		value: isAuditLogBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : "",
		isEnabled: definition.isEnabled,
		...(definition.restrictionReason ? {restrictionReason: definition.restrictionReason} : {}),
	};
};

export const syncAuditLogFilterFieldStates = (input: AuditLogFilterFieldStateSyncInput): AuditLogFilterFieldStateMap => {
	const nextFieldStates: AuditLogFilterFieldStateMap = {};

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as AuditLogFilterDefinition;
		const previousState = input.previousStates[definition.id];
		const nextValue = definition.isEnabled
			? (previousState?.value ??
				(isAuditLogBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : ""))
			: isAuditLogBetweenOperator(definition.operator)
				? {start: "", end: ""}
				: definition.component === "checkbox"
					? []
					: "";

		nextFieldStates[definition.id] = {
			definitionId: definition.id,
			field: definition.field,
			operator: definition.operator,
			component: definition.component,
			value: nextValue,
			isEnabled: definition.isEnabled,
			...(definition.restrictionReason ? {restrictionReason: definition.restrictionReason} : {}),
		};
	}

	return nextFieldStates;
};

export const setAuditLogFilterFieldStateValue = (input: AuditLogFilterFieldStateValueInput): AuditLogFilterFieldStateMap => {
	const currentFieldState = input.fieldStates[input.definition.id] ?? createAuditLogFilterFieldState(input.definition);

	if (!currentFieldState.isEnabled) {
		return input.fieldStates;
	}

	return {...input.fieldStates, [input.definition.id]: {...currentFieldState, value: input.value}};
};

export const normalizeAuditLogFilterFieldValue = (value: unknown): unknown => {
	if (typeof value === "string") {
		const normalizedValue = value.trim();
		return normalizedValue.length > 0 ? normalizedValue : undefined;
	}

	if (
		typeof value === "object" &&
		value !== null &&
		"start" in value &&
		"end" in value &&
		typeof value.start === "string" &&
		typeof value.end === "string"
	) {
		const start = value.start.trim();
		const end = value.end.trim();
		if (start.length < 1 || end.length < 1) {
			return undefined;
		}

		return {start, end} satisfies AuditLogBetweenFieldValue;
	}

	if (Array.isArray(value)) {
		const normalizedValues = value
			.map((item) => (typeof item === "string" ? item.trim() : item))
			.filter((item) => !(typeof item === "string" && item.length < 1));

		return normalizedValues.length > 0 ? normalizedValues : undefined;
	}

	return value ?? undefined;
};

export const buildAuditLogSearchRequestCandidate = (input: AuditLogSearchRequestCandidateInput): AuditLogSearchRequestCandidate => {
	const filters: AuditLogSearchRequestCandidateItem[] = [];

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as AuditLogFilterDefinition;
		const fieldState = input.fieldStates[definition.id];
		if (!fieldState || !fieldState.isEnabled || fieldState.field.length < 1) {
			continue;
		}

		const normalizedValue = normalizeAuditLogFilterFieldValue(fieldState.value);
		if (typeof normalizedValue === "undefined") {
			continue;
		}

		filters.push({field: fieldState.field, operator: fieldState.operator, component: fieldState.component, value: normalizedValue});
	}

	return {table: AUDIT_LOG_FILTER_TABLE_NAME, filters};
};

/**
 * @summary Audit Log 문자열 값을 표 표시용으로 정규화합니다.
 */
export const normalizeAuditLogText = (value?: string | number): string => {
	if (typeof value === "number") {
		return String(value);
	}

	if (typeof value !== "string" || value.trim().length < 1) {
		return "-";
	}

	return value.trim();
};

/**
 * @summary Audit Log 응답을 테이블 행으로 정규화합니다.
 */
export const toAuditLogTableRows = (logs: AuditLogPageResponse[] | undefined): AuditLogTableRow[] => {
	if (!Array.isArray(logs)) {
		return [];
	}

	return (logs as AuditLogApiRow[]).map((log) => ({
		id: log.id,
		adminName: normalizeAuditLogText(log.adminName ?? log.adminId),
		method: normalizeAuditLogText(log.method),
		url: normalizeAuditLogText(log.url),
		description: normalizeAuditLogText(log.description),
		status: normalizeAuditLogText(log.status),
		executionTimeMs: normalizeAuditLogText(log.executionTimeMs),
		createdAt: log.createdAt,
	}));
};

/**
 * @summary Audit Log query params를 목록 조회 기준으로 생성합니다.
 */
export const buildAuditLogQueryParams = (search: AuditLogListSearch): AuditLogSearchAuditLogsQueryParams => {
	return {page: search.page, size: search.size};
};

export const buildAuditLogSearchQueryParams = (input: AuditLogSearchQueryParamsInput): AuditLogSearchAuditLogsQueryParams => {
	const field: string[] = [];
	const operator: string[] = [];
	const value: string[] = [];

	for (let index = 0; index < input.searchCandidate.filters.length; index += 1) {
		const currentFilter = input.searchCandidate.filters[index] as AuditLogSearchRequestCandidateItem;
		const normalizedValue = normalizeAuditLogFilterFieldValue(currentFilter.value);
		if (typeof normalizedValue === "string") {
			field.push(currentFilter.field);
			operator.push(currentFilter.operator);
			value.push(normalizedValue);
			continue;
		}

		if (
			typeof normalizedValue === "object" &&
			normalizedValue !== null &&
			"start" in normalizedValue &&
			"end" in normalizedValue &&
			typeof normalizedValue.start === "string" &&
			typeof normalizedValue.end === "string"
		) {
			field.push(currentFilter.field);
			operator.push(currentFilter.operator);
			value.push(`${normalizedValue.start},${normalizedValue.end}`);
			continue;
		}

		if (Array.isArray(normalizedValue)) {
			field.push(currentFilter.field);
			operator.push(currentFilter.operator);
			value.push(normalizedValue.join(","));
		}
	}

	return {
		page: input.search.page,
		size: input.search.size,
		...(field.length > 0 ? {field} : {}),
		...(operator.length > 0 ? {operator} : {}),
		...(value.length > 0 ? {value} : {}),
	};
};

/**
 * @summary Audit Log 목록 조회 base query key를 반환합니다.
 */
export const getAuditLogBaseQueryKey = () => {
	return util.query.getBaseQueryKey(auditLogSearchAuditLogsQueryKey);
};
