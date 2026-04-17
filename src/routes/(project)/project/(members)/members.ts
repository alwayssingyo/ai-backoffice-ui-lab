import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {FilterItemOptionResponse} from "@/services/types/filter-item-option-response.ts";
import type {AdminSearchAdminsQueryParams} from "@/services/types/admin/admin-search-admins.ts";

export const MEMBERS_FILTER_TABLE_NAME = "admins";

interface MembersFilterFieldStateSyncInput {
	previousStates: MembersFilterFieldStateMap;
	definitions: MembersFilterDefinition[];
}

interface MembersFilterFieldStateValueInput {
	fieldStates: MembersFilterFieldStateMap;
	definition: MembersFilterDefinition;
	value: unknown;
}

interface MembersSearchRequestCandidateInput {
	definitions: MembersFilterDefinition[];
	fieldStates: MembersFilterFieldStateMap;
}

interface MembersSearchQueryParamsInput {
	searchCandidate: MembersSearchRequestCandidate;
	page: number;
	size: number;
}

const MEMBERS_FILTER_SUPPORTED_COMPONENTS = ["datetime", "radio", "checkbox", "text", "select"] as const;
const MEMBERS_FILTER_OPTION_COMPONENTS = ["radio", "checkbox", "select"] as const;

export const MEMBERS_FILTER_EMPTY_FIELD_LABEL = "field 없음";
export const MEMBERS_FILTER_OPTIONLESS_REASON = "옵션 정보가 없어 현재 차수에서는 사용할 수 없습니다.";
export const MEMBERS_FILTER_MISSING_FIELD_REASON = "field 식별자가 없어 현재 차수에서는 사용할 수 없습니다.";
export const MEMBERS_FILTER_UNSUPPORTED_COMPONENT_REASON = "지원하지 않는 component라 현재 차수에서는 사용할 수 없습니다.";
export const MEMBERS_FILTER_OPERATOR_LABELS: Record<string, string> = {
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

export type MembersFilterComponent = (typeof MEMBERS_FILTER_SUPPORTED_COMPONENTS)[number];

export interface MembersFilterDefinition {
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

export interface MembersFilterFieldState {
	definitionId: number;
	field: string;
	operator: string;
	component: string;
	value: unknown;
	isEnabled: boolean;
	restrictionReason?: string;
}

export type MembersFilterFieldStateMap = Record<number, MembersFilterFieldState>;

export interface MembersSearchRequestCandidateItem {
	field: string;
	operator: string;
	component: string;
	value: unknown;
}

export interface MembersSearchRequestCandidate {
	table: string;
	filters: MembersSearchRequestCandidateItem[];
}

export interface MembersBetweenFieldValue {
	start: string;
	end: string;
}

const isSupportedMembersFilterComponent = (component: string): component is MembersFilterComponent => {
	return MEMBERS_FILTER_SUPPORTED_COMPONENTS.includes(component as MembersFilterComponent);
};

const getMembersFilterRestrictionReason = (input: {field: string; component: string}): string | undefined => {
	if (input.field.length < 1) {
		return MEMBERS_FILTER_MISSING_FIELD_REASON;
	}

	if (!isSupportedMembersFilterComponent(input.component)) {
		return MEMBERS_FILTER_UNSUPPORTED_COMPONENT_REASON;
	}

	return undefined;
};

export const getMembersFilterDisplayLabel = (label: string, field: string): string => {
	return `${label}(${field.length > 0 ? field : MEMBERS_FILTER_EMPTY_FIELD_LABEL})`;
};

export const getMembersFilterOperatorLabel = (operator: string): string => {
	return MEMBERS_FILTER_OPERATOR_LABELS[operator] ?? operator;
};

export const isMembersBetweenOperator = (operator: string): boolean => {
	return operator === "between";
};

export const getMembersFilterPlaceholder = (
	definition: Pick<MembersFilterDefinition, "label" | "operator" | "component">,
	boundary?: "start" | "end",
): string => {
	const operatorLabel = getMembersFilterOperatorLabel(definition.operator);
	if (isMembersBetweenOperator(definition.operator)) {
		return `${definition.label} ${boundary === "end" ? "종료값" : "시작값"} ${definition.component === "datetime" ? "선택" : "입력"}`;
	}

	if (definition.component === "datetime") {
		return `${definition.label} ${operatorLabel} 조건 선택`;
	}

	return `${definition.label} ${operatorLabel} 조건 입력`;
};

export const toMembersFilterDefinition = (value: FilterResponse): MembersFilterDefinition | undefined => {
	if (value.table !== MEMBERS_FILTER_TABLE_NAME) {
		return undefined;
	}

	const field = value.field.trim();
	const label = value.label.trim().length > 0 ? value.label.trim() : field;
	const displayField = field.length > 0 ? field : MEMBERS_FILTER_EMPTY_FIELD_LABEL;
	const items = Array.isArray(value.items) ? value.items.filter((item) => item.label.length > 0 && item.value.length > 0) : [];
	const restrictionReason =
		MEMBERS_FILTER_OPTION_COMPONENTS.includes(value.component as "radio" | "checkbox" | "select") && items.length < 1
			? MEMBERS_FILTER_OPTIONLESS_REASON
			: getMembersFilterRestrictionReason({field, component: value.component});

	return {
		id: value.id,
		field,
		label: label.length > 0 ? label : displayField,
		displayLabel: getMembersFilterDisplayLabel(label.length > 0 ? label : displayField, field),
		displayField,
		operator: value.operator,
		component: value.component,
		dataType: value.dataType,
		items,
		isEnabled: typeof restrictionReason === "undefined",
		...(restrictionReason ? {restrictionReason} : {}),
	};
};

export const normalizeMembersFilterDefinitions = (value: FilterResponse[] | undefined): MembersFilterDefinition[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => toMembersFilterDefinition(item))
		.filter((item): item is MembersFilterDefinition => typeof item !== "undefined")
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

const createMembersFilterFieldState = (definition: MembersFilterDefinition): MembersFilterFieldState => {
	return {
		definitionId: definition.id,
		field: definition.field,
		operator: definition.operator,
		component: definition.component,
		value: isMembersBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : "",
		isEnabled: definition.isEnabled,
		...(definition.restrictionReason ? {restrictionReason: definition.restrictionReason} : {}),
	};
};

export const syncMembersFilterFieldStates = (input: MembersFilterFieldStateSyncInput): MembersFilterFieldStateMap => {
	const nextFieldStates: MembersFilterFieldStateMap = {};

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as MembersFilterDefinition;
		const previousState = input.previousStates[definition.id];
		const nextValue = definition.isEnabled
			? (previousState?.value ??
				(isMembersBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : ""))
			: isMembersBetweenOperator(definition.operator)
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

export const setMembersFilterFieldStateValue = (input: MembersFilterFieldStateValueInput): MembersFilterFieldStateMap => {
	const currentFieldState = input.fieldStates[input.definition.id] ?? createMembersFilterFieldState(input.definition);

	if (!currentFieldState.isEnabled) {
		return input.fieldStates;
	}

	return {...input.fieldStates, [input.definition.id]: {...currentFieldState, value: input.value}};
};

export const normalizeMembersFilterFieldValue = (value: unknown): unknown => {
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

		return {start, end} satisfies MembersBetweenFieldValue;
	}

	if (Array.isArray(value)) {
		const normalizedValues = value
			.map((item) => (typeof item === "string" ? item.trim() : item))
			.filter((item) => !(typeof item === "string" && item.length < 1));

		return normalizedValues.length > 0 ? normalizedValues : undefined;
	}

	return value ?? undefined;
};

export const buildMembersSearchRequestCandidate = (input: MembersSearchRequestCandidateInput): MembersSearchRequestCandidate => {
	const filters: MembersSearchRequestCandidateItem[] = [];

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as MembersFilterDefinition;
		const fieldState = input.fieldStates[definition.id];
		if (!fieldState || !fieldState.isEnabled || fieldState.field.length < 1) {
			continue;
		}

		const normalizedValue = normalizeMembersFilterFieldValue(fieldState.value);
		if (typeof normalizedValue === "undefined") {
			continue;
		}

		filters.push({field: fieldState.field, operator: fieldState.operator, component: fieldState.component, value: normalizedValue});
	}

	return {table: MEMBERS_FILTER_TABLE_NAME, filters};
};

export const buildMembersSearchQueryParams = (input: MembersSearchQueryParamsInput): AdminSearchAdminsQueryParams => {
	const field: string[] = [];
	const operator: string[] = [];
	const value: string[] = [];

	for (let index = 0; index < input.searchCandidate.filters.length; index += 1) {
		const currentFilter = input.searchCandidate.filters[index] as MembersSearchRequestCandidateItem;
		const normalizedValue = normalizeMembersFilterFieldValue(currentFilter.value);
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
		page: input.page,
		size: input.size,
		...(field.length > 0 ? {field} : {}),
		...(operator.length > 0 ? {operator} : {}),
		...(value.length > 0 ? {value} : {}),
	};
};
