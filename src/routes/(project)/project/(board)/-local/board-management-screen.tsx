import {Fragment, type Key, type MouseEventHandler, useEffect, useState} from "react";
import {useModal} from "@ebay/nice-modal-react";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import {AlertCircle, Edit, MenuAlt02, Trash} from "griddy-icons";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import {useBoardRemove} from "@/services/hooks/board/use-board-remove.ts";
import {useBoardSearchBoards} from "@/services/hooks/board/use-board-search-boards.ts";
import {useBoardUpsert} from "@/services/hooks/board/use-board-upsert.ts";
import type {BoardPageResponse} from "@/services/types/board-page-response.ts";
import type {FilterResponse} from "@/services/types/filter-response.ts";
import BoardSearchPanel from "./board-search-panel.tsx";
import ModalBoardForm from "./modal-board-form.tsx";
import {
	BOARD_FILTER_TABLE_NAME,
	buildBoardUpsertPayload,
	buildBoardSearchQueryParams,
	buildBoardSearchRequestCandidate,
	getBoardQueryInvalidationKey,
	normalizeBoardFilterDefinitions,
	setBoardFilterFieldStateValue,
	syncBoardFilterFieldStates,
	toBoardTableRows,
	type BoardFilterDefinition,
	type BoardFilterFieldStateMap,
	type BoardFormValues,
	type BoardListSearch,
	type BoardRouteConfig,
	type BoardTableRow,
} from "../board.ts";

interface BoardManagementScreenProps {
	routeConfig: BoardRouteConfig;
	search: BoardListSearch;
}

