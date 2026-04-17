import {Fragment, type Key, type MouseEventHandler, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {useModal} from "@ebay/nice-modal-react";
import {useQueryClient} from "@tanstack/react-query";
import clsx from "clsx";
import {z} from "zod";
import {MenuAlt02, Edit, Trash, AlertCircle} from "griddy-icons";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {useTenantRemove} from "@/services/hooks/tenant/use-tenant-remove.ts";
import {useTenantSearchTenants} from "@/services/hooks/tenant/use-tenant-search-tenants.ts";
import {useTenantUpsert} from "@/services/hooks/tenant/use-tenant-upsert.ts";
import type {TenantResponse} from "@/services/types/tenant-response.ts";
import ModalTenantForm from "./-local/modal-tenant-form.tsx";
import {
	buildTenantUpsertPayload,
	getTenantQueryInvalidationKey,
	hasSelectedTenantRows,
	isDuplicateTenantName,
	normalizeTenantListSearch,
	TENANT_DEFAULT_PAGE,
	TENANT_DEFAULT_PAGE_SIZE,
	toFailedTenantSelectionKeys,
	toSelectedTenantIds,
	toTenantTableRows,
	type TenantFormValues,
	type TenantTableRow,
} from "./tenant.ts";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(tenant)/tenant/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(TENANT_DEFAULT_PAGE).catch(TENANT_DEFAULT_PAGE),
		size: z.coerce.number().int().min(1).max(100).default(TENANT_DEFAULT_PAGE_SIZE).catch(TENANT_DEFAULT_PAGE_SIZE),
	}),
});

