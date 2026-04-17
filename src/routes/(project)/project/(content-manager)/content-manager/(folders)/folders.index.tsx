import {
	Activity,
	Fragment,
	startTransition,
	type ChangeEventHandler,
	type FocusEventHandler,
	type MouseEventHandler,
	useEffect,
	useRef,
	useState,
} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {z} from "zod";
import clsx from "clsx";
import {debounce} from "es-toolkit";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiSwitch from "@/components/ui/switch/ui-switch.tsx";
import UiTag from "@/components/ui/tag/ui-tag.tsx";
import UiTree, {type UiTreeProps} from "@/components/ui/tree/ui-tree.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {useQueryClient} from "@tanstack/react-query";
import {util} from "@/entry/util.ts";
import {
	contentFolderGetListSuspenseQueryKey,
	useContentFolderGetListSuspense,
} from "@/services/hooks/content-folder/use-content-folder-get-list-suspense.ts";
import {useContentFolderSave} from "@/services/hooks/content-folder/use-content-folder-save.ts";
import {File, Folder, Plus, Trash, ChevronUpSmall, LinkExternal, UnfoldLess, UnfoldMore} from "griddy-icons";
import {
	appendRootFolderNode,
	collectFolderKeys,
	countDisplayedTableNodes,
	countTableNodes,
	findNodeContext,
	getChildNodes,
	hasDescendantNode,
	mapFolderNodeToTreeData,
	normalizeFolderTreeNodes,
	removeFolderAndPromoteTables,
	reindexNodes,
	resolveSelectedKeysFromSearch,
	resolveSelectedNodeState,
	serializeFolderSaveNodes,
	updateNodeDisplayed,
	type ContentFolderTreeNode,
	updateNodeName,
} from "./folders.ts";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/(folders)/folders/")({
	component: RouteComponent,
	validateSearch: z.object({
		folder: z.coerce.number().int().min(1).optional().catch(undefined),
		table: z.string().trim().min(1).optional().catch(undefined),
	}),
});

type FolderListSelectData = {nodes: ContentFolderTreeNode[]};

/**
 * @summary 폴더 화면 루트 컴포넌트
 */
function RouteComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const queryClient = useQueryClient();
	const [folderNodes, setFolderNodes] = useState<ContentFolderTreeNode[]>([]);
	const [draftFolderNodes, setDraftFolderNodes] = useState<ContentFolderTreeNode[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
	const [nameInputValue, setNameInputValue] = useState("");
	const [treeSearchKeyword, setTreeSearchKeyword] = useState("");
	const treeBoxRef = useRef<HTMLDivElement | null>(null);
	const debouncedUpdateNodeNameRef = useRef<{(targetNodeId: number, nextName: string): void; cancel: () => void; flush: () => void} | null>(
		null,
	);
	const folderKeys = collectFolderKeys(draftFolderNodes);
	const isAllFoldersExpanded = folderKeys.length > 0 && folderKeys.every((folderKey) => expandedKeys.includes(folderKey));

	if (!debouncedUpdateNodeNameRef.current) {
		debouncedUpdateNodeNameRef.current = debounce((targetNodeId: number, nextName: string) => {
			startTransition(() => {
				setDraftFolderNodes((prevNodes) => {
					return updateNodeName(prevNodes, targetNodeId, nextName);
				});
			});
		}, 160);
	}

	/**
	 * @description 콘텐츠 폴더 트리 조회 API
	 */
	const responseContentFolderGetListSuspense = useContentFolderGetListSuspense<FolderListSelectData>({
		query: {
			select: (data) => {
				return {nodes: normalizeFolderTreeNodes(data.data.list)};
			},
		},
	});

	/**
	 * @description 콘텐츠 폴더 트리 저장 API
	 */
	const mutationContentFolderSave = useContentFolderSave({
		mutation: {
			onSuccess: () => {
				const savedNodes = structuredClone(draftFolderNodes);
				setFolderNodes(savedNodes);
				void queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(contentFolderGetListSuspenseQueryKey)});
			},
		},
	});

	/**
	 * @summary 서버 응답 반영용 기준/편집 트리 및 확장 상태 동기화
	 */
	useEffect(() => {
		const nextFolderNodes = structuredClone(responseContentFolderGetListSuspense.data.nodes);
		setFolderNodes(nextFolderNodes);
		setDraftFolderNodes(structuredClone(nextFolderNodes));
		setExpandedKeys(collectFolderKeys(nextFolderNodes));
	}, [responseContentFolderGetListSuspense.dataUpdatedAt]);

	/**
	 * @summary URL search 파라미터 기반 트리 선택 상태 복원
	 */
	useEffect(() => {
		setSelectedKeys(resolveSelectedKeysFromSearch(draftFolderNodes, search.folder, search.table));
	}, [draftFolderNodes, search.folder, search.table]);

	const {selectedNodeContext, selectedNode} = resolveSelectedNodeState(draftFolderNodes, selectedKeys);

	/**
	 * @summary 선택 노드 전환 시 상세 이름 입력값 동기화
	 */
	useEffect(() => {
		setNameInputValue(selectedNode?.name ?? "");
	}, [selectedNode?.id, selectedNode?.name]);

	/**
	 * @summary 언마운트 시 지연된 이름 반영 작업 정리
	 */
	useEffect(() => {
		return () => {
			debouncedUpdateNodeNameRef.current?.cancel();
		};
	}, []);

	/**
	 * @summary 루트 최하단 FOLDER 추가 + 선택/URL 동기화
	 */
	const handleAddFolder: MouseEventHandler<HTMLButtonElement> = (_event) => {
		const appendedFolderNodeResult = appendRootFolderNode(draftFolderNodes);
		setDraftFolderNodes(appendedFolderNodeResult.nodes);
		setExpandedKeys((prevKeys) => {
			return [...prevKeys, String(appendedFolderNodeResult.createdFolderId)];
		});
		setSelectedKeys([String(appendedFolderNodeResult.createdFolderId)]);
		void navigate({to: "/project/content-manager/folders", search: {folder: appendedFolderNodeResult.createdFolderId, table: undefined}});

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				const treeBoxElement = treeBoxRef.current;
				if (!treeBoxElement) {
					return;
				}

				treeBoxElement.scrollTo({top: treeBoxElement.scrollHeight, behavior: "smooth"});
			});
		});
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
	const getFilteredFolderNodes = (nodes: ContentFolderTreeNode[], keyword: string): ContentFolderTreeNode[] => {
		const normalizedKeyword = keyword.trim().toLowerCase();
		if (normalizedKeyword.length < 1) {
			return nodes;
		}

		const filteredNodes: ContentFolderTreeNode[] = [];

		for (let index = 0; index < nodes.length; index += 1) {
			const currentNode = nodes[index] as ContentFolderTreeNode;
			const isCurrentNodeMatched = currentNode.name.toLowerCase().includes(normalizedKeyword);

			if (currentNode.nodeType === "TABLE") {
				if (isCurrentNodeMatched) {
					filteredNodes.push(currentNode);
				}
				continue;
			}

			const filteredChildNodes = getFilteredFolderNodes(getChildNodes(currentNode), normalizedKeyword);
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
	 * @summary 검색 키워드를 반영한 폴더 트리 노드 목록
	 */
	const filteredFolderNodes = getFilteredFolderNodes(draftFolderNodes, treeSearchKeyword);

	/**
	 * @summary 트리 선택 key 변경 + URL search 동기화
	 */
	const handleTreeSelect: UiTreeProps["onSelect"] = (keys, _info) => {
		const nextSelectedKeys = keys.map((key) => String(key));
		setSelectedKeys(nextSelectedKeys);

		const selectedKey = nextSelectedKeys[0];
		if (typeof selectedKey === "undefined") {
			void navigate({to: "/project/content-manager/folders", search: {folder: undefined, table: undefined}});
			return;
		}

		const selectedNodeId = Number(selectedKey);
		if (Number.isNaN(selectedNodeId)) {
			return;
		}

		const selectedNodeContext = findNodeContext(draftFolderNodes, selectedNodeId, undefined);
		if (!selectedNodeContext) {
			void navigate({to: "/project/content-manager/folders", search: {folder: undefined, table: undefined}});
			return;
		}

		if (selectedNodeContext.node.nodeType === "FOLDER") {
			void navigate({to: "/project/content-manager/folders", search: {folder: selectedNodeContext.node.id, table: undefined}});
			return;
		}

		if (typeof selectedNodeContext.node.tableName !== "string") {
			return;
		}

		// TABLE 선택 시 URL folder 값은 부모 FOLDER id 기준으로 동기화
		const selectedFolderId = selectedNodeContext.parentNode?.nodeType === "FOLDER" ? selectedNodeContext.parentNode.id : undefined;

		void navigate({to: "/project/content-manager/folders", search: {folder: selectedFolderId, table: selectedNodeContext.node.tableName}});
	};

	/**
	 * @summary 선택 FOLDER 삭제 + URL 선택 해제
	 */
	const handleSelectedNodeRemove: MouseEventHandler<HTMLButtonElement> = (_event) => {
		const selectedNode = selectedNodeContext?.node;
		if (!selectedNode || selectedNode.nodeType === "TABLE") {
			return;
		}

		setDraftFolderNodes((prevNodes) => {
			return removeFolderAndPromoteTables(prevNodes, selectedNode.id);
		});
		setSelectedKeys([]);
		void navigate({to: "/project/content-manager/folders", search: {folder: undefined, table: undefined}});
	};

	/**
	 * @summary 선택 노드 이름 입력값 임시 트리 반영
	 */
	const handleTitleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		const selectedNode = selectedNodeContext?.node;
		if (!selectedNode) {
			return;
		}

		const nextTitle = event.target.value;
		setNameInputValue(nextTitle);
		debouncedUpdateNodeNameRef.current?.(selectedNode.id, nextTitle);
	};

	/**
	 * @summary 이름 입력 포커스 이탈 시 대기 중인 이름 변경 즉시 반영
	 */
	const handleTitleInputBlur: FocusEventHandler<HTMLInputElement> = (_event) => {
		debouncedUpdateNodeNameRef.current?.flush();
	};

	/**
	 * @summary 선택 노드 `displayed` 상태 반영
	 */
	const handleDisplayedChange = (checked: boolean) => {
		const selectedNode = selectedNodeContext?.node;
		if (!selectedNode) {
			return;
		}

		setDraftFolderNodes((prevNodes) => {
			return updateNodeDisplayed(prevNodes, selectedNode.id, checked);
		});
	};

	/**
	 * @summary 선택 TABLE 엔트리 화면 이동
	 */
	const handleOpenEntriesButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (!selectedNode || selectedNode.nodeType !== "TABLE" || typeof selectedNode.tableName !== "string") {
			return;
		}

		void navigate({to: "/project/content-manager/entries", search: {page: 1, size: 10, table: selectedNode.tableName}});
	};

	/**
	 * @summary 임시 트리 변경사항 저장 API 반영
	 */
	const handleSaveChanges: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (JSON.stringify(folderNodes) === JSON.stringify(draftFolderNodes)) {
			return;
		}

		mutationContentFolderSave.mutate({data: {nodes: serializeFolderSaveNodes(draftFolderNodes)}});
	};

	/**
	 * @summary 드래그 앤 드롭 규칙 반영용 트리 재배치
	 */
	const handleTreeDrop: UiTreeProps["onDrop"] = (dropInfo) => {
		const dragKey = String(dropInfo.dragNode.key);
		const dropKey = String(dropInfo.node.key);
		const dragId = Number(dragKey);
		const dropId = Number(dropKey);
		if (Number.isNaN(dragId) || Number.isNaN(dropId)) {
			return;
		}

		setDraftFolderNodes((prevNodes) => {
			const nextNodes = structuredClone(prevNodes);
			const dragContext = findNodeContext(nextNodes, dragId, undefined);
			if (!dragContext) {
				return prevNodes;
			}

			const draggedNode = dragContext.node;
			// FOLDER를 자기 하위로 드롭하는 순환 이동 차단
			if (draggedNode.nodeType === "FOLDER" && hasDescendantNode(draggedNode, dropId)) {
				return prevNodes;
			}

			dragContext.array.splice(dragContext.index, 1);
			const dropContext = findNodeContext(nextNodes, dropId, undefined);
			if (!dropContext) {
				return prevNodes;
			}

			const dropPositionTokens = String(dropInfo.node.pos).split("-");
			const dropBaseIndex = Number(dropPositionTokens[dropPositionTokens.length - 1]);
			const relativeDropPosition = dropInfo.dropPosition - dropBaseIndex;

			if (draggedNode.nodeType === "FOLDER" && dropContext.parentNode) {
				return prevNodes;
			}
			if (draggedNode.nodeType === "FOLDER" && !dropInfo.dropToGap) {
				return prevNodes;
			}

			// antd Tree의 dropToGap/expanded 조합을 폴더 내부 삽입 케이스로 해석
			const canDropTableInsideFolder = draggedNode.nodeType === "TABLE" && dropContext.node.nodeType === "FOLDER" && !dropInfo.dropToGap;
			if (canDropTableInsideFolder) {
				const childNodes = getChildNodes(dropContext.node);
				childNodes.unshift({...draggedNode, parentId: dropContext.node.id});

				dropContext.node.children = childNodes;
				setExpandedKeys((prevKeys) => {
					// 내부 이동 직후 대상 폴더를 펼쳐 이동 결과 즉시 노출
					const nextDropKey = String(dropContext.node.id);
					if (prevKeys.includes(nextDropKey)) {
						return prevKeys;
					}
					return [...prevKeys, nextDropKey];
				});
				return reindexNodes(nextNodes, undefined);
			}

			const insertIndex = relativeDropPosition < 0 ? dropContext.index : dropContext.index + 1;
			dropContext.array.splice(insertIndex, 0, draggedNode);

			return reindexNodes(nextNodes, undefined);
		});
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Folders"} desc="Content folder tree">
				<UiButton
					type="primary"
					onClick={handleSaveChanges}
					disabled={JSON.stringify(folderNodes) === JSON.stringify(draftFolderNodes) || mutationContentFolderSave.isPending}
				>
					Save Changes
				</UiButton>
			</WidgetContentHeader>
			<WidgetContentBody>
				<section className={clsx("rt_pcmfi__layout")}>
					{/* 트리 */}
					<div className={clsx("rt_pcmfi__sidebarPanel")}>
						<div className={clsx("rt_pcmfi__sidebarHeader")}>
							<div className={clsx("rt_pcmfi__sidebarStats")}>
								<div className={clsx("rt_pcmfi__sidebarItem")}>
									<Folder {...iconPreset.primary()} />

									<UiTypoText strong>{folderKeys.length}</UiTypoText>
								</div>
								<div className={clsx("rt_pcmfi__sidebarItem")}>
									<File {...iconPreset.primary()} />
									<UiTypoText strong>{countTableNodes(draftFolderNodes)}</UiTypoText>
								</div>
							</div>
							<UiButton type="primary" icon={<Plus {...iconPreset.primary()} />} onClick={handleAddFolder}>
								Add Folder
							</UiButton>
						</div>
						<div className={clsx("rt_pcmfi__treeToolbar")}>
							<div className={clsx("rt_pcmfi__treeToolbarSearch")}>
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
							<div className={clsx("rt_pcmfi__treeToolbarActions")}>
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
						<div ref={treeBoxRef} className={clsx("rt_pcmfi__treeBox")}>
							<Activity mode={filteredFolderNodes.length > 0 ? "visible" : "hidden"}>
								<UiTree
									draggable
									blockNode
									showIcon
									showLine
									switcherIcon={(nodeProps) => {
										return (
											<ChevronUpSmall
												className={clsx("rt_pcmfi__treeSwitcherIcon", nodeProps.expanded && "rt_pcmfi__treeSwitcherIcon--expanded")}
											/>
										);
									}}
									treeData={filteredFolderNodes.map((node) =>
										mapFolderNodeToTreeData(node, {
											renderTitle: (node) => {
												if (node.nodeType === "TABLE") {
													return <span className={clsx(!node.displayed && "rt_pcmfi__treeNodeLabel--hidden")}>{node.name}</span>;
												}

												return (
													<span className={clsx("rt_pcmfi__treeNodeLabel--folder", !node.displayed && "rt_pcmfi__treeNodeLabel--hidden")}>
														{node.name}
													</span>
												);
											},
											renderIcon: (node) => {
												if (node.nodeType === "TABLE") {
													return <File {...iconPreset.outlined()} className={clsx(!node.displayed && "rt_pcmfi__treeNodeIcon--hidden")} />;
												}

												return <Folder {...iconPreset.outlined()} />;
											},
										}),
									)}
									expandedKeys={expandedKeys}
									selectedKeys={selectedKeys}
									onExpand={handleTreeExpand}
									onSelect={handleTreeSelect}
									onDrop={handleTreeDrop}
								/>
							</Activity>
							<Activity mode={filteredFolderNodes.length > 0 ? "hidden" : "visible"}>
								<div className={clsx("rt_pcmfi__treeEmpty")}>
									<UiEmpty description="No matching results" />
								</div>
							</Activity>
						</div>
					</div>

					{/* 디테일 */}
					<div className={clsx("rt_pcmfi__detailPanel")}>
						<Activity mode={selectedNode ? "visible" : "hidden"}>
							<div className={clsx("rt_pcmfi__detailHeader")}>
								<div className={clsx("rt_pcmfi__heroCard")}>
									<div className={clsx("rt_pcmfi__heroContent")}>
										<UiTypoTitle level={3}>{nameInputValue}</UiTypoTitle>
										<div className={clsx("rt_pcmfi__heroMeta")}>
											<UiTag
												icon={
													selectedNode?.nodeType === "TABLE" ? <File {...iconPreset.outlined()} /> : <Folder {...iconPreset.outlined()} />
												}
											>
												{selectedNode?.nodeType === "TABLE" ? "Table" : "Folder"}
											</UiTag>
											<Activity mode={selectedNode ? "visible" : "hidden"}>
												<div className={clsx(!selectedNode?.displayed && "rt_pcmfi__heroStateTag--hidden")}>
													<UiTag color={selectedNode?.displayed ? "success" : "default"}>
														{selectedNode?.displayed ? "Visible" : "Hidden"}
													</UiTag>
												</div>
											</Activity>
										</div>
									</div>
								</div>
								<div className={clsx("rt_pcmfi__detailActions")}>
									<Activity mode={selectedNode?.nodeType === "FOLDER" ? "visible" : "hidden"}>
										<UiButton
											danger
											icon={<Trash {...iconPreset.outlined()} />}
											onClick={handleSelectedNodeRemove}
											disabled={!selectedNodeContext?.node}
										>
											Delete
										</UiButton>
									</Activity>
								</div>
							</div>
						</Activity>
						<Activity mode={selectedNodeContext?.node ? "visible" : "hidden"}>
							<div className={clsx("rt_pcmfi__detailBody")}>
								<Activity mode={selectedNode?.nodeType === "TABLE" ? "visible" : "hidden"}>
									<div className={clsx("rt_pcmfi__detailTopSection")}>
										<div className={clsx("rt_pcmfi__fieldList")}>
											<div className={clsx("rt_pcmfi__fieldBlock")}>
												<UiTypoText>Table Name</UiTypoText>
												<div className={clsx("rt_pcmfi__fieldCodeValue")}>{selectedNode?.tableName}</div>
											</div>
											<div className={clsx("rt_pcmfi__fieldBlock")}>
												<UiTypoText>Parent Folder</UiTypoText>
												<div className={clsx("rt_pcmfi__fieldValue")}>
													{selectedNodeContext?.parentNode ? selectedNodeContext.parentNode.name : "Root"}
												</div>
											</div>
										</div>
									</div>
								</Activity>

								<Activity mode={selectedNode?.nodeType === "FOLDER" ? "visible" : "hidden"}>
									<div className={clsx("rt_pcmfi__detailStatsSection")}>
										<div className={clsx("rt_pcmfi__statsGrid")}>
											<div className={clsx("rt_pcmfi__statCard")}>
												<UiTypoText type="secondary">All Tables</UiTypoText>
												<UiTypoTitle level={4}>{selectedNode ? countTableNodes(getChildNodes(selectedNode)) : 0}</UiTypoTitle>
											</div>
											<div className={clsx("rt_pcmfi__statCard")}>
												<UiTypoText type="secondary">Visible Tables</UiTypoText>
												<UiTypoTitle level={4}>{selectedNode ? countDisplayedTableNodes(getChildNodes(selectedNode)) : 0}</UiTypoTitle>
											</div>
										</div>
									</div>
								</Activity>

								<div className={clsx("rt_pcmfi__detailSection")}>
									<div className={clsx("rt_pcmfi__fieldBlock")}>
										<UiTypoText strong>Name</UiTypoText>
										<UiInput value={nameInputValue} onBlur={handleTitleInputBlur} onChange={handleTitleInputChange} placeholder={"Name"} />
									</div>
									<Activity mode={selectedNode ? "visible" : "hidden"}>
										<div className={clsx("rt_pcmfi__fieldBlock")}>
											<div className={clsx("rt_pcmfi__switchRow")}>
												<div className={clsx("rt_pcmfi__switchLabel")}>
													<UiTypoText strong>Display</UiTypoText>
													<UiTypoText type="secondary">메뉴 표시 여부를 제어합니다.</UiTypoText>
												</div>
												<UiSwitch
													checked={selectedNode?.displayed}
													onChange={handleDisplayedChange}
													checkedChildren={"ON"}
													unCheckedChildren={"OFF"}
												/>
											</div>
										</div>
									</Activity>
								</div>

								<Activity mode={typeof selectedNode?.tableName === "string" ? "visible" : "hidden"}>
									<div className={clsx("rt_pcmfi__actionWrap")}>
										<UiButton
											size="large"
											type="primary"
											block
											icon={<LinkExternal {...iconPreset.outlined()} />}
											onClick={handleOpenEntriesButtonClick}
											disabled={selectedNode?.displayed !== true}
										>
											Open Entries
										</UiButton>
									</div>
								</Activity>
							</div>
						</Activity>
						<Activity mode={selectedNodeContext?.node ? "hidden" : "visible"}>
							<div className={clsx("rt_pcmfi__empty")}>
								<UiEmpty description="Select a folder or screen from the tree on the left." />
							</div>
						</Activity>
					</div>
				</section>
			</WidgetContentBody>
		</Fragment>
	);
}
