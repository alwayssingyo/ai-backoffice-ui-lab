import type {RuleObject} from "@rc-component/form/es/interface";
import {boardSaveRequestTypeEnum, type BoardSaveRequest} from "@/services/types/board-save-request.ts";
import type {BoardPageResponse} from "@/services/types/board-page-response.ts";
import type {BoardSearchBoardsQueryParams} from "@/services/types/board/board-search-boards.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {FilterItemOptionResponse} from "@/services/types/filter-item-option-response.ts";
import {boardSearchBoardsQueryKey} from "@/services/hooks/board/use-board-search-boards.ts";
import {config} from "@/entry/config.ts";
import {util} from "@/entry/util.ts";

export const BOARD_DEFAULT_PAGE = 1;
export const BOARD_DEFAULT_PAGE_SIZE = 10;
export const BOARD_FILTER_TABLE_NAME = "board";
export const NOTICE_DEFAULT_GRADE = "안내";
export const NOTICE_GRADE_OPTIONS = [
	{label: "긴급", value: "긴급"},
	{label: "중요", value: "중요"},
	{label: NOTICE_DEFAULT_GRADE, value: NOTICE_DEFAULT_GRADE},
] as const;

/**
 * @summary Board route 구분 키
 */
export type BoardRouteKey = "notice" | "releaseNote";
export type BoardFormMode = "simple" | "rich";

/**
 * @summary Board 목록 검색 상태
 * @property page 현재 페이지
 * @property size 페이지 크기
 */
export interface BoardListSearch {
	page: number;
	size: number;
}

/**
 * @summary Board 화면 구성 정보
 * @property key route 구분 키
 * @property menuKey LNB 선택 키
 * @property label 화면 표시 이름
 * @property path 라우트 경로
 * @property boardType API 유형
 * @property defaultGrade 저장 시 기본 grade
 * @property formMode 화면 입력/출력 구성 방식
 */
export interface BoardRouteConfig {
	key: BoardRouteKey;
	menuKey: (typeof config.navigation.projectMenuKey)[keyof typeof config.navigation.projectMenuKey];
	label: string;
	path: "/project/board/notice" | "/project/board/release-note";
	boardType: BoardSaveRequest["type"];
	defaultGrade: string;
	formMode: BoardFormMode;
	gradeLabel?: string;
	titleLabel?: string;
	contentLabel?: string;
	gradePlaceholder?: string;
	titlePlaceholder?: string;
	contentPlaceholder?: string;
	gradeOptions?: ReadonlyArray<{label: string; value: string}>;
}

/**
 * @summary Board 테이블 행 모델
 * @property id 항목 식별자
 * @property name 단순 화면 표시 이름
 * @property grade Notice 등급
 * @property title Notice 제목
 * @property content Notice 내용
 * @property type 게시판 유형
 * @property createdAt 생성 일시
 */
export interface BoardTableRow {
	id: number;
	name?: string;
	grade?: string;
	title: string;
	content?: string;
	type: BoardPageResponse["type"];
	createdAt: string;
}

/**
 * @summary Board 등록/수정 모달 값
 * @property id 수정 대상 식별자
 * @property name 단순 입력 이름
 * @property grade Notice 등급
 * @property title Notice 제목
 * @property content Notice 내용
 */
export interface BoardFormValues {
	id?: number;
	name?: string;
	grade?: string;
	title?: string;
	content?: string;
}

interface BoardFilterFieldStateSyncInput {
	previousStates: BoardFilterFieldStateMap;
	definitions: BoardFilterDefinition[];
}

interface BoardFilterFieldStateValueInput {
	fieldStates: BoardFilterFieldStateMap;
	definition: BoardFilterDefinition;
	value: unknown;
}

interface BoardSearchRequestCandidateInput {
	definitions: BoardFilterDefinition[];
	fieldStates: BoardFilterFieldStateMap;
}

interface BoardSearchQueryParamsInput {
	routeConfig: BoardRouteConfig;
	searchCandidate: BoardSearchRequestCandidate;
	page: number;
	size: number;
}

const BOARD_FILTER_SUPPORTED_COMPONENTS = ["datetime", "radio", "checkbox", "text", "select"] as const;
const BOARD_FILTER_OPTION_COMPONENTS = ["radio", "checkbox", "select"] as const;

