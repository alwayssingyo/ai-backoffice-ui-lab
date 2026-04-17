import {Fragment, type MouseEventHandler, useEffect, useState} from "react";
import {useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import {AlertCircle, MenuAlt02} from "griddy-icons";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {useAuditLogSearchAuditLogs} from "@/services/hooks/audit-log/use-audit-log-search-audit-logs.ts";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import type {AuditLogPageResponse} from "@/services/types/audit-log-page-response.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import AuditLogSearchPanel from "./audit-log-search-panel.tsx";
import {
	AUDIT_LOG_FILTER_TABLE_NAME,
	AUDIT_LOG_ROUTE_CONFIG,
	buildAuditLogSearchQueryParams,
	buildAuditLogSearchRequestCandidate,
	normalizeAuditLogFilterDefinitions,
	setAuditLogFilterFieldStateValue,
	syncAuditLogFilterFieldStates,
	toAuditLogTableRows,
	type AuditLogFilterDefinition,
	type AuditLogFilterFieldStateMap,
	type AuditLogListSearch,
} from "../audit-log.ts";

type AuditLogScreenProps = {search: AuditLogListSearch};

export default function AuditLogScreen(props: AuditLogScreenProps) {
	const {search} = props;
	const navigate = useNavigate();
	const [auditLogFilterFieldStates, setAuditLogFilterFieldStates] = useState<AuditLogFilterFieldStateMap>({});
	const [appliedSearchCandidate, setAppliedSearchCandidate] = useState(() => {
		return buildAuditLogSearchRequestCandidate({definitions: [], fieldStates: {}});
	});

	const responseAuditLogSearchAuditLogs = useAuditLogSearchAuditLogs(
		buildAuditLogSearchQueryParams({search, searchCandidate: appliedSearchCandidate}),
		{
			query: {
				retry: false,
				select: ({data}) => {
					const logList = data.list as AuditLogPageResponse[];
					return {rows: toAuditLogTableRows(logList), totalCount: data.totalCount};
				},
			},
		},
	);
	const responseFilterSearchFilters = useFilterSearchFilters(
		{table: AUDIT_LOG_FILTER_TABLE_NAME, page: 1, size: 999},
		{
			query: {
				retry: false,
				select: ({data}) => {
					return normalizeAuditLogFilterDefinitions(data.list as FilterResponse[]);
				},
			},
		},
	);

	useEffect(() => {
		setAuditLogFilterFieldStates((prevFieldStates) => {
			return syncAuditLogFilterFieldStates({previousStates: prevFieldStates, definitions: responseFilterSearchFilters.data ?? []});
		});
	}, [responseFilterSearchFilters.data]);

	const rows = responseAuditLogSearchAuditLogs.data?.rows ?? [];
	const totalCount = responseAuditLogSearchAuditLogs.data?.totalCount ?? 0;

	const handleRetryButtonClick: MouseEventHandler<HTMLButtonElement> = () => {
		void responseAuditLogSearchAuditLogs.refetch();
	};

	const handleFilterFieldValueChange = (definition: AuditLogFilterDefinition, value: unknown) => {
		setAuditLogFilterFieldStates((prevFieldStates) => {
			return setAuditLogFilterFieldStateValue({fieldStates: prevFieldStates, definition, value});
		});
	};

	const handleFilterRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		void responseFilterSearchFilters.refetch();
	};

	const handleFilterSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		setAppliedSearchCandidate(
			buildAuditLogSearchRequestCandidate({definitions: responseFilterSearchFilters.data ?? [], fieldStates: auditLogFilterFieldStates}),
		);

		if (search.page === 1) {
			return;
		}

		void navigate({to: AUDIT_LOG_ROUTE_CONFIG.path, search: {page: 1, size: search.size}, replace: true});
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Audit Log"} desc={"Review recent workspace operations and API activity."} />
			<WidgetContentBody>
				<div className={clsx("rt_pali__searchPanel")}>
					<AuditLogSearchPanel
						definitions={responseFilterSearchFilters.data ?? []}
						fieldStates={auditLogFilterFieldStates}
						isLoading={responseFilterSearchFilters.isLoading}
						isError={responseFilterSearchFilters.isError}
						onRetry={handleFilterRetryButtonClick}
						onSubmit={handleFilterSubmitButtonClick}
						onValueChange={handleFilterFieldValueChange}
					/>
				</div>
				<div className={clsx("rt_pali__tableHeader")}>
					<div className={clsx("rt_pali__tableHeaderInfo")}>
						<span className={clsx("rt_pali__tableHeaderCount")}>
							<MenuAlt02 {...iconPreset.tertiary()} />
							{totalCount}
						</span>
					</div>
				</div>

				{responseAuditLogSearchAuditLogs.isError ? (
					<div className={clsx("rt_pali__empty")}>
						<UiEmpty
							description={
								<Fragment>
									감사 로그 목록을 불러오지 못했습니다.
									<br />
									잠시 후 다시 시도해 주세요.
								</Fragment>
							}
						>
							<UiButton onClick={handleRetryButtonClick}>
								<AlertCircle {...iconPreset.outlined()} />
								다시 시도
							</UiButton>
						</UiEmpty>
					</div>
				) : null}

				{!responseAuditLogSearchAuditLogs.isPending && !responseAuditLogSearchAuditLogs.isError && rows.length < 1 ? (
					<div className={clsx("rt_pali__empty")}>
						<UiEmpty
							description={
								<Fragment>
									표시할 감사 로그가 없습니다.
									<br />
									현재 범위에서 조회 가능한 감사 로그가 아직 기록되지 않았습니다.
								</Fragment>
							}
						/>
					</div>
				) : null}

				{!responseAuditLogSearchAuditLogs.isPending && !responseAuditLogSearchAuditLogs.isError && rows.length > 0 ? (
					<UiTable
						rowKey={(record) => record.id}
						dataSource={rows}
						columns={[
							{title: "관리자", dataIndex: "adminName", className: "ui_table__col", width: 160, ellipsis: true},
							{title: "메서드", dataIndex: "method", className: "ui_table__col", width: 120},
							{title: "URL", dataIndex: "url", className: "ui_table__col", width: 280, ellipsis: true},
							{title: "설명", dataIndex: "description", className: "ui_table__col", ellipsis: true},
							{title: "상태", dataIndex: "status", className: "ui_table__col", width: 120},
							{title: "실행 시간", dataIndex: "executionTimeMs", className: "ui_table__col", width: 140},
							{
								title: "생성 일시",
								dataIndex: "createdAt",
								className: "ui_table__col",
								width: 220,
								render: (value: string) => formatDateValue(value) ?? "-",
							},
						]}
						scroll={{x: "max-content"}}
						pagination={{
							current: search.page,
							pageSize: search.size,
							showSizeChanger: true,
							total: totalCount,
							onChange: (page, pageSize) => {
								void navigate({to: AUDIT_LOG_ROUTE_CONFIG.path, search: {page, size: pageSize}});
							},
						}}
					/>
				) : null}
			</WidgetContentBody>
		</Fragment>
	);
}
