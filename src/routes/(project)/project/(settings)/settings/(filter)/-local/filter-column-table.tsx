import {Fragment, type MouseEventHandler} from "react";
import clsx from "clsx";
import {MenuAlt02} from "griddy-icons";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiTextArea from "@/components/ui/input/ui-text-area.tsx";
import UiSelect from "@/components/ui/select/ui-select.tsx";
import UiSwitch from "@/components/ui/switch/ui-switch.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {
	FILTER_COMPONENT_LABELS,
	FILTER_OPERATOR_LABELS,
	type FilterColumnRow,
	type FilterComponentOption,
	type FilterOperatorOption,
} from "../filter.ts";
import "./filter-column-table.css";

interface FilterColumnTableProps {
	tableDisplayName?: string;
	tableName?: string;
	rows: FilterColumnRow[];
	hasSelectedTable: boolean;
	hasSelectableTables: boolean;
	isPending: boolean;
	isError: boolean;
	hasNoColumns: boolean;
	onRetry: MouseEventHandler<HTMLButtonElement>;
	onToggleEnabled: (columnName: string, checked: boolean) => void;
	onChangeLabel: (columnName: string, label: string) => void;
	onChangeItems: (columnName: string, items: string) => void;
	onSelectOperator: (columnName: string, operators: FilterOperatorOption[]) => void;
	onSelectComponent: (columnName: string, component: FilterComponentOption) => void;
	onSaveRow: (columnName: string) => void;
	savingColumnName?: string;
}

