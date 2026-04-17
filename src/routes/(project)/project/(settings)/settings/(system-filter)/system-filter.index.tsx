import {Fragment, useEffect, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {z} from "zod";
import clsx from "clsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {useContentManagerGetTableInfo} from "@/services/hooks/content-manager/use-content-manager-get-table-info.ts";
import {useFilterRemove} from "@/services/hooks/filter/use-filter-remove.ts";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import {useFilterUpsert} from "@/services/hooks/filter/use-filter-upsert.ts";
import type {ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import FilterColumnTable from "../(filter)/-local/filter-column-table.tsx";
import FilterEntryTree from "../(filter)/-local/filter-entry-tree.tsx";
import {
	buildFilterTableInfoQueryParams,
	buildFilterUpsertPayload,
	groupSavedFiltersByField,
	isSameFilterDraftTableState,
	resolveSelectedFilterTableState,
	setFilterDraftComponent,
	setFilterDraftEnabled,
	setFilterDraftItems,
	setFilterDraftLabel,
	setFilterDraftOperator,
	toFilterDraftTableStateFromFilters,
	toFilterColumnRows,
	type FilterComponentOption,
	type FilterDraftState,
	type FilterDraftTableState,
	type FilterListSearch,
	type FilterOperatorOption,
	type FilterSavedTableState,
} from "../(filter)/filter.ts";
import {
	SYSTEM_FILTER_FOLDER_KEYS,
	SYSTEM_FILTER_ROUTE_CONFIG,
	SYSTEM_FILTER_SIDEBAR_NODES,
	SYSTEM_FILTER_TABLE_NODES,
	mergeSystemFilterColumns,
} from "./system-filter.ts";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(system-filter)/system-filter/")({
	component: RouteComponent,
	validateSearch: z.object({table: z.string().optional()}),
});

