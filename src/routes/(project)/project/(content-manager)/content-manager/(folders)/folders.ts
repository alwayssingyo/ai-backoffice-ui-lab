import type {ContentFolderNodeResponse} from "@/services/types/content-folder-node-response.ts";
import type {ContentFolderSaveNodeRequest} from "@/services/types/content-folder-save-node-request.ts";

export type ContentFolderTreeNode = Omit<ContentFolderNodeResponse, "children"> & {children: ContentFolderTreeNode[]};

export type NodeContext = {
	node: ContentFolderTreeNode;
	array: ContentFolderTreeNode[];
	index: number;
	parentNode: ContentFolderTreeNode | undefined;
};

export type FolderTreeRenderers = {
	renderTitle: (node: ContentFolderTreeNode) => unknown;
	renderIcon: (node: ContentFolderTreeNode) => unknown;
};

export type SelectedFolderNodeState = {selectedNodeContext: NodeContext | undefined; selectedNode: ContentFolderTreeNode | undefined};

/**
 * @summary 스웨거 children 단일 객체/누락 케이스 대응용 트리 노드 배열 정규화
 */
export const normalizeFolderTreeNodes = (nodes: ContentFolderNodeResponse[]): ContentFolderTreeNode[] => {
	const isContentFolderNodeResponse = (value: unknown): value is ContentFolderNodeResponse => {
		if (typeof value !== "object" || !value) {
			return false;
		}

		return !(!("id" in value) || !("nodeType" in value) || !("name" in value) || !("orderNumber" in value) || !("displayed" in value));
	};

	const normalizeNode = (node: ContentFolderNodeResponse): ContentFolderTreeNode => {
		const normalizedChildNodes: ContentFolderTreeNode[] = [];

		if (Array.isArray(node.children)) {
			for (let index = 0; index < node.children.length; index += 1) {
				const currentChildNode = node.children[index];
				if (!isContentFolderNodeResponse(currentChildNode)) {
					continue;
				}
				normalizedChildNodes.push(normalizeNode(currentChildNode));
			}
		} else if (isContentFolderNodeResponse(node.children)) {
			// 스웨거 children 단일 객체 응답을 배열 트리 구조로 보정
			normalizedChildNodes.push(normalizeNode(node.children));
		}

		return {...node, children: normalizedChildNodes};
	};

	const normalizedNodes: ContentFolderTreeNode[] = [];
	for (let index = 0; index < nodes.length; index += 1) {
		normalizedNodes.push(normalizeNode(nodes[index] as ContentFolderNodeResponse));
	}

	return normalizedNodes;
};

/**
 * @summary 하위 노드 접근 일관성 확보용 children 반환
 */
export const getChildNodes = (node: ContentFolderTreeNode): ContentFolderTreeNode[] => {
	return node.children;
};

/**
 * @summary 노드 선택/이동 처리용 대상 id 문맥 탐색
 * biome-ignore format: keep
 */
export const findNodeContext = (nodes: ContentFolderTreeNode[], targetId: number, parentNode: ContentFolderTreeNode | undefined): NodeContext | undefined => {
	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderTreeNode;
		if (currentNode.id === targetId) {
			return {
				node: currentNode,
				array: nodes,
				index,
				parentNode,
			};
		}

		const foundNodeContext = findNodeContext(getChildNodes(currentNode), targetId, currentNode);
		if (foundNodeContext) {
			return foundNodeContext;
		}
	}

	return undefined;
};

/**
 * @summary URL table 파라미터 복원용 TABLE 문맥 탐색
 * biome-ignore format: keep
 */
export const findTableNodeContextByTableName = (nodes: ContentFolderTreeNode[], targetTableName: string, parentNode: ContentFolderTreeNode | undefined): NodeContext | undefined => {
	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderTreeNode;
		if (currentNode.nodeType === "TABLE" && currentNode.tableName === targetTableName) {
			return {
				node: currentNode,
				array: nodes,
				index,
				parentNode,
			};
		}

		const foundNodeContext = findTableNodeContextByTableName(getChildNodes(currentNode), targetTableName, currentNode);
		if (foundNodeContext) {
			return foundNodeContext;
		}
	}

	return undefined;
};

/**
 * @summary URL search(folder/table) 기준 선택 key 복원
 */
