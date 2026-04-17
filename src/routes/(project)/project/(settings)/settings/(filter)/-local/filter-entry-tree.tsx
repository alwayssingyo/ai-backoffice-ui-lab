import {Fragment, type MouseEventHandler} from "react";
import clsx from "clsx";
import {ChevronUpSmall, File, Folder} from "griddy-icons";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiTree, {type UiTreeProps} from "@/components/ui/tree/ui-tree.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {getFilterTreeTableKey, mapFilterNodeToTreeData, type FilterSidebarNode, type FilterTreeRenderers} from "../filter.ts";
import "./filter-entry-tree.css";

interface FilterEntryTreeProps {
	sidebarNodes: FilterSidebarNode[];
	folderCount: number;
	tableCount: number;
	expandedKeys: string[];
	selectedTableName?: string;
	isPending: boolean;
	isError: boolean;
	onExpand: UiTreeProps["onExpand"];
	onRetry: MouseEventHandler<HTMLButtonElement>;
	onSelectTable: (tableName: string) => void;
}

const filterTreeRenderers: FilterTreeRenderers = {
	renderTitle: (node) => {
		return (
			<span className={clsx("rt_psfet__treeLabel")}>
				<span className={clsx("rt_psfet__treeLabelTitle", node.nodeType === "FOLDER" && "rt_psfet__treeLabelTitle--folder")}>
					{node.name}
				</span>
			</span>
		);
	},
	renderIcon: (node) => {
		if (node.nodeType === "TABLE") {
			return <File {...iconPreset.outlined()} />;
		}

		return <Folder {...iconPreset.outlined()} />;
	},
};

export default function FilterEntryTree(props: FilterEntryTreeProps) {
	const {sidebarNodes, folderCount, tableCount, expandedKeys, selectedTableName, isPending, isError, onExpand, onRetry, onSelectTable} =
		props;

	const handleTreeSelect: UiTreeProps["onSelect"] = (keys) => {
		const selectedKey = keys[0];
		if (typeof selectedKey === "undefined") {
			return;
		}

		const nodeKey = String(selectedKey);
		if (!nodeKey.startsWith("table:")) {
			return;
		}

		const tableName = nodeKey.replace("table:", "");
		if (tableName.length < 1) {
			return;
		}

		onSelectTable(tableName);
	};

	return (
		<Fragment>
			<div className={clsx("rt_psfet__panel")}>
				<div className={clsx("rt_psfet__header")}>
					<div className={clsx("rt_psfet__stats")}>
						<span className={clsx("rt_psfet__stat")}>
							<Folder {...iconPreset.tertiary()} />
							<UiTypoText strong>{folderCount}</UiTypoText>
						</span>
						<span className={clsx("rt_psfet__stat")}>
							<File {...iconPreset.tertiary()} />
							<UiTypoText strong>{tableCount}</UiTypoText>
						</span>
					</div>
				</div>

				<div className={clsx("rt_psfet__body")}>
					{isError ? (
						<div className={clsx("rt_psfet__empty")}>
							<UiEmpty
								description={
									<Fragment>
										엔트리 트리를 불러오지 못했습니다.
										<br />
										잠시 후 다시 시도해 주세요.
									</Fragment>
								}
							>
								<UiButton onClick={onRetry}>다시 시도</UiButton>
							</UiEmpty>
						</div>
					) : null}

					{!isError && isPending ? (
						<div className={clsx("rt_psfet__empty")}>
							<UiTypoText type={"secondary"}>엔트리 트리를 불러오는 중입니다.</UiTypoText>
						</div>
					) : null}

					{!isError && !isPending && sidebarNodes.length < 1 ? (
						<div className={clsx("rt_psfet__empty")}>
							<UiEmpty description="표시할 엔트리가 없습니다." />
						</div>
					) : null}

					{!isError && !isPending && sidebarNodes.length > 0 ? (
						<div className={clsx("rt_psfet__tree")}>
							<UiTree
								blockNode
								showIcon
								showLine
								switcherIcon={(nodeProps) => {
									return (
										<ChevronUpSmall
											className={clsx("rt_psfet__treeSwitcherIcon", nodeProps.expanded && "rt_psfet__treeSwitcherIcon--expanded")}
										/>
									);
								}}
								treeData={sidebarNodes.map((node) => mapFilterNodeToTreeData(node, filterTreeRenderers))}
								expandedKeys={expandedKeys}
								selectedKeys={selectedTableName ? [getFilterTreeTableKey(selectedTableName)] : []}
								onExpand={onExpand}
								onSelect={handleTreeSelect}
							/>
						</div>
					) : null}
				</div>
			</div>
		</Fragment>
	);
}
