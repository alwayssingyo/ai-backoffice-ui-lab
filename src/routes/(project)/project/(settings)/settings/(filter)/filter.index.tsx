import {Fragment, useEffect, useState, type MouseEventHandler} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {z} from "zod";
import clsx from "clsx";
import {AlertCircle} from "griddy-icons";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import {useContentFolderGetList} from "@/services/hooks/content-folder/use-content-folder-get-list.ts";
import {useContentManagerGetTableInfo} from "@/services/hooks/content-manager/use-content-manager-get-table-info.ts";
import {useFilterRemove} from "@/services/hooks/filter/use-filter-remove.ts";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import {useFilterUpsert} from "@/services/hooks/filter/use-filter-upsert.ts";
import type {ContentFolderNodeResponse} from "@/services/types/content-folder-node-response.ts";
import type {ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import type {UiTreeProps} from "@/components/ui/tree/ui-tree.tsx";
import FilterColumnTable from "./-local/filter-column-table.tsx";
import FilterEntryTree from "./-local/filter-entry-tree.tsx";
import {
	buildFilterTableInfoQueryParams,
	buildFilterUpsertPayload,
	collectFilterFolderKeys,
	getFilterQueryInvalidationKey,
	groupSavedFiltersByField,
	isSameFilterDraftTableState,
	normalizeFilterListSearch,
	resolveSelectedFilterTableState,
	selectFilterTreeDataFromApi,
	setFilterDraftComponent,
	setFilterDraftEnabled,
	setFilterDraftItems,
	setFilterDraftLabel,
	setFilterDraftOperator,
	toFilterDraftTableStateFromFilters,
	toFilterColumnRows,
	type FilterComponentOption,
	type FilterDraftState,
	type FilterSavedTableState,
	type FilterDraftTableState,
	type FilterListSearch,
	type FilterOperatorOption,
	type FilterTreeSelectData,
	FILTER_ROUTE_CONFIG,
} from "./filter.ts";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(filter)/filter/")({
	component: RouteComponent,
	validateSearch: z.object({table: z.string().optional()}),
});