export const resolveSelectedKeysFromSearch = (
	nodes: ContentFolderTreeNode[],
	searchFolderId: number | undefined,
	searchTableName: string | undefined,
): string[] => {
	if (typeof searchTableName === "string") {
		const foundTableNodeContext = findTableNodeContextByTableName(nodes, searchTableName, undefined);
		if (foundTableNodeContext) {
			return [String(foundTableNodeContext.node.id)];
		}
	}

	if (typeof searchFolderId === "number") {
		const foundFolderNodeContext = findNodeContext(nodes, searchFolderId, undefined);
		if (foundFolderNodeContext && foundFolderNodeContext.node.nodeType === "FOLDER") {
			return [String(foundFolderNodeContext.node.id)];
		}
	}

	return [];
};

/**
 * @summary 선택 key 기반 상세 패널 노드 문맥 계산
 */
export const resolveSelectedNodeState = (nodes: ContentFolderTreeNode[], selectedKeys: string[]): SelectedFolderNodeState => {
	const selectedKey = selectedKeys[0];
	if (typeof selectedKey !== "string") {
		return {selectedNodeContext: undefined, selectedNode: undefined};
	}

	const selectedNodeId = Number(selectedKey);
	if (Number.isNaN(selectedNodeId)) {
		return {selectedNodeContext: undefined, selectedNode: undefined};
	}

	const selectedNodeContext = findNodeContext(nodes, selectedNodeId, undefined);
	return {selectedNodeContext, selectedNode: selectedNodeContext?.node};
};

/**
 * @summary 순환 참조 드롭 방지용 하위 노드 포함 여부 검사
 */
export const hasDescendantNode = (node: ContentFolderTreeNode, targetId: number): boolean => {
	if (node.id === targetId) {
		return true;
	}

	const childNodes = getChildNodes(node);
	for (let index = 0; index < childNodes.length; index += 1) {
		const hasTarget = hasDescendantNode(childNodes[index] as ContentFolderTreeNode, targetId);
		if (hasTarget) {
			return true;
		}
	}

	return false;
};

/**
 * @summary 저장 페이로드 정합성 확보용 orderNumber/parentId 재색인
 * biome-ignore format: keep
 */
export const reindexNodes = (nodes: ContentFolderTreeNode[], parentNode: ContentFolderTreeNode | undefined): ContentFolderTreeNode[] => {
	return nodes.map((node, index) => {
		const nextNode: ContentFolderTreeNode = {
			...node,
			orderNumber: index,
			parentId: parentNode?.id,
		};

		if (nextNode.nodeType === "FOLDER") {
			nextNode.children = reindexNodes(getChildNodes(nextNode), nextNode);
			return nextNode;
		}

		nextNode.children = [];
		return nextNode;
	});
};

/**
 * @summary 사이드바 통계 표시용 TABLE 전체 개수 집계
 */
export const countTableNodes = (nodes: ContentFolderTreeNode[]): number => {
	let tableCount = 0;

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderTreeNode;
		if (currentNode.nodeType === "TABLE") {
			tableCount += 1;
			continue;
		}

		tableCount += countTableNodes(getChildNodes(currentNode));
	}

	return tableCount;
};

/**
 * @summary 표시 상태 통계용 displayed=true TABLE 개수 집계
 */
export const countDisplayedTableNodes = (nodes: ContentFolderTreeNode[]): number => {
	let displayedTableCount = 0;

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderTreeNode;
		if (currentNode.nodeType === "TABLE") {
			if (currentNode.displayed) {
				displayedTableCount += 1;
			}
			continue;
		}

		displayedTableCount += countDisplayedTableNodes(getChildNodes(currentNode));
	}

	return displayedTableCount;
};

/**
 * @summary 초기 확장 상태 복원용 FOLDER key 목록 수집
 */
export const collectFolderKeys = (nodes: ContentFolderTreeNode[]): string[] => {
	const folderKeys: string[] = [];

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderTreeNode;
		if (currentNode.nodeType !== "FOLDER") {
			continue;
		}

		folderKeys.push(String(currentNode.id));
		folderKeys.push(...collectFolderKeys(getChildNodes(currentNode)));
	}

	return folderKeys;
};

