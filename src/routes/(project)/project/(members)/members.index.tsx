import {Fragment, type MouseEventHandler, useEffect, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {useQueryClient} from "@tanstack/react-query";
import clsx from "clsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiTable from "@/components/ui/table/ui-table";
import UiTag from "@/components/ui/tag/ui-tag";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import {adminSearchAdminsSuspenseQueryKey, useAdminSearchAdminsSuspense} from "@/services/hooks/admin/use-admin-search-admins-suspense.ts";
import {adminGetItemQueryKey} from "@/services/hooks/admin/use-admin-get-item.ts";
import {useAdminRemoveAdmins} from "@/services/hooks/admin/use-admin-remove-admins.ts";
import {z} from "zod";
import {Settings, Edit, Trash, MenuAlt02, CheckAlt} from "griddy-icons";
import "./members.css";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import type {AdminSummaryResponse} from "@/services/types/admin-summary-response.ts";
import {toString} from "es-toolkit/compat";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {util} from "@/entry/util.ts";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import MembersSearchPanel from "./-local/members-search-panel.tsx";
import {
	buildMembersSearchQueryParams,
	buildMembersSearchRequestCandidate,
	MEMBERS_FILTER_TABLE_NAME,
	normalizeMembersFilterDefinitions,
	setMembersFilterFieldStateValue,
	syncMembersFilterFieldStates,
	type MembersFilterDefinition,
	type MembersFilterFieldStateMap,
} from "./members.ts";

export const Route = createFileRoute("/(project)/project/(members)/members/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(1).catch(1),
		size: z.coerce.number().int().min(1).max(100).default(10).catch(10),
	}),
});