function RouteComponent() {
	const {useSearch} = Route;
	const search = normalizeFilterListSearch(useSearch() as FilterListSearch);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [isTreeExpandedInitialized, setIsTreeExpandedInitialized] = useState(false);
	const [draftState, setDraftState] = useState<FilterDraftState>({});
	const [savingColumnName, setSavingColumnName] = useState<string>();

	const responseContentFolderGetList = useContentFolderGetList<FilterTreeSelectData>({
		query: {
			retry: false,
			select: ({data}) => {
				return selectFilterTreeDataFromApi(data.list as ContentFolderNodeResponse[]);
			},
		},
	});

	const sidebarNodes = responseContentFolderGetList.data?.sidebarNodes ?? [];
	const tableNodes = responseContentFolderGetList.data?.tableNodes ?? [];
	const folderKeys = collectFilterFolderKeys(sidebarNodes);
	const {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery} = resolveSelectedFilterTableState(
		tableNodes,
		search.table,
	);

	const responseContentManagerGetTableInfo = useContentManagerGetTableInfo<{columns: ContentTypeColumnResponse[]; hasNoColumns: boolean}>(
		buildFilterTableInfoQueryParams(tableNameForQuery),
		{
			query: {
				enabled: hasSelectedTable,
				retry: false,
				select: ({data}) => {
					const columns = data.list as ContentTypeColumnResponse[];
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
					const filters = data.list as FilterResponse[];
					return {
						savedFiltersByField: groupSavedFiltersByField(filters),
						savedDraftTableState: toFilterDraftTableStateFromFilters({tableName: tableNameForQuery, filters}),
					};
				},
			},
		},
	);
	const mutationFilterUpsert = useFilterUpsert({
		mutation: {
			onSuccess: async () => {
				await queryClient.invalidateQueries({queryKey: getFilterQueryInvalidationKey()});
			},
		},
	});
	const mutationFilterRemove = useFilterRemove({
		mutation: {
			onSuccess: async () => {
				await queryClient.invalidateQueries({queryKey: getFilterQueryInvalidationKey()});
			},
		},
	});

	const rows = toFilterColumnRows(
		responseContentManagerGetTableInfo.data?.columns,
		draftState[tableNameForQuery],
		responseFilterSearchFilters.data?.savedFiltersByField,
	);

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

	useEffect(() => {
		if (responseContentFolderGetList.isPending || responseContentFolderGetList.isError) {
			return;
		}

		if (isTreeExpandedInitialized) {
			return;
		}

		setExpandedKeys(folderKeys);
		setIsTreeExpandedInitialized(true);
	}, [
		folderKeys,
		isTreeExpandedInitialized,
		responseContentFolderGetList.isError,
		responseContentFolderGetList.isPending,
		responseContentFolderGetList.dataUpdatedAt,
	]);

	useEffect(() => {
		if (!responseContentFolderGetList.data?.hasInvalidNode) {
			return;
		}

		modal.warning({title: "일부 엔트리 노드를 제외했습니다.", content: "Filter 화면에 필요한 값이 없는 노드는 표시하지 않습니다."});
	}, [responseContentFolderGetList.data?.hasInvalidNode, responseContentFolderGetList.dataUpdatedAt]);

	useEffect(() => {
		if (responseContentFolderGetList.isPending || responseContentFolderGetList.isError) {
			return;
		}

		if (tableNodes.length < 1) {
			if (typeof search.table === "string") {
				void navigate({to: FILTER_ROUTE_CONFIG.path, search: {}, replace: true});
			}
			return;
		}

		if (typeof selectedTableName !== "string") {
			return;
		}

		if (search.table === selectedTableName) {
			return;
		}

		void navigate({to: FILTER_ROUTE_CONFIG.path, search: {table: selectedTableName}, replace: true});
	}, [
		navigate,
		responseContentFolderGetList.isError,
		responseContentFolderGetList.isPending,
		search.table,
		selectedTableName,
		tableNodes.length,
	]);

	const handleTreeExpand: UiTreeProps["onExpand"] = (keys) => {
		setExpandedKeys(keys.map((key) => String(key)));
	};

	const handleTreeRetryButtonClick: MouseEventHandler<HTMLButtonElement> = () => {
		void responseContentFolderGetList.refetch();
	};

	const handleTableRetryButtonClick: MouseEventHandler<HTMLButtonElement> = () => {
		void responseContentManagerGetTableInfo.refetch();
	};

	const handleTableSelect = (table: string) => {
		void navigate({to: FILTER_ROUTE_CONFIG.path, search: {table}});
	};

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

	const handleChangeLabel = (columnName: string, label: string) => {
		if (!hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftLabel(currentDraftState, {tableName: tableNameForQuery, columnName, label});
		});
	};

	const handleChangeItems = (columnName: string, items: string) => {
		if (!hasSelectedTable) {
			return;
		}

		setDraftState((currentDraftState) => {
			return setFilterDraftItems(currentDraftState, {tableName: tableNameForQuery, columnName, items});
		});
	};

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
			<WidgetContentHeader title={"Filter"} desc={"Review entry-level filter drafts by table and column metadata."} />
			<WidgetContentBody>
				{responseContentFolderGetList.data?.hasInvalidNode ? (
					<div className={clsx("rt_psfii__feedback")}>
						<AlertCircle {...iconPreset.outlined()} />
						<span>일부 엔트리 노드는 Filter 화면에서 제외되었습니다.</span>
					</div>
				) : null}

				<div className={clsx("rt_psfii__layout")}>
					<section className={clsx("rt_psfii__sidebarPanel")}>
						<FilterEntryTree
							sidebarNodes={sidebarNodes}
							folderCount={folderKeys.length}
							tableCount={tableNodes.length}
							expandedKeys={expandedKeys}
							selectedTableName={selectedTableName}
							isPending={responseContentFolderGetList.isPending}
							isError={responseContentFolderGetList.isError}
							onExpand={handleTreeExpand}
							onRetry={handleTreeRetryButtonClick}
							onSelectTable={handleTableSelect}
						/>
					</section>

					<section className={clsx("rt_psfii__detailPanel")}>
						<FilterColumnTable
							tableDisplayName={selectedTableNode?.name}
							tableName={selectedTableName}
							rows={rows}
							hasSelectedTable={hasSelectedTable}
							hasSelectableTables={tableNodes.length > 0}
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
