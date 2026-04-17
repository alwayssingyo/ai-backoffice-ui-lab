import type {Key} from "react";
import type {RuleObject} from "@rc-component/form/es/interface";
import {tenantSearchTenantsQueryKey} from "@/services/hooks/tenant/use-tenant-search-tenants.ts";
import type {TenantResponse} from "@/services/types/tenant-response.ts";
import type {TenantSaveRequest} from "@/services/types/tenant-save-request.ts";
import {util} from "@/entry/util.ts";

export const TENANT_DEFAULT_PAGE = 1;
export const TENANT_DEFAULT_PAGE_SIZE = 10;

/**
 * @summary Tenant 목록 검색 상태
 * @property page 현재 페이지
 * @property size 페이지 크기
 */
export interface TenantListSearch {
	page: number;
	size: number;
}

/**
 * @summary Tenant 테이블 행 모델
 * @property id 테넌트 식별자
 * @property name 테넌트 이름
 * @property creatorId 생성자 식별자
 * @property createdAt 생성 일시
 */
export interface TenantTableRow {
	id: number;
	name: string;
	creatorId: number;
	createdAt: string;
}

/**
 * @summary Tenant 등록/수정 모달 값
 * @property id 수정 대상 식별자
 * @property name 테넌트 이름
 */
export interface TenantFormValues {
	id?: number;
	name: string;
}

/**
 * @summary Tenant route search 값을 기본값과 함께 정규화합니다.
 */
export const normalizeTenantListSearch = (search: Partial<TenantListSearch> | undefined): TenantListSearch => {
	const page = typeof search?.page === "number" && search.page > 0 ? search.page : TENANT_DEFAULT_PAGE;
	const size = typeof search?.size === "number" && search.size > 0 ? search.size : TENANT_DEFAULT_PAGE_SIZE;

	return {page, size};
};

/**
 * @summary 입력값을 저장 가능한 Tenant name으로 정규화합니다.
 */
export const normalizeTenantName = (value: string): string => {
	return value.trim();
};

/**
 * @summary Tenant 응답을 테이블 행 모델로 정규화합니다.
 */
export const toTenantTableRows = (tenants: TenantResponse[] | undefined): TenantTableRow[] => {
	if (!Array.isArray(tenants)) {
		return [];
	}

	return tenants.map((tenant) => ({id: tenant.id, name: tenant.name, creatorId: tenant.creatorId, createdAt: tenant.createdAt}));
};

/**
 * @summary Table selection 값을 삭제 가능한 Tenant id 집합으로 정규화합니다.
 */
export const toSelectedTenantIds = (selectedRowKeys: Key[]): number[] => {
	return selectedRowKeys.map((selectedRowKey) => Number(selectedRowKey)).filter((selectedRowKey) => Number.isInteger(selectedRowKey));
};

/**
 * @summary 실패한 Tenant id 집합을 selection state로 다시 정규화합니다.
 */
export const toFailedTenantSelectionKeys = (failedTenantIds: number[]): Key[] => {
	return [...new Set(failedTenantIds)].filter((failedTenantId) => Number.isInteger(failedTenantId));
};

/**
 * @summary 현재 toolbar delete 활성화 여부를 반환합니다.
 */
export const hasSelectedTenantRows = (selectedRowKeys: Key[]): boolean => {
	return toSelectedTenantIds(selectedRowKeys).length > 0;
};

/**
 * @summary 중복 Tenant 이름 여부를 판별합니다.
 */
export const isDuplicateTenantName = (rows: TenantTableRow[], inputName: string, currentTenantId?: number): boolean => {
	const normalizedInputName = normalizeTenantName(inputName).toLowerCase();
	if (normalizedInputName.length < 1) {
		return false;
	}

	return rows.some((row) => {
		if (typeof currentTenantId === "number" && row.id === currentTenantId) {
			return false;
		}

		return normalizeTenantName(row.name).toLowerCase() === normalizedInputName;
	});
};

/**
 * @summary Tenant 저장 payload를 생성합니다.
 */
export const buildTenantUpsertPayload = (values: TenantFormValues): TenantSaveRequest => {
	return {...(typeof values.id === "number" ? {id: values.id} : {}), name: normalizeTenantName(values.name)};
};

/**
 * @summary Tenant 이름 검증 규칙을 생성합니다.
 */
export const buildTenantNameRules = (rows: TenantTableRow[], currentTenantId?: number): RuleObject[] => {
	return [
		{
			validator: async (_rule, value?: string) => {
				if (typeof value !== "string" || normalizeTenantName(value).length < 1) {
					throw new Error("Tenant 이름을 입력해 주세요.");
				}

				if (isDuplicateTenantName(rows, value, currentTenantId)) {
					throw new Error("이미 사용 중인 Tenant 이름입니다.");
				}
			},
		},
	];
};

/**
 * @summary Tenant 목록 조회 invalidation key를 반환합니다.
 */
export const getTenantQueryInvalidationKey = () => {
	return util.query.getBaseQueryKey(tenantSearchTenantsQueryKey);
};
