import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {FilterItemOptionResponse} from "@/services/types/filter-item-option-response.ts";
import type {MediaLibrarySearchMediaLibraryQueryParams} from "@/services/types/media-library/media-library-search-media-library.ts";
import {upsertMediaFileRequestProviderEnum} from "@/services/types/upsert-media-file-request.ts";
import {mediaLibrarySearchMediaLibraryQueryKey} from "@/services/hooks/media-library/use-media-library-search-media-library.ts";
import {util} from "@/entry/util.ts";

export const MEDIA_LIBRARY_DEFAULT_PAGE = 1;
export const MEDIA_LIBRARY_DEFAULT_COLUMN_NAME = "files";
export const MEDIA_LIBRARY_DEFAULT_PAGE_SIZE = 20;

/**
 * @summary 미디어 라이브러리 목록 검색 상태
 * @property page 현재 페이지
 * @property size 페이지 크기
 * @property searchKeyword 검색 키워드
 */
export interface MediaLibraryListSearch {
	page: number;
	size: number;
	searchKeyword?: string;
}

/**
 * @summary 미디어 라이브러리 자산 모델
 * @property id 서버 자산 식별자
 * @property referenceCount 현재 자산 참조 수
 * @property createdAt 자산 생성 시각
 */
export interface MediaLibraryAsset extends UpsertMediaFileRequest {
	id: number;
	referenceCount: number;
	createdAt?: string;
}

/**
 * @summary 미디어 라이브러리 업서트 요청 DTO
 * @property files 업로드된 파일 메타 목록
 */
export interface MediaLibraryUpsertFilesRequest {
	files: UpsertMediaFileRequest[];
}

/**
 * @summary 미디어 라이브러리 페이지 수 계산 입력값
 * @property totalAssetCount 서버 전체 자산 수
 * @property fallbackAssetCount 전체 수가 없을 때 사용할 목록 수
 * @property pageSize 페이지 크기
 */
interface MediaLibraryPageCountInput {
	totalAssetCount?: number;
	fallbackAssetCount: number;
	pageSize: number;
}

/**
 * @summary 미디어 라이브러리 페이지 슬라이스 입력값
 * @property assets 페이지네이션 대상 자산 목록
 * @property currentPage 현재 페이지
 * @property pageSize 페이지 크기
 */
interface MediaLibraryPageSliceInput {
	assets: MediaLibraryAsset[];
	currentPage: number;
	pageSize: number;
}

/**
 * @summary 미디어 라이브러리 선택 상태 입력값
 * @property assets 선택 대상 자산 목록
 * @property selectedAssetIds 현재 선택된 자산 id 목록
 */
interface MediaLibrarySelectionStateInput {
	assets: MediaLibraryAsset[];
	selectedAssetIds: number[];
}

/**
 * @summary 미디어 라이브러리 힌트 메시지 입력값
 * @property isError 라이브러리 조회 실패 여부
 * @property assetCount 조회된 자산 수
 */
interface MediaLibraryHintTextInput {
	isError: boolean;
	assetCount: number;
}

interface MediaLibraryFilterRestrictionReasonInput {
	field: string;
	component: string;
}

interface MediaLibraryFilterFieldStateSyncInput {
	previousStates: MediaLibraryFilterFieldStateMap;
	definitions: MediaLibraryFilterDefinition[];
}

interface MediaLibraryFilterFieldStateValueInput {
	fieldStates: MediaLibraryFilterFieldStateMap;
	definition: MediaLibraryFilterDefinition;
	value: unknown;
}

interface MediaLibrarySearchRequestCandidateInput {
	definitions: MediaLibraryFilterDefinition[];
	fieldStates: MediaLibraryFilterFieldStateMap;
}

interface MediaLibrarySearchQueryParamsInput {
	searchCandidate: MediaLibrarySearchRequestCandidate;
	page: number;
	size: number;
}