export function RouteComponent() {
	const TENANT_ACTION_COLUMN_WIDTH = 15;
	const {useSearch} = Route;
	const search = normalizeTenantListSearch(useSearch());
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const modalTenantForm = useModal(ModalTenantForm);
	const [actionErrorMessage, setActionErrorMessage] = useState<string>();
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

	/**
	 * @description Tenant 목록 조회 API
	 */
	const responseTenantSearchTenants = useTenantSearchTenants(
		{page: search.page, size: search.size},
		{
			query: {
				retry: false,
				select: ({data}) => {
					const tenantList = data.list as TenantResponse[];
					return {rows: toTenantTableRows(tenantList), totalCount: data.totalCount};
				},
			},
		},
	);

	/**
	 * @description Tenant 등록/수정 API
	 */
	const mutationTenantUpsert = useTenantUpsert({
		mutation: {
			onSuccess: async () => {
				setActionErrorMessage(undefined);
				await queryClient.invalidateQueries({queryKey: getTenantQueryInvalidationKey()});
			},
			onError: async () => {
				setActionErrorMessage("Tenant 저장에 실패했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.");
				await queryClient.invalidateQueries({queryKey: getTenantQueryInvalidationKey()});
			},
		},
	});

	/**
	 * @description Tenant 삭제 API
	 */
	const mutationTenantRemove = useTenantRemove({mutation: {}});

	const rows = responseTenantSearchTenants.data?.rows ?? [];
	const totalCount = responseTenantSearchTenants.data?.totalCount ?? 0;
	const selectedTenantIds = toSelectedTenantIds(selectedRowKeys);
	const canBulkDelete = hasSelectedTenantRows(selectedRowKeys);
	const editColumn = {
		title: "",
		key: "edit",
		width: TENANT_ACTION_COLUMN_WIDTH,
		className: "rt_pstni__tableColEdit",
		onHeaderCell: () => ({
			style: {width: TENANT_ACTION_COLUMN_WIDTH, minWidth: TENANT_ACTION_COLUMN_WIDTH, maxWidth: TENANT_ACTION_COLUMN_WIDTH},
		}),
		onCell: () => ({
			style: {width: TENANT_ACTION_COLUMN_WIDTH, minWidth: TENANT_ACTION_COLUMN_WIDTH, maxWidth: TENANT_ACTION_COLUMN_WIDTH},
		}),
		render: (_value: unknown, record: TenantTableRow) => (
			<span className={clsx("ui_table__colEdit", "rt_pstni__tableEdit")}>
				<UiButton type={"text"} icon={<Edit {...iconPreset.tertiary()} />} onClick={handleTenantEditButtonClick(record.id)} />
			</span>
		),
	};

	const handleTenantAddButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
		const resultTenantForm = (await modalTenantForm.show({rows})) as TenantFormValues | null;

		if (!resultTenantForm) {
			return;
		}

		if (isDuplicateTenantName(rows, resultTenantForm.name)) {
			setActionErrorMessage("이미 사용 중인 Tenant 이름입니다.");
			return;
		}

		mutationTenantUpsert.mutate({data: buildTenantUpsertPayload(resultTenantForm)});
	};

	const handleTenantEditButtonClick =
		(tenantId: number): MouseEventHandler<HTMLButtonElement> =>
		async (_e) => {
			const foundRow = rows.find((row) => row.id === tenantId);
			if (!foundRow) {
				setActionErrorMessage("수정할 Tenant를 찾을 수 없습니다. 목록을 다시 확인해 주세요.");
				await queryClient.invalidateQueries({queryKey: getTenantQueryInvalidationKey()});
				return;
			}

			const resultTenantForm = (await modalTenantForm.show({
				initialValues: {id: foundRow.id, name: foundRow.name},
				rows,
			})) as TenantFormValues | null;

			if (!resultTenantForm) {
				return;
			}

			if (isDuplicateTenantName(rows, resultTenantForm.name, tenantId)) {
				setActionErrorMessage("이미 사용 중인 Tenant 이름입니다.");
				return;
			}

			mutationTenantUpsert.mutate({data: buildTenantUpsertPayload(resultTenantForm)});
		};

	const handleTenantBulkDeleteButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		if (!canBulkDelete) {
			return;
		}

		modal.error(
			modalPreset.remove({
				content: `${selectedTenantIds.length}개의 Tenant를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
				onOk: async () => {
					const failedTenantIds: number[] = [];

					for (const tenantId of selectedTenantIds) {
						try {
							await mutationTenantRemove.mutateAsync({id: tenantId});
						} catch {
							failedTenantIds.push(tenantId);
						}
					}

					await queryClient.invalidateQueries({queryKey: getTenantQueryInvalidationKey()});

					if (failedTenantIds.length > 0) {
						setActionErrorMessage("Tenant 삭제 중 일부 항목이 실패했습니다. 목록을 다시 확인해 주세요.");
						setSelectedRowKeys(toFailedTenantSelectionKeys(failedTenantIds));
						return;
					}

					setActionErrorMessage(undefined);
					setSelectedRowKeys([]);
				},
			}),
		);
	};

	const handleRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void responseTenantSearchTenants.refetch();
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Tenant"} desc="Manage workspace tenant records and lifecycle actions." />
			<WidgetContentBody>
				<div className={clsx("rt_pstni__content")}>
					<div className={clsx("rt_pstni__header")}>
						<div className={clsx("rt_pstni__headerMeta")}>
							<MenuAlt02 {...iconPreset.tertiary()} />
							<span>{totalCount}</span>
						</div>
						<div className={clsx("rt_pstni__headerActions")}>
							<UiButton type={"primary"} onClick={handleTenantAddButtonClick}>
								Add Tenant
							</UiButton>
							<UiButton danger disabled={!canBulkDelete || mutationTenantRemove.isPending} onClick={handleTenantBulkDeleteButtonClick}>
								<Trash {...iconPreset.outlined()} />
								Delete
							</UiButton>
						</div>
					</div>

					{actionErrorMessage ? (
						<div className={clsx("rt_pstni__feedback")}>
							<div className={clsx("rt_pstni__feedbackText")}>
								<AlertCircle {...iconPreset.outlined()} />
								&nbsp;{actionErrorMessage}
							</div>
						</div>
					) : null}

					{responseTenantSearchTenants.isError ? (
						<div className={clsx("rt_pstni__empty")}>
							<UiEmpty
								description={
									<Fragment>
										Tenant 목록을 불러오지 못했습니다.
										<br />
										잠시 후 다시 시도해 주세요.
									</Fragment>
								}
							>
								<UiButton onClick={handleRetryButtonClick}>다시 시도</UiButton>
							</UiEmpty>
						</div>
					) : null}

					{!responseTenantSearchTenants.isPending && !responseTenantSearchTenants.isError && rows.length < 1 ? (
						<div className={clsx("rt_pstni__empty")}>
							<UiEmpty
								description={
									<Fragment>
										등록된 Tenant가 없습니다.
										<br />첫 Tenant를 추가해 관리 화면을 시작해 보세요.
									</Fragment>
								}
							>
								<UiButton type={"primary"} onClick={handleTenantAddButtonClick}>
									Add Tenant
								</UiButton>
							</UiEmpty>
						</div>
					) : null}

					{!responseTenantSearchTenants.isPending && !responseTenantSearchTenants.isError && rows.length > 0 ? (
						<UiTable
							rowKey={(record) => record.id}
							dataSource={rows}
							tableLayout={"fixed"}
							rowSelection={{
								columnWidth: TENANT_ACTION_COLUMN_WIDTH,
								selectedRowKeys,
								onChange: (nextSelectedRowKeys) => {
									setSelectedRowKeys(nextSelectedRowKeys);
								},
							}}
							columns={[
								editColumn,
								{title: "ID", dataIndex: "id", className: "ui_table__col", width: 45},
								{title: "NAME", dataIndex: "name", className: "ui_table__col", width: 220, ellipsis: true},
								{title: "CREATOR ID", dataIndex: "creatorId", className: "ui_table__col", width: 220},
								{
									title: "CREATED AT",
									dataIndex: "createdAt",
									className: "ui_table__col",
									width: 350,
									render: (value) => formatDateValue(value) ?? "-",
								},
							]}
							scroll={{x: "max-content"}}
							pagination={{
								current: search.page,
								pageSize: search.size,
								showSizeChanger: true,
								total: totalCount,
								onChange: (page, pageSize) => {
									void navigate({to: "/project/settings/tenant", search: {page, size: pageSize}});
								},
							}}
						/>
					) : null}

					{responseTenantSearchTenants.isPending ? <UiTypoText type={"secondary"}>Tenant 목록을 불러오는 중입니다.</UiTypoText> : null}
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