export default function FilterColumnTable(props: FilterColumnTableProps) {
	const {
		tableDisplayName,
		tableName,
		rows,
		hasSelectedTable,
		hasSelectableTables,
		isPending,
		isError,
		hasNoColumns,
		onRetry,
		onToggleEnabled,
		onChangeLabel,
		onChangeItems,
		onSelectOperator,
		onSelectComponent,
		onSaveRow,
		savingColumnName,
	} = props;

	return (
		<Fragment>
			<div className={clsx("rt_psfct__panel")}>
				<div className={clsx("rt_psfct__header")}>
					<div className={clsx("rt_psfct__title")}>
						<UiTypoTitle level={3}>{tableDisplayName ?? "Filter"}</UiTypoTitle>
						<UiTypoText type={"secondary"}>{tableName ?? "엔트리를 선택하면 컬럼 기준 draft 구성을 볼 수 있습니다."}</UiTypoText>
					</div>
					<div className={clsx("rt_psfct__meta")} data-testid="filter-table-count">
						<MenuAlt02 {...iconPreset.tertiary()} />
						<span>{rows.length}</span>
					</div>
				</div>

				<div className={clsx("rt_psfct__body")}>
					{!hasSelectableTables ? (
						<div className={clsx("rt_psfct__empty")}>
							<UiEmpty description="필터를 구성할 엔트리가 없습니다." />
						</div>
					) : null}

					{hasSelectableTables && !hasSelectedTable ? (
						<div className={clsx("rt_psfct__empty")}>
							<UiEmpty description="좌측 엔트리 트리에서 TABLE 노드를 선택해 주세요." />
						</div>
					) : null}

					{hasSelectableTables && hasSelectedTable && isError ? (
						<div className={clsx("rt_psfct__empty")}>
							<UiEmpty
								description={
									<Fragment>
										컬럼 목록을 불러오지 못했습니다.
										<br />
										잠시 후 다시 시도해 주세요.
									</Fragment>
								}
							>
								<UiButton onClick={onRetry}>다시 시도</UiButton>
							</UiEmpty>
						</div>
					) : null}

					{hasSelectableTables && hasSelectedTable && !isError && isPending ? (
						<div className={clsx("rt_psfct__empty")}>
							<UiTypoText type={"secondary"}>컬럼 목록을 불러오는 중입니다.</UiTypoText>
						</div>
					) : null}

					{hasSelectableTables && hasSelectedTable && !isError && !isPending && hasNoColumns ? (
						<div className={clsx("rt_psfct__empty")}>
							<UiEmpty description="선택한 엔트리에 필터 대상 컬럼이 없습니다." />
						</div>
					) : null}

					{hasSelectableTables && hasSelectedTable && !isError && !isPending && !hasNoColumns ? (
						<UiTable
							rowKey={(record) => record.key}
							dataSource={rows}
							tableLayout={"fixed"}
							columns={[
								{title: "컬럼명", dataIndex: "name", className: "ui_table__col", width: 220, ellipsis: true},
								{
									title: "Label 표시이름",
									dataIndex: "label",
									className: "ui_table__col",
									width: 220,
									render: (_value: string, record: FilterColumnRow) => {
										return (
											<UiInput
												value={record.label}
												placeholder={record.name}
												disabled={!record.supported}
												onChange={(event) => {
													onChangeLabel(record.name, event.target.value);
												}}
											/>
										);
									},
								},
								{title: "필드 타입", dataIndex: "fieldType", className: "ui_table__col", width: 140},
								{
									title: "필터 사용",
									dataIndex: "enabled",
									className: "ui_table__col",
									width: 120,
									render: (_value: boolean, record: FilterColumnRow) => {
										return (
											<span className={clsx("rt_psfct__switch")}>
												<UiSwitch
													data-testid={`filter-toggle-${record.name}`}
													checked={record.enabled}
													disabled={!record.supported}
													aria-label={`Enable filter ${record.name}`}
													onChange={(checked) => {
														onToggleEnabled(record.name, checked);
													}}
												/>
											</span>
										);
									},
								},
								{
									title: "operator",
									dataIndex: "operators",
									className: "ui_table__col",
									width: 180,
									render: (_value: FilterOperatorOption[], record: FilterColumnRow) => {
										return (
											<UiSelect
												data-testid={`filter-operator-${record.name}`}
												className={clsx("rt_psfct__select")}
												mode={"multiple"}
												value={record.operators}
												placeholder={record.supported ? "operator 선택" : "-"}
												disabled={!record.supported || !record.enabled}
												aria-label={`Operator ${record.name}`}
												options={record.supportedOperators.map((operator) => ({label: FILTER_OPERATOR_LABELS[operator], value: operator}))}
												onChange={(value) => {
													onSelectOperator(record.name, value as FilterOperatorOption[]);
												}}
											/>
										);
									},
								},
								{
									title: "component",
									dataIndex: "component",
									className: "ui_table__col",
									width: 180,
									render: (_value: FilterComponentOption | undefined, record: FilterColumnRow) => {
										return (
											<UiSelect
												data-testid={`filter-component-${record.name}`}
												className={clsx("rt_psfct__select")}
												value={record.component}
												placeholder={record.supported ? "component 선택" : "-"}
												disabled={!record.supported || !record.enabled}
												aria-label={`Component ${record.name}`}
												options={record.supportedComponents.map((component) => ({
													label: FILTER_COMPONENT_LABELS[component],
													value: component,
												}))}
												onChange={(value) => {
													onSelectComponent(record.name, value as FilterComponentOption);
												}}
											/>
										);
									},
								},
								{
									title: "items",
									dataIndex: "items",
									className: "ui_table__col",
									width: 280,
									render: (_value: string, record: FilterColumnRow) => {
										//console.log(record.items, record)
										return (
											<UiTextArea
												className={clsx("rt_psfct__itemsInput")}
												rows={3}
												value={record.items}
												placeholder={"label:value, label:value"}
												disabled={!record.canEditItems}
												onChange={(event) => {
													onChangeItems(record.name, event.target.value);
												}}
											/>
										);
									},
								},
								{
									title: "상태",
									dataIndex: "status",
									className: "ui_table__col",
									width: 220,
									render: (_value: FilterColumnRow["status"], record: FilterColumnRow) => {
										return (
											<span
												data-testid={`filter-status-${record.name}`}
												className={clsx(
													"rt_psfct__status",
													record.status.tone === "idle" && "rt_psfct__status--idle",
													record.status.tone === "draft" && "rt_psfct__status--draft",
													record.status.tone === "active" && "rt_psfct__status--active",
													record.status.tone === "unchanged" && "rt_psfct__status--unchanged",
													record.status.tone === "unsupported" && "rt_psfct__status--unsupported",
												)}
											>
												{record.status.label}
											</span>
										);
									},
								},
								{
									title: "저장",
									key: "save",
									className: "ui_table__col",
									width: 120,
									render: (_value: unknown, record: FilterColumnRow) => {
										return (
											<UiButton
												type={"primary"}
												disabled={!record.canSave || typeof savingColumnName === "string"}
												loading={savingColumnName === record.name}
												onClick={() => {
													onSaveRow(record.name);
												}}
											>
												저장
											</UiButton>
										);
									},
								},
							]}
							scroll={{x: "max-content"}}
							pagination={false}
						/>
					) : null}
				</div>
			</div>
		</Fragment>
	);
}