/**
 * @summary 트리 노드 UiTree 데이터 변환용 렌더링 콜백 위임 매핑
 * biome-ignore format: keep
 */
export const mapFolderNodeToTreeData = (node: ContentFolderTreeNode, renderers: FolderTreeRenderers): Record<string, unknown> => {
	if (node.nodeType === "TABLE") {
		return {
			key: String(node.id),
			title: renderers.renderTitle(node),
			icon: renderers.renderIcon(node),
			isLeaf: true,
		};
	}

	return {
		key: String(node.id),
		title: renderers.renderTitle(node),
		icon: renderers.renderIcon(node),
		children: getChildNodes(node).map((childNode) => mapFolderNodeToTreeData(childNode, renderers)),
	};
};

/**
 * @summary 폴더 일괄 동기화와 TABLE 단건 ON 시 상위 폴더 복구 규칙 반영
 * biome-ignore format: keep
 */
export const updateNodeDisplayed = (nodes: ContentFolderTreeNode[], targetId: number, nextDisplayed: boolean): ContentFolderTreeNode[] => {
	const applyDisplayedToDescendants = (node: ContentFolderTreeNode, displayed: boolean): ContentFolderTreeNode => {
		if (node.nodeType === "TABLE") {
			return {
				...node,
				displayed,
				children: [],
			};
		}

		return {
			...node,
			displayed,
			children: getChildNodes(node).map((childNode) => applyDisplayedToDescendants(childNode, displayed)),
		};
	};

	const updateDisplayed = (
		currentNodes: ContentFolderTreeNode[],
	): {
		nodes: ContentFolderTreeNode[];
		hasEnabledTargetTable: boolean;
	} => {
		let hasEnabledTargetTable = false;

		const nextNodes = currentNodes.map((node) => {
			if (node.id === targetId) {
				if (node.nodeType === "FOLDER") {
					return applyDisplayedToDescendants(node, nextDisplayed);
				}

				if (nextDisplayed) {
					hasEnabledTargetTable = true;
				}

				return {
					...node,
					displayed: nextDisplayed,
				};
			}

			if (node.nodeType === "TABLE") {
				return node;
			}

			const updatedChildren = updateDisplayed(getChildNodes(node));
			if (updatedChildren.hasEnabledTargetTable) {
				// 하위에서 TABLE ON이 발생하면 상위 경로 FOLDER를 ON으로 복구해야 함
				hasEnabledTargetTable = true;
			}

			if (updatedChildren.hasEnabledTargetTable && !node.displayed) {
				return {
					...node,
					displayed: true,
					children: updatedChildren.nodes,
				};
			}

			return {
				...node,
				children: updatedChildren.nodes,
			};
		});

		return {
			nodes: nextNodes,
			hasEnabledTargetTable,
		};
	};

	return updateDisplayed(nodes).nodes;
};

/**
 * @summary 신규 루트 FOLDER 생성 결과 반환
 * biome-ignore format: keep
 */
export const appendRootFolderNode = (nodes: ContentFolderTreeNode[]): {nodes: ContentFolderTreeNode[]; createdFolderId: number} => {
	let maxNodeId = 0;

	const collectMaxNodeId = (currentNodes: ContentFolderTreeNode[]): void => {
		for (let index = 0; index < currentNodes.length; index += 1) {
			const currentNode = currentNodes[index] as ContentFolderTreeNode;
			if (currentNode.id > maxNodeId) {
				maxNodeId = currentNode.id;
			}

			collectMaxNodeId(getChildNodes(currentNode));
		}
	};

	collectMaxNodeId(nodes);

	const createdFolderId = maxNodeId + 1;

	const createdFolderNode: ContentFolderTreeNode = {
		id: createdFolderId,
		nodeType: "FOLDER",
		name: "New Folder",
		orderNumber: nodes.length,
		displayed: true,
		children: [],
	};

	return {
		nodes: [...nodes, createdFolderNode],
		createdFolderId,
	};
};

/**
 * @summary FOLDER 삭제 후 하위 TABLE 루트 승격 정책 적용
 * biome-ignore format: keep
 */