function RouteComponent() {
	const [selectedRows, setSelectedRows] = useState<AdminSummaryResponse[]>([]);
	const [memberFilterFieldStates, setMemberFilterFieldStates] = useState<MembersFilterFieldStateMap>({});
	const [appliedSearchCandidate, setAppliedSearchCandidate] = useState(() => {
		return buildMembersSearchRequestCandidate({definitions: [], fieldStates: {}});
	});
	const {useSearch} = Route;
	const navigate = useNavigate();
	const search = useSearch();
	const queryClient = useQueryClient();

	/**
	 * @description 관리자 목록 조회 API
	 */
	const responseAdminSearchAdminsSuspense = useAdminSearchAdminsSuspense(
		buildMembersSearchQueryParams({searchCandidate: appliedSearchCandidate, page: search.page, size: search.size}),
		{
			query: {
				select: ({data}) => {
					const admins = data.list;

					return {admins: admins, totalCount: data.totalCount};
				},
			},
		},
	);
	/**
	 * @description Member 검색 조건 정의 조회 API
	 */
	const responseFilterSearchFilters = useFilterSearchFilters(
		{table: MEMBERS_FILTER_TABLE_NAME, page: 1, size: 999},
		{
			query: {
				retry: false,
				select: ({data}) => {
					return normalizeMembersFilterDefinitions(data.list as FilterResponse[]);
				},
			},
		},
	);

	/**
	 * @summary 서버에서 내려온 filter definition이 바뀌면 로컬 입력 상태를 동기화합니다.
	 */
	useEffect(() => {
		setMemberFilterFieldStates((prevFieldStates) => {
			return syncMembersFilterFieldStates({previousStates: prevFieldStates, definitions: responseFilterSearchFilters.data ?? []});
		});
	}, [responseFilterSearchFilters.data]);
	/**
	 * @description 관리자 삭제 API
	 */
	const mutationAdminRemoveAdmins = useAdminRemoveAdmins({
		mutation: {
			onSuccess: async (_data, variables) => {
				const adminIds = variables.params.ids;

				await queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)});

				adminIds.forEach((adminId) => {
					queryClient.removeQueries({queryKey: adminGetItemQueryKey(adminId)});
				});

				setSelectedRows([]);
			},
		},
	});

	/**
	 * @summary 멤버 등록 화면으로 이동합니다.
	 */
	const handleMemberAddButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void navigate({to: "/project/members/form/{-$mid}", params: {}});
	};
	/**
	 * @summary 멤버 수정 화면으로 이동합니다.
	 */
	const handleMemberEditButtonClick =
		(record: AdminSummaryResponse): MouseEventHandler<HTMLButtonElement> =>
		(_e) => {
			void navigate({to: "/project/members/form/{-$mid}", params: {mid: toString(record.id)}});
		};
	/**
	 * @summary 선택한 멤버를 삭제합니다.
	 */
	const handleMemberDeleteButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		if (selectedRows.length === 0) {
			return;
		}

		modal.error(
			modalPreset.remove({
				onOk: (..._args) => {
					mutationAdminRemoveAdmins.mutate({params: {ids: selectedRows.map((row) => row.id)}});
				},
			}),
		);
	};

	/**
	 * @summary Member 검색 조건 입력값을 갱신합니다.
	 */
	const handleFilterFieldValueChange = (definition: MembersFilterDefinition, value: unknown) => {
		setMemberFilterFieldStates((prevFieldStates) => {
			return setMembersFilterFieldStateValue({fieldStates: prevFieldStates, definition, value});
		});
	};

	/**
	 * @summary Member 검색 조건 재시도
	 */
	const handleFilterRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		void responseFilterSearchFilters.refetch();
	};

	/**
	 * @summary Member 검색 조건을 적용하고 첫 페이지로 이동합니다.
	 */
	const handleFilterSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		setAppliedSearchCandidate(
			buildMembersSearchRequestCandidate({definitions: responseFilterSearchFilters.data ?? [], fieldStates: memberFilterFieldStates}),
		);

		if (search.page === 1) {
			return;
		}

		void navigate({to: "/project/members", search: {page: 1, size: search.size}, replace: true});
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Members"} desc={"Manage members and their access permissions."}>
				<UiButton type="primary" onClick={handleMemberAddButtonClick}>
					Create
				</UiButton>
			</WidgetContentHeader>
			<WidgetContentBody>
				<div className={clsx("rt_dmi__searchPanel")}>
					<MembersSearchPanel
						definitions={responseFilterSearchFilters.data ?? []}
						fieldStates={memberFilterFieldStates}
						isLoading={responseFilterSearchFilters.isLoading}
						isError={responseFilterSearchFilters.isError}
						onRetry={handleFilterRetryButtonClick}
						onSubmit={handleFilterSubmitButtonClick}
						onValueChange={handleFilterFieldValueChange}
					/>
				</div>
				<div className={clsx("rt_dmi__tableHeader")}>
					<div className={clsx("rt_dmi__tableHeaderInfo")}>
						<span className={clsx("rt_dmi__tableHeaderCount")} data-testid="members-table-count">
							{selectedRows.length > 0 ? <CheckAlt {...iconPreset.tertiary()} /> : <MenuAlt02 {...iconPreset.tertiary()} />}
							{selectedRows.length > 0 ? `${selectedRows.length}` : `${responseAdminSearchAdminsSuspense.data.totalCount}`}
						</span>
					</div>
					<div className={clsx("rt_dmi__tableHeaderActions")}>
						<UiButton
							danger
							icon={<Trash {...iconPreset.outlined()} />}
							disabled={selectedRows.length === 0}
							onClick={handleMemberDeleteButtonClick}
						>
							Delete
						</UiButton>
						<UiButton icon={<Settings {...iconPreset.tertiary()} />} />
					</div>
				</div>
				<UiTable
					columns={[
						{
							width: 45,
							render: (_value, record) => (
								<span className={clsx("ui_table__colEdit")}>
									<UiButton
										type="text"
										icon={<Edit {...iconPreset.tertiary()} />}
										onClick={handleMemberEditButtonClick(record)}
										aria-label={`Edit member ${record.name}`}
										data-testid={`members-edit-${record.id}`}
									/>
								</span>
							),
						},
						{title: "NAME", dataIndex: "name", ellipsis: true, className: "ui_table__col"},
						{title: "EMAIL", dataIndex: "loginId", ellipsis: true, className: "ui_table__col"},

						{
							title: "PERMISSION",
							dataIndex: "permissionGroupName",
							ellipsis: true,
							className: "ui_table__col",
							render: (_value, record, _index) => (
								<UiTag color="blue" variant="outlined">
									{record.permissionGroupName}
								</UiTag>
							),
						},
						{
							title: "STATUS",
							dataIndex: "removed",
							ellipsis: true,
							className: "ui_table__col",
							render: (_value, record, _index) => (
								<UiTag color={record.removed ? "red" : "green"} variant="outlined">
									{record.removed ? "Removed" : "Active"}
								</UiTag>
							),
						},
						{
							title: "LAST LOGIN",
							dataIndex: "lastLoginAt",
							ellipsis: true,
							className: "ui_table__col",
							render: (value) => formatDateValue(value),
						},
						{
							title: "CREATED AT",
							dataIndex: "createdAt",
							ellipsis: true,
							className: "ui_table__col",
							render: (value) => formatDateValue(value),
						},
					]}
					dataSource={responseAdminSearchAdminsSuspense.data.admins}
					rowSelection={{
						columnWidth: 45,
						selectedRowKeys: selectedRows.map((row) => row.id),
						onChange: (_selectedRowKeys, selectedRows, _info) => setSelectedRows(selectedRows),
						preserveSelectedRowKeys: true,
					}}
					rowKey={(record) => record.id}
					scroll={{x: "max-content"}}
					pagination={{
						current: search.page,
						pageSize: search.size,
						showSizeChanger: true,
						total: responseAdminSearchAdminsSuspense.data.totalCount,
						onChange: (page, pageSize) => {
							void navigate({to: "/project/members", search: {page: page, size: pageSize}});
						},
					}}
				/>
			</WidgetContentBody>
		</Fragment>
	);
}