export function BoardManagementScreen(props: BoardManagementScreenProps) {
	const {routeConfig, search} = props;
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const modalBoardForm = useModal(ModalBoardForm);
	const [actionErrorMessage, setActionErrorMessage] = useState<string>();
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
	const [boardFilterFieldStates, setBoardFilterFieldStates] = useState<BoardFilterFieldStateMap>({});
	const [appliedSearchCandidate, setAppliedSearchCandidate] = useState(() => {
		return buildBoardSearchRequestCandidate({definitions: [], fieldStates: {}});
	});

	/**
	 * @description Board 목록 조회 API
	 */
	const responseBoardSearchBoards = useBoardSearchBoards(
		buildBoardSearchQueryParams({routeConfig, searchCandidate: appliedSearchCandidate, page: search.page, size: search.size}),
		{
			query: {
				retry: false,
				select: ({data}) => {
					const boardPages = data.list as BoardPageResponse[];
					return {rows: toBoardTableRows(boardPages, routeConfig), totalCount: data.totalCount};
				},
			},
		},
	);
	/**
	 * @description Board 검색 조건 정의 조회 API
	 */
	const responseFilterSearchFilters = useFilterSearchFilters(
		{table: BOARD_FILTER_TABLE_NAME, page: 1, size: 999},
		{
			query: {
				retry: false,
				select: ({data}) => {
					return normalizeBoardFilterDefinitions(data.list as FilterResponse[]);
				},
			},
		},
	);

	/**
	 * @summary 서버에서 내려온 filter definition이 바뀌면 로컬 입력 상태를 동기화합니다.
	 */
	useEffect(() => {
		setBoardFilterFieldStates((prevFieldStates) => {
			return syncBoardFilterFieldStates({previousStates: prevFieldStates, definitions: responseFilterSearchFilters.data ?? []});
		});
	}, [responseFilterSearchFilters.data]);

	/**
	 * @description Board 등록/수정 API
	 */
	const mutationBoardUpsert = useBoardUpsert({
		mutation: {
			onSuccess: async () => {
				setActionErrorMessage(undefined);
				await queryClient.invalidateQueries({queryKey: getBoardQueryInvalidationKey()});
			},
			onError: async () => {
				setActionErrorMessage(`${routeConfig.label} 저장에 실패했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.`);
				await queryClient.invalidateQueries({queryKey: getBoardQueryInvalidationKey()});
			},
		},
	});

	/**
	 * @description Board 삭제 API
	 */
	const mutationBoardRemove = useBoardRemove({mutation: {}});

	const rows = responseBoardSearchBoards.data?.rows ?? [];
	const totalCount = responseBoardSearchBoards.data?.totalCount ?? 0;
	const selectedBoardIds = selectedRowKeys
		.map((selectedRowKey) => Number(selectedRowKey))
		.filter((selectedRowKey) => Number.isInteger(selectedRowKey));
	const editColumn = {
		title: "",
		key: "edit",
		width: 56,
		render: (_value: unknown, record: BoardTableRow) => (
			<div className={clsx("rt_pbi__tableEdit")}>
				<UiButton type={"text"} icon={<Edit {...iconPreset.tertiary()} />} onClick={handleBoardEditButtonClick(record.id)} />
			</div>
		),
	};
	const tableColumns =
		routeConfig.formMode === "rich"
			? [
					editColumn,
					{title: routeConfig.gradeLabel ?? "등급", dataIndex: "grade", className: "ui_table__col", width: 160, ellipsis: true},
					{title: routeConfig.titleLabel ?? "제목", dataIndex: "title", className: "ui_table__col", width: 240, ellipsis: true},
					{
						title: routeConfig.contentLabel ?? "내용",
						dataIndex: "content",
						className: "ui_table__col",
						ellipsis: true,
						render: (value: BoardTableRow["content"]) => value || "-",
					},
				]
			: [
					editColumn,
					{title: "NAME", dataIndex: "name", className: "ui_table__col", ellipsis: true},
					{
						title: "CREATED AT",
						dataIndex: "createdAt",
						className: "ui_table__col",
						width: 220,
						render: (value: BoardTableRow["createdAt"]) => formatDateValue(value) ?? "-",
					},
				];

	const handleBoardAddButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
		const resultBoardForm = (await modalBoardForm.show({boardLabel: routeConfig.label, routeConfig})) as BoardFormValues | null;

		if (!resultBoardForm) {
			return;
		}

		mutationBoardUpsert.mutate({data: buildBoardUpsertPayload(resultBoardForm, routeConfig)});
	};

	const handleBoardEditButtonClick =
		(boardId: number): MouseEventHandler<HTMLButtonElement> =>
		async (_e) => {
			const foundRow = rows.find((row) => row.id === boardId);
			if (!foundRow) {
				setActionErrorMessage(`수정할 ${routeConfig.label} 항목을 찾을 수 없습니다. 목록을 다시 확인해 주세요.`);
				await queryClient.invalidateQueries({queryKey: getBoardQueryInvalidationKey()});
				return;
			}

			const resultBoardForm = (await modalBoardForm.show({
				boardLabel: routeConfig.label,
				routeConfig,
				initialValues:
					routeConfig.formMode === "rich"
						? {id: foundRow.id, grade: foundRow.grade ?? "", title: foundRow.title, content: foundRow.content ?? ""}
						: {id: foundRow.id, name: foundRow.name ?? foundRow.title},
			})) as BoardFormValues | null;

			if (!resultBoardForm) {
				return;
			}

			mutationBoardUpsert.mutate({data: buildBoardUpsertPayload(resultBoardForm, routeConfig)});
		};

	const handleBoardBulkDeleteButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		if (selectedBoardIds.length < 1) {
			return;
		}

		modal.error(
			modalPreset.remove({
				content: `${selectedBoardIds.length}개의 ${routeConfig.label} 항목을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
				onOk: async () => {
					const failedBoardIds: number[] = [];

					for (const boardId of selectedBoardIds) {
						try {
							await mutationBoardRemove.mutateAsync({id: boardId});
						} catch {
							failedBoardIds.push(boardId);
						}
					}

					await queryClient.invalidateQueries({queryKey: getBoardQueryInvalidationKey()});

					if (failedBoardIds.length > 0) {
						setActionErrorMessage(`${routeConfig.label} 삭제 중 일부 항목이 실패했습니다. 목록을 다시 확인해 주세요.`);
						setSelectedRowKeys(failedBoardIds);
						return;
					}

					setActionErrorMessage(undefined);
					setSelectedRowKeys([]);
				},
			}),
		);
	};

	const handleRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void responseBoardSearchBoards.refetch();
	};

	/**
	 * @summary Board 검색 조건 입력값을 갱신합니다.
	 */
	const handleFilterFieldValueChange = (definition: BoardFilterDefinition, value: unknown) => {
		setBoardFilterFieldStates((prevFieldStates) => {
			return setBoardFilterFieldStateValue({fieldStates: prevFieldStates, definition, value});
		});
	};

	/**
	 * @summary Board 검색 조건 재시도
	 */
	const handleFilterRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		void responseFilterSearchFilters.refetch();
	};

	/**
	 * @summary Board 검색 조건을 적용하고 첫 페이지로 이동합니다.
	 */
	const handleFilterSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		setAppliedSearchCandidate(
			buildBoardSearchRequestCandidate({definitions: responseFilterSearchFilters.data ?? [], fieldStates: boardFilterFieldStates}),
		);

		if (search.page === 1) {
			return;
		}

		void navigate({to: routeConfig.path, search: {page: 1, size: search.size}, replace: true});
	};

	return (
		<Fragment>
			<WidgetContentHeader title={routeConfig.label} desc={`Manage ${routeConfig.label.toLowerCase()} items for your workspace.`} />
			<WidgetContentBody>
				<div className={clsx("rt_pbi__searchPanel")}>
					<BoardSearchPanel
						definitions={responseFilterSearchFilters.data ?? []}
						fieldStates={boardFilterFieldStates}
						isLoading={responseFilterSearchFilters.isLoading}
						isError={responseFilterSearchFilters.isError}
						onRetry={handleFilterRetryButtonClick}
						onSubmit={handleFilterSubmitButtonClick}
						onValueChange={handleFilterFieldValueChange}
					/>
				</div>
				<div className={clsx("rt_pbi__tableHeader")}>
					<div className={clsx("rt_pbi__tableHeaderInfo")}>
						<span className={clsx("rt_pbi__tableHeaderCount")}>
							<MenuAlt02 {...iconPreset.tertiary()} />
							{totalCount}
						</span>
					</div>
					<div className={clsx("rt_pbi__tableHeaderActions")}>
						<UiButton type={"primary"} onClick={handleBoardAddButtonClick}>
							Add {routeConfig.label}
						</UiButton>
						<UiButton
							danger
							disabled={selectedBoardIds.length < 1 || mutationBoardRemove.isPending}
							onClick={handleBoardBulkDeleteButtonClick}
						>
							<Trash {...iconPreset.outlined()} />
							Delete
						</UiButton>
					</div>
				</div>

				{actionErrorMessage ? (
					<div className={clsx("rt_pbi__feedback")}>
						<div className={clsx("rt_pbi__feedbackText")}>
							<AlertCircle {...iconPreset.outlined()} />
							{actionErrorMessage}
						</div>
					</div>
				) : null}

				{responseBoardSearchBoards.isError ? (
					<div className={clsx("rt_pbi__empty")}>
						<UiEmpty
							description={
								<Fragment>
									{routeConfig.label} 목록을 불러오지 못했습니다.
									<br />
									잠시 후 다시 시도해 주세요.
								</Fragment>
							}
						>
							<UiButton onClick={handleRetryButtonClick}>다시 시도</UiButton>
						</UiEmpty>
					</div>
				) : null}

				{!responseBoardSearchBoards.isPending && !responseBoardSearchBoards.isError && rows.length < 1 ? (
					<div className={clsx("rt_pbi__empty")}>
						<UiEmpty
							description={
								<Fragment>
									등록된 {routeConfig.label} 항목이 없습니다.
									<br />첫 항목을 추가해 관리 화면을 시작해 보세요.
								</Fragment>
							}
						>
							<UiButton type={"primary"} onClick={handleBoardAddButtonClick}>
								Add {routeConfig.label}
							</UiButton>
						</UiEmpty>
					</div>
				) : null}

				{!responseBoardSearchBoards.isPending && !responseBoardSearchBoards.isError && rows.length > 0 ? (
					<UiTable
						rowKey={(record) => record.id}
						dataSource={rows}
						rowSelection={{
							selectedRowKeys,
							onChange: (nextSelectedRowKeys) => {
								setSelectedRowKeys(nextSelectedRowKeys);
							},
						}}
						columns={tableColumns}
						scroll={{x: "max-content"}}
						pagination={{
							current: search.page,
							pageSize: search.size,
							showSizeChanger: true,
							total: totalCount,
							onChange: (page, pageSize) => {
								void navigate({to: routeConfig.path, search: {page, size: pageSize}});
							},
						}}
					/>
				) : null}
			</WidgetContentBody>
		</Fragment>
	);
}