export const removeFolderAndPromoteTables = (nodes: ContentFolderTreeNode[], targetFolderId: number): ContentFolderTreeNode[] => {
	const collectDescendantTableNodes = (node: ContentFolderTreeNode): ContentFolderTreeNode[] => {
		if (node.nodeType === "TABLE") {
			return [
				{
					...node,
					children: [],
				},
			];
		}

		const tableNodes: ContentFolderTreeNode[] = [];
		const childNodes = getChildNodes(node);
		for (let index = 0; index < childNodes.length; index += 1) {
			tableNodes.push(...collectDescendantTableNodes(childNodes[index] as ContentFolderTreeNode));
		}

		return tableNodes;
	};

	const removeFolderNode = (
		currentNodes: ContentFolderTreeNode[],
	): {
		nodes: ContentFolderTreeNode[];
		extractedTableNodes: ContentFolderTreeNode[];
	} => {
		let extractedTableNodes: ContentFolderTreeNode[] = [];
		const nextNodes: ContentFolderTreeNode[] = [];

		for (let index = 0; index < currentNodes.length; index += 1) {
			const currentNode = currentNodes[index] as ContentFolderTreeNode;
			if (currentNode.id === targetFolderId && currentNode.nodeType === "FOLDER") {
				extractedTableNodes = collectDescendantTableNodes(currentNode);
				continue;
			}

			const childResult = removeFolderNode(getChildNodes(currentNode));
			if (childResult.extractedTableNodes.length > 0) {
				// 목표 FOLDER는 트리 내 단일 노드라는 가정으로 마지막 발견 결과를 채택
				extractedTableNodes = childResult.extractedTableNodes;
			}

			nextNodes.push({
				...currentNode,
				children: childResult.nodes,
			});
		}

		return {
			nodes: nextNodes,
			extractedTableNodes,
		};
	};

	const removeResult = removeFolderNode(nodes);
	if (removeResult.extractedTableNodes.length < 1) {
		return reindexNodes(removeResult.nodes, undefined);
	}

	const detachedTableNodes = removeResult.extractedTableNodes.map((tableNode) => {
		return {
			...tableNode,
			parentId: undefined,
			children: [],
		};
	});

	return reindexNodes([...removeResult.nodes, ...detachedTableNodes], undefined);
};

/**
 * @summary 선택 노드 이름 수정 반영용 트리 갱신
 * biome-ignore format: keep
 */
export const updateNodeName = (nodes: ContentFolderTreeNode[], targetNodeId: number, nextName: string,): ContentFolderTreeNode[] => {
	const updateName = (
		currentNodes: ContentFolderTreeNode[],
	): {
		nodes: ContentFolderTreeNode[];
		found: boolean;
	} => {
		for (let index = 0; index < currentNodes.length; index += 1) {
			const currentNode = currentNodes[index] as ContentFolderTreeNode;
			if (currentNode.id === targetNodeId) {
				if (currentNode.name === nextName) {
					return {nodes: currentNodes, found: true};
				}

				const nextNodes = [...currentNodes];
				nextNodes[index] = {
					...currentNode,
					name: nextName,
				};
				return {nodes: nextNodes, found: true};
			}

			if (currentNode.nodeType === "TABLE") {
				continue;
			}

			const updatedChildrenResult = updateName(getChildNodes(currentNode));
			if (!updatedChildrenResult.found) {
				continue;
			}

			if (updatedChildrenResult.nodes === getChildNodes(currentNode)) {
				return {nodes: currentNodes, found: true};
			}

			const nextNodes = [...currentNodes];
			nextNodes[index] = {
				...currentNode,
				children: updatedChildrenResult.nodes,
			};
			return {nodes: nextNodes, found: true};
		}

		return {nodes: currentNodes, found: false};
	};

	return updateName(nodes).nodes;
};

/**
 * @summary 저장 API 요청 계약 준수용 트리 직렬화
 */
export const serializeFolderSaveNodes = (nodes: ContentFolderTreeNode[]): ContentFolderSaveNodeRequest[] => {
	return nodes.map((node) => {
		if (node.nodeType === "TABLE") {
			return {nodeType: "TABLE", name: node.name, tableName: node.tableName, displayed: node.displayed};
		}

		return {nodeType: "FOLDER", name: node.name, displayed: node.displayed, children: serializeFolderSaveNodes(getChildNodes(node))};
	});
};