function RouteComponent() {
	const {useSearch} = Route;
	const search = useSearch() as FilterListSearch;
	const navigate = useNavigate();
	const [expandedKeys, setExpandedKeys] = useState<string[]>(SYSTEM_FILTER_FOLDER_KEYS);
	const [draftState, setDraftState] = useState<FilterDraftState>({});
	const [savingColumnName, setSavingColumnName] = useState<string>();
	const {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery} = resolveSelectedFilterTableState(
		SYSTEM_FILTER_TABLE_NODES,
		search.table,
	);

	const responseContentManagerGetTableInfo = useContentManagerGetTableInfo<{columns: ContentTypeColumnResponse[]; hasNoColumns: boolean}>(
		buildFilterTableInfoQueryParams(tableNameForQuery),
		{
			query: {
				enabled: hasSelectedTable,
				retry: false,
				select: ({data}) => {
					const columns = mergeSystemFilterColumns(data.list as ContentTypeColumnResponse[]);
					return {columns, hasNoColumns: columns.length < 1};
				},
			},
		},
	);
	const responseFilterSearchFilters = useFilterSearchFilters<{
		savedFiltersByField: FilterSavedTableState;
		savedDraftTableState: FilterDraftTableState;
	}>(
		{table: tableNameForQuery, page: 1, size: 999},
		{
			query: {
				enabled: hasSelectedTable,
				retry: false,
				select: ({data}) => {
					console.log("data >>> ", data);

					const filters = data.list as FilterResponse[];
					return {
						savedFiltersByField: groupSavedFiltersByField(filters),
						savedDraftTableState: toFilterDraftTableStateFromFilters({tableName: tableNameForQuery, filters}),
					};
				},
			},
		},
	);
	const mutationFilterUpsert = useFilterUpsert({mutation: {}});
	const mutationFilterRemove = useFilterRemove({mutation: {}});
	const rows = toFilterColumnRows(
		responseContentManagerGetTableInfo.data?.columns,
		draftState[tableNameForQuery],
		responseFilterSearchFilters.data?.savedFiltersByField,
	);

	/**
	 * @summary 선택한 시스템 테이블의 저장된 필터를 draft 상태로 동기화합니다.
	 */
	useEffect(() => {
		if (responseFilterSearchFilters.isPending || responseFilterSearchFilters.isError || !hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			const nextDraftTableState = responseFilterSearchFilters.data?.savedDraftTableState ?? {};
			if (isSameFilterDraftTableState(currentDraftState[tableNameForQuery], nextDraftTableState)) {
				return currentDraftState;
			}

			return {...currentDraftState, [tableNameForQuery]: nextDraftTableState};
		});
	}, [
		hasSelectedTable,
		responseFilterSearchFilters.data?.savedDraftTableState,
		responseFilterSearchFilters.isError,
		responseFilterSearchFilters.isPending,
		responseFilterSearchFilters.dataUpdatedAt,
		tableNameForQuery,
	]);

	/**
	 * @summary 검색 파라미터에 table이 없으면 첫 시스템 테이블을 기본 선택값으로 맞춥니다.
	 */
	useEffect(() => {
		if (SYSTEM_FILTER_TABLE_NODES.length < 1) {
			return;
		}

		if (typeof selectedTableName !== "string") {
			return;
		}

		if (search.table === selectedTableName) {
			return;
		}

		void navigate({to: SYSTEM_FILTER_ROUTE_CONFIG.path, search: {table: selectedTableName}, replace: true});
	}, [navigate, search.table, selectedTableName]);

	/**
	 * @summary 현재 선택된 시스템 테이블의 컬럼 메타를 다시 조회합니다.
	 */
	const handleTableRetryButtonClick = () => {
		void responseContentManagerGetTableInfo.refetch();
	};

	/**
	 * @summary 좌측 트리에서 시스템 테이블을 선택하면 검색 파라미터를 갱신합니다.
	 */
	const handleTableSelect = (table: string) => {
		void navigate({to: SYSTEM_FILTER_ROUTE_CONFIG.path, search: {table}});
	};

	/**
	 * @summary 컬럼별 필터 사용 여부를 draft 상태에 반영합니다.
	 */
	const handleToggleEnabled = (columnName: string, checked: boolean) => {
		const foundRow = rows.find((row) => row.name === columnName);
		if (!foundRow || !hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftEnabled(currentDraftState, {
				tableName: tableNameForQuery,
				columnName,
				enabled: checked,
				supported: foundRow.supported,
			});
		});
	};

	/**
	 * @summary 다중 선택된 operator 목록을 현재 컬럼 draft 상태에 반영합니다.
	 */
	const handleSelectOperator = (columnName: string, operators: FilterOperatorOption[]) => {
		const foundRow = rows.find((row) => row.name === columnName);
		if (!foundRow || !hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftOperator(currentDraftState, {
				tableName: tableNameForQuery,
				columnName,
				fieldType: foundRow.fieldType,
				operators,
				allowedOperators: foundRow.supportedOperators,
			});
		});
	};

	/**
	 * @summary 컬럼별 표시 label 입력값을 draft 상태에 반영합니다.
	 */
	const handleChangeLabel = (columnName: string, label: string) => {
		if (!hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftLabel(currentDraftState, {tableName: tableNameForQuery, columnName, label});
		});
	};

	/**
	 * @summary 컬럼별 items 입력값을 draft 상태에 반영합니다.
	 */
	const handleChangeItems = (columnName: string, items: string) => {
		if (!hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftItems(currentDraftState, {tableName: tableNameForQuery, columnName, items});
		});
	};

	/**
	 * @summary 컬럼별 입력 컴포넌트 선택값을 draft 상태에 반영합니다.
	 */
	const handleSelectComponent = (columnName: string, component: FilterComponentOption) => {
		const foundRow = rows.find((row) => row.name === columnName);
		if (!foundRow || !hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftComponent(currentDraftState, {
				tableName: tableNameForQuery,
				columnName,
				component,
				allowedComponents: foundRow.supportedComponents,
			});
		});
	};

	/**
	 * @summary 현재 draft와 저장 상태를 비교해 삭제/등록/수정 API를 순차 실행합니다.
	 */
	const handleSaveRow = (columnName: string) => {
		const foundRow = rows.find((row) => row.name === columnName);
		if (!foundRow || !hasSelectedTable || !foundRow.canSave) {
			return;
		}

		setSavingColumnName(columnName);
		const savedFilters = responseFilterSearchFilters.data?.savedFiltersByField[columnName] ?? [];
		const savedFiltersByOperator = new Map(savedFilters.map((filter) => [filter.operator, filter]));
		const nextOperators = foundRow.operators;
		const removedFilters = savedFilters.filter((filter) => !nextOperators.includes(filter.operator as FilterOperatorOption));

		void (async () => {
			try {
				for (const filter of removedFilters) {
					await mutationFilterRemove.mutateAsync({id: filter.id});
				}

				if (!foundRow.enabled) {
					return;
				}

				for (const operator of nextOperators) {
					await mutationFilterUpsert.mutateAsync({
						data: buildFilterUpsertPayload({
							tableName: tableNameForQuery,
							row: {...foundRow, operators: [operator]},
							savedFilterId: savedFiltersByOperator.get(operator)?.id,
						}),
					});
				}
			} finally {
				void responseFilterSearchFilters.refetch();
				setSavingColumnName((currentSavingColumnName) => {
					if (currentSavingColumnName !== columnName) {
						return currentSavingColumnName;
					}

					return undefined;
				});
			}
		})();
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"System Filter"} desc={"Manage system entity filter drafts for built-in tables."} />
			<WidgetContentBody>
				<div className={clsx("rt_psfii__layout")}>
					<section className={clsx("rt_psfii__sidebarPanel")}>
						<FilterEntryTree
							sidebarNodes={SYSTEM_FILTER_SIDEBAR_NODES}
							folderCount={SYSTEM_FILTER_FOLDER_KEYS.length}
							tableCount={SYSTEM_FILTER_TABLE_NODES.length}
							expandedKeys={expandedKeys}
							selectedTableName={selectedTableName}
							isPending={false}
							isError={false}
							onExpand={(keys) => {
								setExpandedKeys(keys.map((key) => String(key)));
							}}
							onRetry={() => {}}
							onSelectTable={handleTableSelect}
						/>
					</section>

					<section className={clsx("rt_psfii__detailPanel")}>
						<FilterColumnTable
							tableDisplayName={selectedTableNode?.name}
							tableName={selectedTableName}
							rows={rows}
							hasSelectedTable={hasSelectedTable}
							hasSelectableTables={SYSTEM_FILTER_TABLE_NODES.length > 0}
							isPending={responseContentManagerGetTableInfo.isPending}
							isError={responseContentManagerGetTableInfo.isError}
							hasNoColumns={responseContentManagerGetTableInfo.data?.hasNoColumns ?? false}
							onRetry={handleTableRetryButtonClick}
							onToggleEnabled={handleToggleEnabled}
							onChangeLabel={handleChangeLabel}
							onChangeItems={handleChangeItems}
							onSelectOperator={handleSelectOperator}
							onSelectComponent={handleSelectComponent}
							onSaveRow={handleSaveRow}
							savingColumnName={savingColumnName}
						/>
					</section>
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