const MEDIA_LIBRARY_ASSET_MIME_TYPE_KEYS = ["mimeType", "mime_type"] as const;
const MEDIA_LIBRARY_ASSET_CREATED_AT_KEYS = ["createdAt", "created_at", "updatedAt", "updated_at"] as const;
const MEDIA_LIBRARY_ASSET_REFERENCE_COUNT_KEYS = ["referenceCount", "reference_count", "usedCount", "used_count"] as const;
const MEDIA_LIBRARY_FILTER_SUPPORTED_COMPONENTS = ["datetime", "radio", "checkbox", "text", "select"] as const;
const MEDIA_LIBRARY_FILTER_OPTION_COMPONENTS = ["radio", "checkbox", "select"] as const;

export const MEDIA_LIBRARY_FILTER_EMPTY_FIELD_LABEL = "field 없음";
export const MEDIA_LIBRARY_FILTER_OPTIONLESS_REASON = "옵션 정보가 없어 현재 차수에서는 사용할 수 없습니다.";
export const MEDIA_LIBRARY_FILTER_MISSING_FIELD_REASON = "field 식별자가 없어 현재 차수에서는 사용할 수 없습니다.";
export const MEDIA_LIBRARY_FILTER_UNSUPPORTED_COMPONENT_REASON = "지원하지 않는 component라 현재 차수에서는 사용할 수 없습니다.";
export const MEDIA_LIBRARY_FILTER_OPERATOR_LABELS: Record<string, string> = {
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

export type MediaLibraryFilterComponent = (typeof MEDIA_LIBRARY_FILTER_SUPPORTED_COMPONENTS)[number];

/**
 * @summary Media Library 검색 패널 정의 모델
 * @property id 필터 정의 아이디
 * @property field 검색 payload field
 * @property label 운영자 표시 라벨
 * @property displayLabel 패널 표시용 label(field)
 * @property displayField 패널 표시용 field 텍스트
 * @property operator 서버 비교 연산자
 * @property component 입력 컴포넌트 타입
 * @property dataType 서버 컬럼 타입 힌트
 * @property isEnabled 현재 차수에서 입력 가능 여부
 * @property restrictionReason 제한 사유
 */
export interface MediaLibraryFilterDefinition {
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

/**
 * @summary Media Library 검색 패널 입력 상태
 * @property definitionId 필터 정의 아이디
 * @property field 검색 payload field
 * @property operator 서버 비교 연산자
 * @property component 입력 컴포넌트 타입
 * @property value 현재 입력값
 * @property isEnabled 현재 차수에서 입력 가능 여부
 * @property restrictionReason 제한 사유
 */
export interface MediaLibraryFilterFieldState {
	definitionId: number;
	field: string;
	operator: string;
	component: string;
	value: unknown;
	isEnabled: boolean;
	restrictionReason?: string;
}

export type MediaLibraryFilterFieldStateMap = Record<number, MediaLibraryFilterFieldState>;

/**
 * @summary Media Library 검색 payload 후보 단건
 * @property field 검색 payload field
 * @property operator 서버 비교 연산자
 * @property component 입력 컴포넌트 타입
 * @property value 현재 입력값
 */
export interface MediaLibrarySearchRequestCandidateItem {
	field: string;
	operator: string;
	component: string;
	value: unknown;
}

/**
 * @summary Media Library 검색 payload 후보
 * @property table 검색 대상 테이블명
 * @property filters 유효한 필터 조건 목록
 */
export interface MediaLibrarySearchRequestCandidate {
	table: string;
	filters: MediaLibrarySearchRequestCandidateItem[];
}

export interface MediaLibraryBetweenFieldValue {
	start: string;
	end: string;
}

/**
 * @summary route search keyword를 정규화합니다.
 */
const normalizeMediaLibrarySearchKeyword = (value: string | undefined): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalizedValue = value.trim();
	return normalizedValue.length > 0 ? normalizedValue : undefined;
};

/**
 * @summary 객체 레코드 타입 가드
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

/**
 * @summary 문자열 필드 추출
 */
const getString = (value: unknown): string | undefined => {
	return typeof value === "string" && value.length > 0 ? value : undefined;
};

/**
 * @summary 숫자 필드 추출
 */
const getNumber = (value: unknown): number | undefined => {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

/**
 * @summary 다중 키 문자열 필드 추출
 */
const getStringByKeys = (value: Record<string, unknown>, keys: readonly string[]): string | undefined => {
	for (let index = 0; index < keys.length; index += 1) {
		const resolvedValue = getString(value[keys[index]]);
		if (resolvedValue) {
			return resolvedValue;
		}
	}

	return undefined;
};

/**
 * @summary 다중 키 숫자 필드 추출
 */
const getNumberByKeys = (value: Record<string, unknown>, keys: readonly string[]): number | undefined => {
	for (let index = 0; index < keys.length; index += 1) {
		const resolvedValue = getNumber(value[keys[index]]);
		if (typeof resolvedValue === "number") {
			return resolvedValue;
		}
	}

	return undefined;
};

/**
 * @summary 지원하는 Media Library 필터 component 여부를 판별합니다.
 */
const isSupportedMediaLibraryFilterComponent = (component: string): component is MediaLibraryFilterComponent => {
	return MEDIA_LIBRARY_FILTER_SUPPORTED_COMPONENTS.includes(component as MediaLibraryFilterComponent);
};

/**
 * @summary Media Library 필터 정의의 제한 사유를 계산합니다.
 */
const getMediaLibraryFilterRestrictionReason = (input: MediaLibraryFilterRestrictionReasonInput): string | undefined => {
	if (input.field.length < 1) {
		return MEDIA_LIBRARY_FILTER_MISSING_FIELD_REASON;
	}

	if (!isSupportedMediaLibraryFilterComponent(input.component)) {
		return MEDIA_LIBRARY_FILTER_UNSUPPORTED_COMPONENT_REASON;
	}

	return undefined;
};

/**
 * @summary Media Library 필터 정의 표시 라벨을 생성합니다.
 */
export const getMediaLibraryFilterDisplayLabel = (label: string, field: string): string => {
	return `${label}(${field.length > 0 ? field : MEDIA_LIBRARY_FILTER_EMPTY_FIELD_LABEL})`;
};

/**
 * @summary Media Library 필터 operator를 사람이 읽기 쉬운 문구로 변환합니다.
 */
export const getMediaLibraryFilterOperatorLabel = (operator: string): string => {
	return MEDIA_LIBRARY_FILTER_OPERATOR_LABELS[operator] ?? operator;
};

/**
 * @summary Media Library 필터 입력 placeholder를 생성합니다.
 */
export const getMediaLibraryFilterPlaceholder = (
	definition: Pick<MediaLibraryFilterDefinition, "label" | "operator" | "component">,
	boundary?: "start" | "end",
): string => {
	const operatorLabel = getMediaLibraryFilterOperatorLabel(definition.operator);
	if (definition.operator === "between") {
		return `${definition.label} ${boundary === "end" ? "종료값" : "시작값"} ${definition.component === "datetime" ? "선택" : "입력"}`;
	}

	if (definition.component === "datetime") {
		return `${definition.label} ${operatorLabel} 조건 선택`;
	}

	return `${definition.label} ${operatorLabel} 조건 입력`;
};

/**
 * @summary 단건 Media Library 필터 정의를 정규화합니다.
 */
export const toMediaLibraryFilterDefinition = (value: FilterResponse): MediaLibraryFilterDefinition | undefined => {
	if (value.table !== MEDIA_LIBRARY_DEFAULT_COLUMN_NAME) {
		return undefined;
	}

	const field = value.field.trim();
	const label = value.label.trim().length > 0 ? value.label.trim() : field;
	const displayField = field.length > 0 ? field : MEDIA_LIBRARY_FILTER_EMPTY_FIELD_LABEL;
	const items = Array.isArray(value.items) ? value.items.filter((item) => item.label.length > 0 && item.value.length > 0) : [];
	const restrictionReason =
		MEDIA_LIBRARY_FILTER_OPTION_COMPONENTS.includes(value.component as "radio" | "checkbox" | "select") && items.length < 1
			? MEDIA_LIBRARY_FILTER_OPTIONLESS_REASON
			: getMediaLibraryFilterRestrictionReason({field, component: value.component});

	return {
		id: value.id,
		field,
		label: label.length > 0 ? label : displayField,
		displayLabel: getMediaLibraryFilterDisplayLabel(label.length > 0 ? label : displayField, field),
		displayField,
		operator: value.operator,
		component: value.component,
		dataType: value.dataType,
		items,
		isEnabled: typeof restrictionReason === "undefined",
		...(restrictionReason ? {restrictionReason} : {}),
	};
};

/**
 * @summary Media Library 필터 정의 배열을 정규화하고 표시 순서를 고정합니다.
 */
export const normalizeMediaLibraryFilterDefinitions = (value: FilterResponse[] | undefined): MediaLibraryFilterDefinition[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => toMediaLibraryFilterDefinition(item))
		.filter((item): item is MediaLibraryFilterDefinition => typeof item !== "undefined")
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

/**
 * @summary Media Library 필터 입력 기본 상태를 생성합니다.
 */
const createMediaLibraryFilterFieldState = (definition: MediaLibraryFilterDefinition): MediaLibraryFilterFieldState => {
	return {
		definitionId: definition.id,
		field: definition.field,
		operator: definition.operator,
		component: definition.component,
		value: definition.operator === "between" ? {start: "", end: ""} : definition.component === "checkbox" ? [] : "",
		isEnabled: definition.isEnabled,
		...(definition.restrictionReason ? {restrictionReason: definition.restrictionReason} : {}),
	};
};

/**
 * @summary 새 필터 정의 목록에 맞춰 입력 상태를 동기화합니다.
 */
export const syncMediaLibraryFilterFieldStates = (input: MediaLibraryFilterFieldStateSyncInput): MediaLibraryFilterFieldStateMap => {
	const nextFieldStates: MediaLibraryFilterFieldStateMap = {};

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as MediaLibraryFilterDefinition;
		const previousState = input.previousStates[definition.id];
		const nextValue = definition.isEnabled
			? (previousState?.value ?? (definition.operator === "between" ? {start: "", end: ""} : definition.component === "checkbox" ? [] : ""))
			: definition.operator === "between"
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

/**
 * @summary 단일 Media Library 필터 입력값을 갱신합니다.
 */
export const setMediaLibraryFilterFieldStateValue = (input: MediaLibraryFilterFieldStateValueInput): MediaLibraryFilterFieldStateMap => {
	const currentFieldState = input.fieldStates[input.definition.id] ?? createMediaLibraryFilterFieldState(input.definition);

	if (!currentFieldState.isEnabled) {
		return input.fieldStates;
	}

	return {...input.fieldStates, [input.definition.id]: {...currentFieldState, value: input.value}};
};

/**
 * @summary Media Library 필터 입력값을 payload 직전 형태로 정규화합니다.
 */
export const normalizeMediaLibraryFilterFieldValue = (value: unknown): unknown => {
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

		return {start, end} satisfies MediaLibraryBetweenFieldValue;
	}

	if (Array.isArray(value)) {
		const normalizedValues = value
			.map((item) => (typeof item === "string" ? item.trim() : item))
			.filter((item) => !(typeof item === "string" && item.length < 1));

		return normalizedValues.length > 0 ? normalizedValues : undefined;
	}

	return value ?? undefined;
};

/**
 * @summary Media Library 검색 payload 후보를 생성합니다.
 */
export const buildMediaLibrarySearchRequestCandidate = (
	input: MediaLibrarySearchRequestCandidateInput,
): MediaLibrarySearchRequestCandidate => {
	const filters: MediaLibrarySearchRequestCandidateItem[] = [];

	for (let index = 0; index < input.definitions.length; index += 1) {
		const definition = input.definitions[index] as MediaLibraryFilterDefinition;
		const fieldState = input.fieldStates[definition.id];

		// field 또는 입력값이 없거나 제한 상태인 행은 이번 차수 payload에서 제외한다.
		if (!fieldState || !fieldState.isEnabled || fieldState.field.length < 1) {
			continue;
		}

		const normalizedValue = normalizeMediaLibraryFilterFieldValue(fieldState.value);
		if (typeof normalizedValue === "undefined") {
			continue;
		}

		filters.push({field: fieldState.field, operator: fieldState.operator, component: fieldState.component, value: normalizedValue});
	}

	return {table: MEDIA_LIBRARY_DEFAULT_COLUMN_NAME, filters};
};

/**
 * @summary Media Library 검색 payload 후보를 실제 목록 조회 query params로 변환합니다.
 */
export const buildMediaLibrarySearchQueryParams = (
	input: MediaLibrarySearchQueryParamsInput,
): MediaLibrarySearchMediaLibraryQueryParams => {
	const field: string[] = [];
	const operator: string[] = [];
	const value: string[] = [];

	for (let index = 0; index < input.searchCandidate.filters.length; index += 1) {
		const currentFilter = input.searchCandidate.filters[index] as MediaLibrarySearchRequestCandidateItem;
		const normalizedValue = normalizeMediaLibraryFilterFieldValue(currentFilter.value);
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
		includePrivate: true,
		page: input.page,
		size: input.size,
		...(field.length > 0 ? {field} : {}),
		...(operator.length > 0 ? {operator} : {}),
		...(value.length > 0 ? {value} : {}),
	};
};

/**
 * @summary provider 필드 정규화
 */
const toMediaLibraryProvider = (value: unknown): UpsertMediaFileRequest["provider"] => {
	if (
		value === upsertMediaFileRequestProviderEnum.AWS ||
		value === upsertMediaFileRequestProviderEnum.GCP ||
		value === upsertMediaFileRequestProviderEnum.NCP ||
		value === upsertMediaFileRequestProviderEnum.LOCAL
	) {
		return value;
	}

	return upsertMediaFileRequestProviderEnum.AWS;
};

/**
 * @summary 파일 크기 라벨 포맷
 */
export const formatMediaLibraryAssetSize = (size: number): string => {
	if (size >= 1024 * 1024) {
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	}

	return `${(size / 1024).toFixed(1)} KB`;
};

/**
 * @summary 이미지 미리보기 가능 자산 판별
 */
export const isMediaLibraryAssetPreviewable = (asset: Pick<MediaLibraryAsset, "mimeType" | "ext">): boolean => {
	if (asset.mimeType.startsWith("image/")) {
		return true;
	}

	return ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(asset.ext.toLowerCase());
};

/**
 * @summary 단건 미디어 자산 정규화
 */
export const toMediaLibraryAsset = (value: unknown): MediaLibraryAsset | undefined => {
	if (!isObjectRecord(value)) {
		return undefined;
	}

	const id = getNumber(value.id);
	const name = getString(value.name);
	const url = getString(value.url);
	const path = getString(value.path);
	const mimeType = getStringByKeys(value, MEDIA_LIBRARY_ASSET_MIME_TYPE_KEYS);
	const size = getNumber(value.size);
	const ext = typeof value.ext === "string" ? value.ext : "";

	if (typeof id !== "number" || !name || !url || !path || !mimeType || typeof size !== "number") {
		return undefined;
	}

	return {
		id,
		name,
		url,
		path,
		mimeType,
		size,
		ext,
		provider: toMediaLibraryProvider(value.provider),
		referenceCount: getNumberByKeys(value, MEDIA_LIBRARY_ASSET_REFERENCE_COUNT_KEYS) ?? 0,
		createdAt: getStringByKeys(value, MEDIA_LIBRARY_ASSET_CREATED_AT_KEYS),
	};
};

/**
 * @summary 미디어 자산 배열 정규화
 */
export const normalizeMediaLibraryAssets = (value: unknown): MediaLibraryAsset[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map((item) => toMediaLibraryAsset(item)).filter((item): item is MediaLibraryAsset => typeof item !== "undefined");
};

/**
 * @summary Media Library route search 값을 기본값과 함께 정규화합니다.
 */
export const normalizeMediaLibraryListSearch = (search: Partial<MediaLibraryListSearch> | undefined): MediaLibraryListSearch => {
	const page = typeof search?.page === "number" && search.page > 0 ? search.page : MEDIA_LIBRARY_DEFAULT_PAGE;
	const size = typeof search?.size === "number" && search.size > 0 ? search.size : MEDIA_LIBRARY_DEFAULT_PAGE_SIZE;
	const searchKeyword = normalizeMediaLibrarySearchKeyword(search?.searchKeyword);

	return {...(searchKeyword ? {searchKeyword} : {}), page, size};
};

/**
 * @summary 키워드 기준 미디어 자산 필터링
 */
export const filterMediaLibraryAssets = (assets: MediaLibraryAsset[], keyword: string): MediaLibraryAsset[] => {
	const normalizedKeyword = keyword.trim().toLowerCase();
	if (normalizedKeyword.length < 1) {
		return assets;
	}

	return assets.filter((asset) => {
		return [asset.name, asset.path, asset.ext, asset.mimeType].some((field) => field.toLowerCase().includes(normalizedKeyword));
	});
};

/**
 * @summary 현재 페이지 기준 자산 목록 슬라이스
 */
export const getPagedMediaLibraryAssets = (input: MediaLibraryPageSliceInput): MediaLibraryAsset[] => {
	const startIndex = (input.currentPage - 1) * input.pageSize;
	return input.assets.slice(startIndex, startIndex + input.pageSize);
};

/**
 * @summary 전체 자산 수 기준 페이지 수 계산
 */
export const getMediaLibraryPageCount = (input: MediaLibraryPageCountInput): number => {
	const totalAssetCount = typeof input.totalAssetCount === "number" ? input.totalAssetCount : input.fallbackAssetCount;
	return Math.max(1, Math.ceil(totalAssetCount / input.pageSize));
};

/**
 * @summary 목록 내 모든 자산 선택 여부 판별
 */
export const isAllMediaLibraryAssetsSelected = (input: MediaLibrarySelectionStateInput): boolean => {
	return input.assets.length > 0 && input.assets.every((asset) => input.selectedAssetIds.includes(asset.id));
};

/**
 * @summary 선택된 id 기준 자산 목록 추출
 */
export const getSelectedMediaLibraryAssets = (input: MediaLibrarySelectionStateInput): MediaLibraryAsset[] => {
	return input.assets.filter((asset) => input.selectedAssetIds.includes(asset.id));
};

/**
 * @summary 참조 중 삭제 차단 자산 탐색
 */
export const getDeleteBlockedMediaLibraryAsset = (assets: MediaLibraryAsset[]): MediaLibraryAsset | undefined => {
	return assets.find((asset) => asset.referenceCount > 0);
};

/**
 * @summary 엔트리 MEDIA 필드용 라이브러리 힌트 문구 계산
 */
export const getMediaLibraryHintText = (input: MediaLibraryHintTextInput): string => {
	if (input.isError) {
		return "미디어 라이브러리를 불러오지 못했습니다. 직접 업로드를 사용하세요.";
	}

	if (input.assetCount > 0) {
		return "기존 자산을 선택하거나 직접 업로드할 수 있습니다.";
	}

	return "등록된 라이브러리 자산이 없습니다. 직접 업로드를 사용하세요.";
};

/**
 * @summary Media Library upsert 요청 바디 생성
 */
export const buildMediaLibraryUpsertRequest = (files: UpsertMediaFileRequest[]): MediaLibraryUpsertFilesRequest => {
	return {files};
};

/**
 * @summary Media Library query invalidation key 조회
 */
export const getMediaLibraryQueryInvalidationKey = () => {
	return util.query.getBaseQueryKey(mediaLibrarySearchMediaLibraryQueryKey);
};
