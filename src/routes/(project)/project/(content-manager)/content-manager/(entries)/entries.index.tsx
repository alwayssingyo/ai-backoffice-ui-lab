import {Activity, Fragment, type Key, type MouseEventHandler, useEffect, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import UiTree, {type UiTreeProps} from "@/components/ui/tree/ui-tree.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiPopover from "@/components/ui/popover/ui-popover.tsx";
import {
	Settings,
	Edit,
	Trash,
	Plus,
	MenuAlt02,
	CheckAlt,
	Folder,
	File,
	ChevronUpSmall,
	Attachment,
	UnfoldMore,
	UnfoldLess,
} from "griddy-icons";
import {z} from "zod";
import {toNumber} from "es-toolkit/compat";
import type {ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import {screamingSnakeCase} from "@kubb/core/transformers";
import {useQueryClient} from "@tanstack/react-query";
import {useModal} from "@ebay/nice-modal-react";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import {util} from "@/entry/util.ts";
import {useContentFolderGetListSuspense} from "@/services/hooks/content-folder/use-content-folder-get-list-suspense.ts";
import {useContentManagerGetTableInfo} from "@/services/hooks/content-manager/use-content-manager-get-table-info.ts";
import {
	contentManagerSearchContentsQueryKey,
	useContentManagerSearchContents,
} from "@/services/hooks/content-manager/use-content-manager-search-contents.ts";
import {useContentManagerRemoves} from "@/services/hooks/content-manager/use-content-manager-removes.ts";
import {contentTypeColumnResponseFieldTypeEnum} from "@/services/types/content-type-column-response.ts";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import ModalEntryColumnForm, {type ModalEntryColumnFormValues} from "./-local/modal-entry-column-form.tsx";
import {
	collectEntryFolderKeys,
	extractEntryMediaFiles,
	getEntryTreeTableKey,
	mapEntryNodeToTreeData,
	resolveSelectedEntryTableState,
	selectEntryTreeDataFromApi,
	type EntrySidebarNode,
	type EntryTreeSelectData,
} from "./entries.ts";
import {useEntryColumnVisibilityStore} from "@/stores/use-entry-column-visibility-store.ts";
import ModalEntryMediaList from "./-local/modal-entry-media-list.tsx";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";

type EntryRecord = Record<string, unknown>;

type ContentListSelectData = {contents: EntryRecord[]; totalCount: number};

type TableInfoSelectData = {columns: ContentTypeColumnResponse[]; hasNoColumns: boolean};

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/(entries)/entries/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(1).catch(1),
		size: z.coerce.number().int().min(1).max(100).default(10).catch(10),
		table: z.string().optional(),
	}),
});

/**
 * @summary 엔트리 트리 선택 및 컨텐츠 목록 편집 화면
 */
function RouteComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const queryClient = useQueryClient();
	const modalEntryColumnForm = useModal(ModalEntryColumnForm);
	const modalEntryMediaList = useModal(ModalEntryMediaList);
	const entryColumnVisibilityStore = useEntryColumnVisibilityStore();
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [selectedRows, setSelectedRows] = useState<EntryRecord[]>([]);
	const [columnSettingPopoverOpen, setColumnSettingPopoverOpen] = useState(false);
	const [treeSearchKeyword, setTreeSearchKeyword] = useState("");

	/**
	 * @description 콘텐츠 폴더 트리 조회 API
	 */
	const responseContentFolderGetListSuspense = useContentFolderGetListSuspense<EntryTreeSelectData>({
		query: {
			select: (data) => {
				return selectEntryTreeDataFromApi(data.data.list);
			},
		},
	});

	const {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery} = resolveSelectedEntryTableState(
		responseContentFolderGetListSuspense.data.tableNodes,
		search.table,
	);
	const folderKeys = collectEntryFolderKeys(responseContentFolderGetListSuspense.data.sidebarNodes);
	const isAllFoldersExpanded = folderKeys.length > 0 && folderKeys.every((folderKey) => expandedKeys.includes(folderKey));

	/**
	 * @description 테이블 컬럼 조회 API
	 */
	const responseContentManagerGetTableInfo = useContentManagerGetTableInfo<TableInfoSelectData>(
		{tableName: tableNameForQuery, includeSystemColumns: false, includePrivate: true},
		{
			query: {
				enabled: hasSelectedTable,
				select: (data) => {
					const columns = data.data.list;
					return {columns, hasNoColumns: columns.length < 1};
				},
			},
		},
	);

	/**
	 * @description 컨텐츠 목록 조회 API
	 */
	const responseContentManagerSearchContents = useContentManagerSearchContents<ContentListSelectData>(
		{tableName: tableNameForQuery, page: search.page, size: search.size, includePrivate: true},
		{
			query: {
				enabled: hasSelectedTable,
				select: (data) => {
					return {contents: data.data.list, totalCount: data.data.totalCount};
				},
			},
		},
	);

	/**
	 * @description 컨텐츠 삭제 API
	 */
	const mutationContentManagerRemoves = useContentManagerRemoves({
		mutation: {
			onSuccess: () => {
				setSelectedRows([]);
				void queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(contentManagerSearchContentsQueryKey)});
			},
		},
	});

	/**
	 * @summary 폴더 노드 확장 상태 초기화 및 검증 제외 노드 안내
	 */
	useEffect(() => {
		const nextFolderKeys = collectEntryFolderKeys(responseContentFolderGetListSuspense.data.sidebarNodes);
		setExpandedKeys((prevExpandedKeys) => {
			if (
				prevExpandedKeys.length === nextFolderKeys.length &&
				prevExpandedKeys.every((prevExpandedKey, index) => prevExpandedKey === nextFolderKeys[index])
			) {
				return prevExpandedKeys;
			}

			return nextFolderKeys;
		});

		if (!responseContentFolderGetListSuspense.data.hasInvalidNode) {
			return;
		}

		modal.warning({title: "일부 폴더 노드를 제외했습니다.", content: "entries 화면에 필요한 값이 없는 노드는 표시하지 않습니다."});
	}, [
		responseContentFolderGetListSuspense.data.hasInvalidNode,
		responseContentFolderGetListSuspense.data.sidebarNodes,
		responseContentFolderGetListSuspense.dataUpdatedAt,
	]);

	/**
	 * @summary 선택 테이블 쿼리스트링 동기화
	 */
	useEffect(() => {
		if (!hasSelectedTable) {
			return;
		}

		if (search.table === selectedTableName) {
			return;
		}

		void navigate({
			to: "/project/content-manager/entries",
			search: {page: search.page, size: search.size, table: selectedTableName},
			replace: true,
		});
	}, [hasSelectedTable, navigate, search.page, search.size, search.table, selectedTableName]);

	/**
	 * @summary 선택 테이블 변경 시 선택 행 초기화
	 */
	useEffect(() => {
		setSelectedRows([]);
		setColumnSettingPopoverOpen(false);
	}, [selectedTableName]);

	/**
	 * @summary 빈 페이지 재조회 방지용 이전 페이지 이동
	 */
	useEffect(() => {
		if (!hasSelectedTable) {
			return;
		}

		const {data: searchContentsData, isFetching} = responseContentManagerSearchContents;
		if (isFetching) {
			return;
		}

		if (!searchContentsData) {
			return;
		}

		if (search.page < 2 || searchContentsData.contents.length > 0) {
			return;
		}

		void navigate({
			to: "/project/content-manager/entries",
			search: {page: search.page - 1, size: search.size, table: selectedTableName},
			replace: true,
		});
	}, [
		hasSelectedTable,
		navigate,
		responseContentManagerSearchContents.data,
		responseContentManagerSearchContents.isFetching,
		search.page,
		search.size,
		selectedTableName,
	]);

	/**
	 * @summary 트리 TABLE 선택 쿼리스트링 반영
	 */
	const handleTableSelect = (tableName: string) => {
		void navigate({to: "/project/content-manager/entries", search: {page: search.page, size: search.size, table: tableName}});
	};

	/**
	 * @summary 트리 확장 key 상태 갱신
	 */
	const handleTreeExpand: UiTreeProps["onExpand"] = (keys, _info) => {
		const nextExpandedKeys = keys.map((key) => String(key));
		setExpandedKeys(nextExpandedKeys);
	};

	/**
	 * @summary 트리 폴더 전체 펼침/접힘 토글
	 */
	const handleTreeExpandToggleButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (isAllFoldersExpanded) {
			setExpandedKeys([]);
			return;
		}

		setExpandedKeys(folderKeys);
	};

	/**
	 * @summary 트리 검색 키워드 변경 처리
	 */
	const handleTreeSearchInputChange = (value: string) => {
		setTreeSearchKeyword(value);
	};

	/**
	 * @summary 트리 검색 키워드 기준 노드를 필터링합니다.
	 */
	const getFilteredSidebarNodes = (nodes: EntrySidebarNode[], keyword: string): EntrySidebarNode[] => {
		const normalizedKeyword = keyword.trim().toLowerCase();
		if (normalizedKeyword.length < 1) {
			return nodes;
		}

		const filteredNodes: EntrySidebarNode[] = [];

		for (let index = 0; index < nodes.length; index += 1) {
			const currentNode = nodes[index] as EntrySidebarNode;
			const isCurrentNodeMatched = currentNode.name.toLowerCase().includes(normalizedKeyword);

			if (currentNode.nodeType === "TABLE") {
				if (isCurrentNodeMatched) {
					filteredNodes.push(currentNode);
				}
				continue;
			}

			const filteredChildNodes = getFilteredSidebarNodes(currentNode.children, normalizedKeyword);
			if (isCurrentNodeMatched) {
				filteredNodes.push(currentNode);
				continue;
			}

			if (filteredChildNodes.length < 1) {
				continue;
			}

			filteredNodes.push({...currentNode, children: filteredChildNodes});
		}

		return filteredNodes;
	};

	/**
	 * @summary 검색 키워드를 반영한 사이드바 트리 노드 목록
	 */
	const filteredSidebarNodes = getFilteredSidebarNodes(responseContentFolderGetListSuspense.data.sidebarNodes, treeSearchKeyword);

	/**
	 * @summary 트리 TABLE 노드 선택 처리
	 */
	const handleTreeSelect: UiTreeProps["onSelect"] = (keys, _info) => {
		const selectedKey = keys[0];
		if (typeof selectedKey === "undefined") {
			return;
		}

		const treeNodeKey = String(selectedKey);
		if (!treeNodeKey.startsWith("table:")) {
			return;
		}

		const tableName = treeNodeKey.replace("table:", "");
		if (tableName.length < 1) {
			return;
		}

		handleTableSelect(tableName);
	};

	/**
	 * @summary 컨텐츠 추가 화면 이동
	 */
	const handleContentAddButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (!hasSelectedTable) {
			return;
		}

		void navigate({to: "/project/content-manager/entries/form/{-$cid}", search: {table: tableNameForQuery}});
	};

	/**
	 * @summary 컨텐츠 수정 화면 이동
	 */
	const handleContentEditButtonClick =
		(record: EntryRecord): MouseEventHandler<HTMLButtonElement> =>
		(_event) => {
			if (!hasSelectedTable) {
				return;
			}

			void navigate({
				to: "/project/content-manager/entries/form/{-$cid}",
				params: {cid: String(record.id)},
				search: {table: tableNameForQuery},
			});
		};

	/**
	 * @summary 선택 컨텐츠 삭제 실행
	 */
	const handleContentRemoveButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (!hasSelectedTable) {
			return;
		}

		modal.error(
			modalPreset.remove({
				onOk: (..._args) => {
					mutationContentManagerRemoves.mutate({params: {tableName: tableNameForQuery, ids: selectedRows.map((row) => toNumber(row.id))}});
				},
			}),
		);
	};

	/**
	 * @summary 저장된 컬럼 설정 기준으로 표시 대상 컬럼을 계산합니다.
	 */
	const getVisibleColumns = (columns: ContentTypeColumnResponse[]): ContentTypeColumnResponse[] => {
		const savedVisibleColumnNames = entryColumnVisibilityStore.visibleColumnNamesByTable[tableNameForQuery];
		if (!Array.isArray(savedVisibleColumnNames)) {
			return columns;
		}

		if (savedVisibleColumnNames.length < 1) {
			return columns;
		}

		const visibleColumns = columns.filter((column) => savedVisibleColumnNames.includes(column.name));
		if (visibleColumns.length < 1) {
			return columns;
		}

		return visibleColumns;
	};

	/**
	 * @summary 컬럼 설정 모달을 열고 저장 결과를 상태에 반영합니다.
	 */
	const handleColumnSettingButtonClick: MouseEventHandler<HTMLButtonElement> = async (_event) => {
		setColumnSettingPopoverOpen(false);

		if (!hasSelectedTable) {
			return;
		}

		if (!responseContentManagerGetTableInfo.data) {
			return;
		}

		const visibleColumns = getVisibleColumns(responseContentManagerGetTableInfo.data.columns);
		const resultModalEntryColumnForm = (await modalEntryColumnForm.show({
			columns: responseContentManagerGetTableInfo.data.columns,
			initialValues: {visibleColumnNames: visibleColumns.map((column) => column.name)},
		})) as ModalEntryColumnFormValues | null;

		if (!resultModalEntryColumnForm) {
			return;
		}

		entryColumnVisibilityStore.setVisibleColumnNames(tableNameForQuery, resultModalEntryColumnForm.visibleColumnNames);
	};

	/**
	 * @summary MEDIA 파일 목록 모달을 엽니다.
	 */
	const handleMediaListButtonClick =
		(mediaFiles: UpsertMediaFileRequest[], columnTitle: string): MouseEventHandler<HTMLButtonElement> =>
		(_event) => {
			void modalEntryMediaList.show({mediaFiles, columnTitle});
		};

	/**
	 * @summary 컬럼명을 규칙에 따라 변경합니다.
	 * @param columnName
	 * @returns
	 */
	const convertColumn = (columnName: string, fieldType: ContentTypeColumnResponse["fieldType"]) => {
		if (!columnName.endsWith("_id") && fieldType === "RELATION") {
			return `${columnName}_id`;
		}
		return columnName;
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Content Manager"} desc="Manage and edit content entries and fields." />
			<WidgetContentBody>
				<div className={clsx("rt_pcmei__layout")}>
					<section className={clsx("rt_pcmei__sidebarPanel")}>
						<div className={clsx("rt_pcmei__sidebarHeader")}>
							<div className={clsx("rt_pcmei__sidebarStats")}>
								<div className={clsx("rt_pcmei__sidebarItem")}>
									<Folder {...iconPreset.primary()} />
									<UiTypoText strong>{folderKeys.length}</UiTypoText>
								</div>
								<div className={clsx("rt_pcmei__sidebarItem")}>
									<File {...iconPreset.primary()} />
									<UiTypoText strong>{responseContentFolderGetListSuspense.data.tableNodes.length}</UiTypoText>
								</div>
							</div>
						</div>
						<div className={clsx("rt_pcmei__treeToolbar")}>
							<div className={clsx("rt_pcmei__treeToolbarSearch")}>
								<UiInput
									variant="filled"
									allowClear
									placeholder="Search tree"
									value={treeSearchKeyword}
									onChange={(event) => {
										handleTreeSearchInputChange(event.target.value);
									}}
								/>
							</div>
							<div className={clsx("rt_pcmei__treeToolbarActions")}>
								<UiButton
									type="text"
									title={isAllFoldersExpanded ? "Collapse all folders" : "Expand all folders"}
									onClick={handleTreeExpandToggleButtonClick}
									icon={
										isAllFoldersExpanded ? (
											<UnfoldLess {...iconPreset.outlined()} size={20} />
										) : (
											<UnfoldMore {...iconPreset.outlined()} size={20} />
										)
									}
								/>
							</div>
						</div>
						<div className={clsx("rt_pcmei__treeBox")}>
							<Activity mode={filteredSidebarNodes.length > 0 ? "visible" : "hidden"}>
								<UiTree
									blockNode
									showIcon
									showLine
									switcherIcon={(nodeProps) => {
										return (
											<ChevronUpSmall
												className={clsx("rt_pcmei__treeSwitcherIcon", nodeProps.expanded && "rt_pcmei__treeSwitcherIcon--expanded")}
											/>
										);
									}}
									treeData={filteredSidebarNodes.map((node) =>
										mapEntryNodeToTreeData(node, {
											renderTitle: (node) => {
												if (node.nodeType === "TABLE") {
													return <span className={clsx("rt_pcmei__treeLabelTitle")}>{node.name}</span>;
												}

												return <span className={clsx("rt_pcmei__treeLabelTitle", "rt_pcmei__treeLabelTitle--folder")}>{node.name}</span>;
											},
											renderIcon: (node) => {
												if (node.nodeType === "TABLE") {
													return <File {...iconPreset.outlined()} />;
												}

												return <Folder {...iconPreset.outlined()} />;
											},
										}),
									)}
									expandedKeys={expandedKeys}
									selectedKeys={hasSelectedTable ? [getEntryTreeTableKey(tableNameForQuery)] : []}
									onExpand={handleTreeExpand}
									onSelect={handleTreeSelect}
								/>
							</Activity>
							<Activity mode={filteredSidebarNodes.length > 0 ? "hidden" : "visible"}>
								<div className={clsx("rt_pcmei__treeEmpty")}>
									<UiEmpty description="No matching results" />
								</div>
							</Activity>
						</div>
					</section>
					<section className={clsx("rt_pcmei__detailPanel")}>
						<Activity mode={selectedTableNode ? "visible" : "hidden"}>
							<Activity mode={responseContentManagerGetTableInfo.data?.hasNoColumns ? "visible" : "hidden"}>
								<div className={clsx("rt_pcmei__detailHeader")}>
									<div>
										<div className={clsx("rt_pcmei__detailHeading")}>
											<UiTypoTitle level={3}>{selectedTableNode?.name}</UiTypoTitle>
										</div>
										<UiTypoText type="secondary">{selectedTableName}</UiTypoText>
									</div>
								</div>
								<div className={clsx("rt_pcmei__emptySection")}>
									<UiEmpty description="No column configure" />
								</div>
							</Activity>
							<Activity mode={responseContentManagerGetTableInfo.data?.hasNoColumns ? "hidden" : "visible"}>
								{responseContentManagerGetTableInfo.data && responseContentManagerSearchContents.data && (
									<Fragment>
										<div className={clsx("rt_pcmei__detailHeader")}>
											<div>
												<div className={clsx("rt_pcmei__detailHeading")}>
													<UiTypoTitle level={3}>{selectedTableNode?.name}</UiTypoTitle>
												</div>
												<UiTypoText type="secondary">{selectedTableName}</UiTypoText>
											</div>
											<div className={clsx("rt_pcmei__detailButtons")}>
												<UiButton type="primary" onClick={handleContentAddButtonClick} icon={<Plus {...iconPreset.primary()} />}>
													Add content
												</UiButton>
											</div>
										</div>

										<div className={clsx("rt_pcmei__detailSection")}>
											<div className={clsx("rt_pcmei__tableHeader")}>
												<div className={clsx("rt_pcmei__tableHeaderInfo")}>
													<span className={clsx("rt_pcmei__tableHeaderCount")}>
														<Activity mode={selectedRows.length > 0 ? "visible" : "hidden"}>
															<CheckAlt {...iconPreset.tertiary()} />
															<span>{selectedRows.length}</span>
														</Activity>
														<Activity mode={selectedRows.length > 0 ? "hidden" : "visible"}>
															<MenuAlt02 {...iconPreset.tertiary()} />
															<span>{responseContentManagerSearchContents.data.totalCount}</span>
														</Activity>
													</span>
												</div>
												<div className={clsx("rt_pcmei__tableHeaderActions")}>
													<UiButton
														danger
														icon={<Trash {...iconPreset.outlined()} />}
														onClick={handleContentRemoveButtonClick}
														disabled={selectedRows.length < 1}
													>
														Delete
													</UiButton>
													<UiPopover
														placement="bottomRight"
														trigger="click"
														arrow={false}
														open={columnSettingPopoverOpen}
														onOpenChange={setColumnSettingPopoverOpen}
														rootClassName="rt_pcmei__tableActionPopover"
														content={
															<div className={clsx("rt_pcmei__tableActionPopoverMenu")}>
																<button
																	type="button"
																	className={clsx("rt_pcmei__tableActionPopoverItem")}
																	onClick={handleColumnSettingButtonClick}
																>
																	Column settings
																</button>
															</div>
														}
													>
														<UiButton icon={<Settings {...iconPreset.tertiary()} />} />
													</UiPopover>
												</div>
											</div>

											<UiTable
												columns={[
													{
														width: 45,
														render: (_value, record, _index) => (
															<span className={clsx("ui_table__colEdit")}>
																<UiButton
																	type="text"
																	icon={<Edit {...iconPreset.tertiary()} />}
																	onClick={handleContentEditButtonClick(record as EntryRecord)}
																/>
															</span>
														),
													},
													...getVisibleColumns(responseContentManagerGetTableInfo.data.columns).map(
														(column: ContentTypeColumnResponse) => ({
															title: screamingSnakeCase(column.name),
															dataIndex: convertColumn(column.name, column.fieldType),
															ellipsis: true,
															className: "ui_table__col",
															render: (value: unknown) => {
																if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.DATE) {
																	return formatDateValue(value, column.dateType);
																}

																if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.MEDIA) {
																	const mediaFiles = extractEntryMediaFiles(value);
																	if (mediaFiles.length < 1) {
																		return "-";
																	}

																	return (
																		<div className={clsx("rt_pcmei__mediaCell")}>
																			<div className={clsx("rt_pcmei__mediaCellButton")}>
																				<UiButton
																					icon={<Attachment {...iconPreset.outlined()} />}
																					onClick={handleMediaListButtonClick(mediaFiles, screamingSnakeCase(column.name))}
																				>
																					View files
																					<span className={clsx("rt_pcmei__mediaCellCount")}>{mediaFiles.length}</span>
																				</UiButton>
																			</div>
																		</div>
																	);
																}

																if (typeof value === "boolean") {
																	if (value) {
																		return "true";
																	}
																	return "false";
																}

																if (value == null || value === "") {
																	return "-";
																}

																if (typeof value === "object") {
																	try {
																		return JSON.stringify(value);
																	} catch {
																		return "[object]";
																	}
																}

																return String(value);
															},
														}),
													),
												]}
												dataSource={responseContentManagerSearchContents.data.contents}
												rowSelection={{
													columnWidth: 45,
													selectedRowKeys: selectedRows.map((row) => row.id as Key),
													onChange: (_selectedRowKeys, nextSelectedRows, _info) => setSelectedRows(nextSelectedRows as EntryRecord[]),
													preserveSelectedRowKeys: true,
												}}
												pagination={{
													current: search.page,
													pageSize: search.size,
													showSizeChanger: true,
													total: responseContentManagerSearchContents.data.totalCount,
													onChange: (page, pageSize) => {
														if (!hasSelectedTable) {
															return;
														}

														void navigate({
															to: "/project/content-manager/entries",
															search: {page, size: pageSize, table: selectedTableName},
														});
													},
												}}
												rowKey={(record) => (record as EntryRecord).id as Key}
												scroll={{x: "max-content"}}
											/>
										</div>
									</Fragment>
								)}
							</Activity>
						</Activity>
						<Activity mode={selectedTableNode ? "hidden" : "visible"}>
							<div className={clsx("rt_pcmei__emptySection")}>
								<UiEmpty description="No table. Configure folders first." />
							</div>
						</Activity>
					</section>
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