export const BOARD_FILTER_EMPTY_FIELD_LABEL = "field 없음";
export const BOARD_FILTER_OPTIONLESS_REASON = "옵션 정보가 없어 현재 차수에서는 사용할 수 없습니다.";
export const BOARD_FILTER_MISSING_FIELD_REASON = "field 식별자가 없어 현재 차수에서는 사용할 수 없습니다.";
export const BOARD_FILTER_UNSUPPORTED_COMPONENT_REASON = "지원하지 않는 component라 현재 차수에서는 사용할 수 없습니다.";
export const BOARD_FILTER_OPERATOR_LABELS: Record<string, string> = {
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

export type BoardFilterComponent = (typeof BOARD_FILTER_SUPPORTED_COMPONENTS)[number];

export interface BoardFilterDefinition {
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

export interface BoardFilterFieldState {
	definitionId: number;
	field: string;
	operator: string;
	component: string;
	value: unknown;
	isEnabled: boolean;
	restrictionReason?: string;
}

export type BoardFilterFieldStateMap = Record<number, BoardFilterFieldState>;

export interface BoardSearchRequestCandidateItem {
	field: string;
	operator: string;
	component: string;
	value: unknown;
}

export interface BoardSearchRequestCandidate {
	table: string;
	filters: BoardSearchRequestCandidateItem[];
}

export interface BoardBetweenFieldValue {
	start: string;
	end: string;
}

export const BOARD_ROUTE_CONFIG_MAP = {
	notice: {
		key: "notice",
		menuKey: config.navigation.projectMenuKey.boardNotice,
		label: "Notice",
		path: "/project/board/notice",
		boardType: boardSaveRequestTypeEnum.NOTICE,
		defaultGrade: NOTICE_DEFAULT_GRADE,
		formMode: "rich",
		gradeLabel: "등급",
		titleLabel: "제목",
		contentLabel: "내용",
		gradePlaceholder: "등급을 선택해 주세요.",
		titlePlaceholder: "제목을 입력해 주세요.",
		contentPlaceholder: "내용을 입력해 주세요.",
		gradeOptions: NOTICE_GRADE_OPTIONS,
	},
	releaseNote: {
		key: "releaseNote",
		menuKey: config.navigation.projectMenuKey.boardReleaseNote,
		label: "Release Note",
		path: "/project/board/release-note",
		boardType: boardSaveRequestTypeEnum.BUILD_NOTE,
		defaultGrade: "",
		formMode: "rich",
		gradeLabel: "버전",
		titleLabel: "요약",
		contentLabel: "주요 변경",
		gradePlaceholder: "버전을 입력해 주세요.",
		titlePlaceholder: "요약을 입력해 주세요.",
		contentPlaceholder: "주요 변경을 입력해 주세요.",
	},
} as const satisfies Record<BoardRouteKey, BoardRouteConfig>;

/**
 * @summary Board route search 값을 기본값과 함께 정규화합니다.
 */
export const normalizeBoardListSearch = (search: Partial<BoardListSearch> | undefined): BoardListSearch => {
	const page = typeof search?.page === "number" && search.page > 0 ? search.page : BOARD_DEFAULT_PAGE;
	const size = typeof search?.size === "number" && search.size > 0 ? search.size : BOARD_DEFAULT_PAGE_SIZE;

	return {page, size};
};

/**
 * @summary 입력값을 저장 가능한 Board 이름으로 정규화합니다.
 */
export const normalizeBoardName = (value: string): string => {
	return value.trim();
};

export const normalizeBoardContent = (value: string | undefined): string => {
	return value?.trim() ?? "";
};

const isSupportedBoardFilterComponent = (component: string): component is BoardFilterComponent => {
	return BOARD_FILTER_SUPPORTED_COMPONENTS.includes(component as BoardFilterComponent);
};

const getBoardFilterRestrictionReason = (input: {field: string; component: string}): string | undefined => {
	if (input.field.length < 1) {
		return BOARD_FILTER_MISSING_FIELD_REASON;
	}

	if (!isSupportedBoardFilterComponent(input.component)) {
		return BOARD_FILTER_UNSUPPORTED_COMPONENT_REASON;
	}

	return undefined;
};

export const getBoardFilterDisplayLabel = (label: string, field: string): string => {
	return `${label}(${field.length > 0 ? field : BOARD_FILTER_EMPTY_FIELD_LABEL})`;
};

export const getBoardFilterOperatorLabel = (operator: string): string => {
	return BOARD_FILTER_OPERATOR_LABELS[operator] ?? operator;
};

export const isBoardBetweenOperator = (operator: string): boolean => {
	return operator === "between";
};

export const getBoardFilterPlaceholder = (
	definition: Pick<BoardFilterDefinition, "label" | "operator" | "component">,
	boundary?: "start" | "end",
): string => {
	const operatorLabel = getBoardFilterOperatorLabel(definition.operator);
	if (isBoardBetweenOperator(definition.operator)) {
		return `${definition.label} ${boundary === "end" ? "종료값" : "시작값"} ${definition.component === "datetime" ? "선택" : "입력"}`;
	}

	if (definition.component === "datetime") {
		return `${definition.label} ${operatorLabel} 조건 선택`;
	}

	return `${definition.label} ${operatorLabel} 조건 입력`;
};

export const toBoardFilterDefinition = (value: FilterResponse): BoardFilterDefinition | undefined => {
	if (value.table !== BOARD_FILTER_TABLE_NAME) {
		return undefined;
	}

	const field = value.field.trim();
	const label = value.label.trim().length > 0 ? value.label.trim() : field;
	const displayField = field.length > 0 ? field : BOARD_FILTER_EMPTY_FIELD_LABEL;
	const items = Array.isArray(value.items) ? value.items.filter((item) => item.label.length > 0 && item.value.length > 0) : [];
	const restrictionReason =
		BOARD_FILTER_OPTION_COMPONENTS.includes(value.component as "radio" | "checkbox" | "select") && items.length < 1
			? BOARD_FILTER_OPTIONLESS_REASON
			: getBoardFilterRestrictionReason({field, component: value.component});

	return {
		id: value.id,
		field,
		label: label.length > 0 ? label : displayField,
		displayLabel: getBoardFilterDisplayLabel(label.length > 0 ? label : displayField, field),
		displayField,
		operator: value.operator,
		component: value.component,
		dataType: value.dataType,
		items,
		isEnabled: typeof restrictionReason === "undefined",
		...(restrictionReason ? {restrictionReason} : {}),
	};
};

export const normalizeBoardFilterDefinitions = (value: FilterResponse[] | undefined): BoardFilterDefinition[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => toBoardFilterDefinition(item))
		.filter((item): item is BoardFilterDefinition => typeof item !== "undefined")
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

const createBoardFilterFieldState = (definition: BoardFilterDefinition): BoardFilterFieldState => {
	return {
		definitionId: definition.id,
		field: definition.field,
		operator: definition.operator,
		component: definition.component,
		value: isBoardBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : "",
		isEnabled: definition.isEnabled,
		...(definition.restrictionReason ? {restrictionReason: definition.restrictionReason} : {}),
	};
};

export const syncBoardFilterFieldStates = (input: BoardFilterFieldStateSyncInput): BoardFilterFieldStateMap => {
	const nextFieldStates: BoardFilterFieldStateMap = {};

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as BoardFilterDefinition;
		const previousState = input.previousStates[definition.id];
		const nextValue = definition.isEnabled
			? (previousState?.value ??
				(isBoardBetweenOperator(definition.operator) ? {start: "", end: ""} : definition.component === "checkbox" ? [] : ""))
			: isBoardBetweenOperator(definition.operator)
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

export const setBoardFilterFieldStateValue = (input: BoardFilterFieldStateValueInput): BoardFilterFieldStateMap => {
	const currentFieldState = input.fieldStates[input.definition.id] ?? createBoardFilterFieldState(input.definition);

	if (!currentFieldState.isEnabled) {
		return input.fieldStates;
	}

	return {...input.fieldStates, [input.definition.id]: {...currentFieldState, value: input.value}};
};

export const normalizeBoardFilterFieldValue = (value: unknown): unknown => {
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

		return {start, end} satisfies BoardBetweenFieldValue;
	}

	if (Array.isArray(value)) {
		const normalizedValues = value
			.map((item) => (typeof item === "string" ? item.trim() : item))
			.filter((item) => !(typeof item === "string" && item.length < 1));

		return normalizedValues.length > 0 ? normalizedValues : undefined;
	}

	return value ?? undefined;
};

export const buildBoardSearchRequestCandidate = (input: BoardSearchRequestCandidateInput): BoardSearchRequestCandidate => {
	const filters: BoardSearchRequestCandidateItem[] = [];

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as BoardFilterDefinition;
		const fieldState = input.fieldStates[definition.id];
		if (!fieldState || !fieldState.isEnabled || fieldState.field.length < 1) {
			continue;
		}

		const normalizedValue = normalizeBoardFilterFieldValue(fieldState.value);
		if (typeof normalizedValue === "undefined") {
			continue;
		}

		filters.push({field: fieldState.field, operator: fieldState.operator, component: fieldState.component, value: normalizedValue});
	}

	return {table: BOARD_FILTER_TABLE_NAME, filters};
};

export const buildBoardSearchQueryParams = (input: BoardSearchQueryParamsInput): BoardSearchBoardsQueryParams => {
	const field: string[] = [];
	const operator: string[] = [];
	const value: string[] = [];

	for (let index = 0; index < input.searchCandidate.filters.length; index += 1) {
		const currentFilter = input.searchCandidate.filters[index] as BoardSearchRequestCandidateItem;
		const normalizedValue = normalizeBoardFilterFieldValue(currentFilter.value);
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
		type: input.routeConfig.boardType,
		page: input.page,
		size: input.size,
		...(field.length > 0 ? {field} : {}),
		...(operator.length > 0 ? {operator} : {}),
		...(value.length > 0 ? {value} : {}),
	};
};

export const normalizeNoticeGrade = (value: string | undefined): string => {
	const normalizedValue = normalizeBoardName(value ?? "");
	return NOTICE_GRADE_OPTIONS.some((option) => option.value === normalizedValue) ? normalizedValue : "";
};

/**
 * @summary Board 응답 목록을 현재 route용 테이블 행으로 정규화합니다.
 */
export const toBoardTableRows = (boardPages: BoardPageResponse[] | undefined, routeConfig: BoardRouteConfig): BoardTableRow[] => {
	if (!Array.isArray(boardPages)) {
		return [];
	}

	return boardPages
		.filter((boardPage) => boardPage.type === routeConfig.boardType)
		.map((boardPage) => ({
			id: boardPage.id,
			name: routeConfig.formMode === "simple" ? boardPage.title : undefined,
			grade: boardPage.grade,
			title: boardPage.title,
			content: boardPage.content,
			type: boardPage.type,
			createdAt: boardPage.createdAt,
		}));
};

/**
 * @summary Board 저장 payload를 생성합니다.
 */
export const buildBoardUpsertPayload = (values: BoardFormValues, routeConfig: BoardRouteConfig): BoardSaveRequest => {
	const normalizedTitle = normalizeBoardName(routeConfig.formMode === "rich" ? (values.title ?? "") : (values.name ?? ""));
	const normalizedGrade =
		routeConfig.formMode === "rich"
			? routeConfig.gradeOptions
				? normalizeNoticeGrade(values.grade)
				: normalizeBoardName(values.grade ?? "")
			: routeConfig.defaultGrade;
	const normalizedContent = routeConfig.formMode === "rich" ? normalizeBoardContent(values.content) : "";

	return {
		...(typeof values.id === "number" ? {id: values.id} : {}),
		type: routeConfig.boardType,
		grade: normalizedGrade,
		title: normalizedTitle,
		content: normalizedContent,
	};
};

/**
 * @summary Board 이름 검증 규칙을 생성합니다.
 */
export const buildBoardNameRules = (): RuleObject[] => {
	return [
		{
			validator: async (_rule, value?: string) => {
				if (typeof value !== "string" || normalizeBoardName(value).length < 1) {
					throw new Error("이름을 입력해 주세요.");
				}
			},
		},
	];
};

export const buildBoardGradeRules = (params: {label: string; options?: ReadonlyArray<{label: string; value: string}>}): RuleObject[] => {
	const {label, options} = params;
	return [
		{
			validator: async (_rule, value?: string) => {
				const normalizedValue = options
					? options.some((option) => option.value === normalizeBoardName(value ?? ""))
						? normalizeBoardName(value ?? "")
						: ""
					: normalizeBoardName(value ?? "");
				if (normalizedValue.length < 1) {
					throw new Error(`${label}을 입력해 주세요.`);
				}
			},
		},
	];
};

export const buildBoardTitleRules = (label = "제목"): RuleObject[] => {
	return [
		{
			validator: async (_rule, value?: string) => {
				if (typeof value !== "string" || normalizeBoardName(value).length < 1) {
					throw new Error(`${label}을 입력해 주세요.`);
				}
			},
		},
	];
};

/**
 * @summary Board 목록 조회 invalidation key를 반환합니다.
 */
export const getBoardQueryInvalidationKey = () => {
	return util.query.getBaseQueryKey(boardSearchBoardsQueryKey);
};
