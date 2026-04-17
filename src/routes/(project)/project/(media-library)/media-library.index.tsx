import {Activity, Fragment, type ChangeEventHandler, type MouseEventHandler, useEffect, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import {useModal} from "@ebay/nice-modal-react";
import {useQueryClient} from "@tanstack/react-query";
import {z} from "zod";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCheckbox from "@/components/ui/checkbox/ui-checkbox.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiImagePreview from "@/components/ui/image/ui-image-preview.tsx";
import UiInputSearch, {type UiInputSearchProps} from "@/components/ui/input/ui-input-search.tsx";
import UiPagination, {type UiPaginationProps} from "@/components/ui/pagination/ui-pagination.tsx";
import UiPopover, {type AntDesignPopoverProps} from "@/components/ui/popover/ui-popover.tsx";
import UiSegmented, {type AntDesignSegmentedProps} from "@/components/ui/segmented/ui-segmented.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import {Attachment, Download, Grid, ListBulleted, MenuAlt02, MoreVertical, Trash} from "griddy-icons";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {useFilterSearchFilters} from "@/services/hooks/filter/use-filter-search-filters.ts";
import {useMediaLibraryRemove} from "@/services/hooks/media-library/use-media-library-remove.ts";
import {useMediaLibrarySearchMediaLibrary} from "@/services/hooks/media-library/use-media-library-search-media-library.ts";
import {
	buildMediaLibrarySearchQueryParams,
	buildMediaLibrarySearchRequestCandidate,
	getDeleteBlockedMediaLibraryAsset,
	filterMediaLibraryAssets,
	formatMediaLibraryAssetSize,
	MEDIA_LIBRARY_DEFAULT_PAGE,
	MEDIA_LIBRARY_DEFAULT_COLUMN_NAME,
	getMediaLibraryQueryInvalidationKey,
	getSelectedMediaLibraryAssets,
	isAllMediaLibraryAssetsSelected,
	isMediaLibraryAssetPreviewable,
	MEDIA_LIBRARY_DEFAULT_PAGE_SIZE,
	normalizeMediaLibraryFilterDefinitions,
	normalizeMediaLibraryListSearch,
	normalizeMediaLibraryAssets,
	setMediaLibraryFilterFieldStateValue,
	syncMediaLibraryFilterFieldStates,
	type MediaLibraryAsset,
	type MediaLibraryFilterDefinition,
	type MediaLibraryFilterFieldStateMap,
} from "./media-library.ts";
import MediaLibrarySearchPanel from "./-local/media-library-search-panel.tsx";
import ModalMediaAssetUpload from "./-local/modal-media-asset-upload.tsx";
import "./media-library.css";

export const Route = createFileRoute("/(project)/project/(media-library)/media-library/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(MEDIA_LIBRARY_DEFAULT_PAGE).catch(MEDIA_LIBRARY_DEFAULT_PAGE),
		size: z.coerce.number().int().min(1).max(100).default(MEDIA_LIBRARY_DEFAULT_PAGE_SIZE).catch(MEDIA_LIBRARY_DEFAULT_PAGE_SIZE),
		searchKeyword: z.string().optional(),
	}),
});

/**
 * @summary 미디어 라이브러리 화면
 */
export function RouteComponent() {
	const {useSearch} = Route;
	const search = normalizeMediaLibraryListSearch(useSearch());
	const navigate = useNavigate();
	const modalMediaAssetUpload = useModal(ModalMediaAssetUpload);
	const queryClient = useQueryClient();
	const [searchInputValue, setSearchInputValue] = useState(search.searchKeyword ?? "");
	const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
	const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");
	const [previewImageUrl, setPreviewImageUrl] = useState<string>();
	const [isImagePreviewVisible, setImagePreviewVisible] = useState(false);
	const [actionErrorMessage, setActionErrorMessage] = useState<string>();
	const [openedAssetActionMenuId, setOpenedAssetActionMenuId] = useState<number>();
	const [mediaLibraryFilterFieldStates, setMediaLibraryFilterFieldStates] = useState<MediaLibraryFilterFieldStateMap>({});
	const [appliedSearchCandidate, setAppliedSearchCandidate] = useState(() => {
		return buildMediaLibrarySearchRequestCandidate({definitions: [], fieldStates: {}});
	});

	/**
	 * @summary route searchKeyword 변경 시 검색 입력 표시값을 동기화합니다.
	 */
	useEffect(() => {
		setSearchInputValue(search.searchKeyword ?? "");
	}, [search.searchKeyword]);

	/**
	 * @description 미디어 라이브러리 목록 조회 API
	 */
	const responseMediaLibrarySearchMediaLibrary = useMediaLibrarySearchMediaLibrary(
		buildMediaLibrarySearchQueryParams({searchCandidate: appliedSearchCandidate, page: search.page, size: search.size}),
		{
			query: {
				retry: false,
				select: (data) => {
					return {assets: normalizeMediaLibraryAssets(data.data.list), totalCount: data.data.totalCount};
				},
			},
		},
	);

	/**
	 * @description Media Library 검색 조건 정의 조회 API
	 */
	const responseFilterSearchFilters = useFilterSearchFilters(
		{table: MEDIA_LIBRARY_DEFAULT_COLUMN_NAME, page: 1, size: 999},
		{
			query: {
				retry: false,
				select: (data) => {
					return normalizeMediaLibraryFilterDefinitions(data.data.list);
				},
			},
		},
	);

	/**
	 * @summary 서버에서 내려온 filter definition이 바뀌면 로컬 입력 상태를 동기화합니다.
	 */
	useEffect(() => {
		setMediaLibraryFilterFieldStates((prevFieldStates) => {
			return syncMediaLibraryFilterFieldStates({previousStates: prevFieldStates, definitions: responseFilterSearchFilters.data ?? []});
		});
	}, [responseFilterSearchFilters.data]);

	/**
	 * @description 미디어 라이브러리 삭제 API
	 */
	const mutationMediaLibraryRemove = useMediaLibraryRemove({
		mutation: {
			meta: {successToast: null},
			onSuccess: () => {
				void queryClient.invalidateQueries({queryKey: getMediaLibraryQueryInvalidationKey()});
			},
		},
	});

	/**
	 * @summary 업로드 모달 열기
	 */
	const handleAddNewAssetsButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		setActionErrorMessage(undefined);
		setOpenedAssetActionMenuId(undefined);
		void modalMediaAssetUpload.show();
	};

	/**
	 * @summary 에셋 선택 토글
	 */
	const handleAssetSelectToggle = (assetId: number) => {
		setSelectedAssetIds((prevSelectedAssetIds) => {
			if (prevSelectedAssetIds.includes(assetId)) {
				return prevSelectedAssetIds.filter((prevSelectedAssetId) => prevSelectedAssetId !== assetId);
			}

			return [...prevSelectedAssetIds, assetId];
		});
	};

	/**
	 * @summary 에셋 아이템 클릭 시 이미지 미리보기를 엽니다.
	 */
	const handleAssetItemClick = (assetItem: MediaLibraryAsset) => {
		if (!isMediaLibraryAssetPreviewable(assetItem)) {
			return;
		}

		setPreviewImageUrl(assetItem.url);
		setImagePreviewVisible(true);
	};

	/**
	 * @summary 미디어 검색어 변경
	 */
	const handleSearchKeywordChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		setSearchInputValue(event.target.value);
		setOpenedAssetActionMenuId(undefined);
	};

	/**
	 * @summary 미디어 검색어 제출
	 */
	const handleSearchKeywordSubmit: UiInputSearchProps["onSearch"] = (value, _event, _info) => {
		const normalizedSearchKeyword = value.trim();
		setOpenedAssetActionMenuId(undefined);

		void navigate({
			to: "/project/media-library",
			search: {
				page: MEDIA_LIBRARY_DEFAULT_PAGE,
				size: search.size,
				...(normalizedSearchKeyword.length > 0 ? {searchKeyword: normalizedSearchKeyword} : {}),
			},
		});
	};

	/**
	 * @summary Media Library 검색 조건 입력값을 갱신합니다.
	 */
	const handleFilterFieldValueChange = (definition: MediaLibraryFilterDefinition, value: unknown) => {
		setMediaLibraryFilterFieldStates((prevFieldStates) => {
			return setMediaLibraryFilterFieldStateValue({fieldStates: prevFieldStates, definition, value});
		});
	};

	/**
	 * @summary Media Library 검색 조건 재시도
	 */
	const handleFilterRetryButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		void responseFilterSearchFilters.refetch();
	};

	/**
	 * @summary Media Library 검색 조건 payload 후보를 console에 기록합니다.
	 */
	const handleFilterSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		setOpenedAssetActionMenuId(undefined);
		setAppliedSearchCandidate(
			buildMediaLibrarySearchRequestCandidate({
				definitions: responseFilterSearchFilters.data ?? [],
				fieldStates: mediaLibraryFilterFieldStates,
			}),
		);

		if (search.page === MEDIA_LIBRARY_DEFAULT_PAGE) {
			return;
		}

		void navigate({
			to: "/project/media-library",
			search: {page: MEDIA_LIBRARY_DEFAULT_PAGE, size: search.size, ...(search.searchKeyword ? {searchKeyword: search.searchKeyword} : {})},
			replace: true,
		});
	};

	/**
	 * @summary 필터링된 에셋 전체 선택/해제
	 */
	const handleSelectAllButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (!responseMediaLibrarySearchMediaLibrary.data) {
			return;
		}

		const filteredAssetIds = filterMediaLibraryAssets(responseMediaLibrarySearchMediaLibrary.data.assets, search.searchKeyword ?? "").map(
			(assetItem) => assetItem.id,
		);
		const isAllSelected =
			filteredAssetIds.length > 0 && filteredAssetIds.every((filteredAssetId) => selectedAssetIds.includes(filteredAssetId));

		if (isAllSelected) {
			setSelectedAssetIds((prevSelectedAssetIds) => {
				return prevSelectedAssetIds.filter((prevSelectedAssetId) => !filteredAssetIds.includes(prevSelectedAssetId));
			});
			return;
		}

		setSelectedAssetIds((prevSelectedAssetIds) => {
			const nextSelectedAssetIds = [...prevSelectedAssetIds];
			for (let index = 0; index < filteredAssetIds.length; index += 1) {
				const filteredAssetId = filteredAssetIds[index] as number;
				if (!nextSelectedAssetIds.includes(filteredAssetId)) {
					nextSelectedAssetIds.push(filteredAssetId);
				}
			}
			return nextSelectedAssetIds;
		});
	};

	/**
	 * @summary 에셋 삭제 실행
	 */
	const removeMediaLibraryAssets = async (assets: MediaLibraryAsset[]) => {
		setOpenedAssetActionMenuId(undefined);

		const deleteBlockedAsset = getDeleteBlockedMediaLibraryAsset(assets);
		if (deleteBlockedAsset) {
			setActionErrorMessage(`참조 중인 자산은 삭제할 수 없습니다: ${deleteBlockedAsset.name}`);
			return;
		}

		try {
			for (let index = 0; index < assets.length; index += 1) {
				const asset = assets[index] as MediaLibraryAsset;
				await mutationMediaLibraryRemove.mutateAsync({id: asset.id});
			}

			setActionErrorMessage(undefined);
			setSelectedAssetIds([]);
		} catch (_error) {
			setActionErrorMessage("서버에서 삭제를 허용하지 않았습니다. 목록은 유지됩니다.");
		}
	};

	/**
	 * @summary 선택된 에셋을 삭제합니다.
	 */
	const handleDeleteSelectedButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (selectedAssetIds.length < 1) {
			return;
		}

		if (!responseMediaLibrarySearchMediaLibrary.data) {
			return;
		}

		const selectedAssets = getSelectedMediaLibraryAssets({assets: responseMediaLibrarySearchMediaLibrary.data.assets, selectedAssetIds});
		void removeMediaLibraryAssets(selectedAssets);
	};

	/**
	 * @summary 단건 에셋 삭제
	 */
	const handleAssetDeleteButtonClick = (assetId: number) => {
		const foundAsset = responseMediaLibrarySearchMediaLibrary.data?.assets.find((asset) => asset.id === assetId);
		if (!foundAsset) {
			return;
		}

		void removeMediaLibraryAssets([foundAsset]);
	};

	/**
	 * @summary 단건 에셋 다운로드
	 */
	const handleAssetDownloadButtonClick = (assetItem: MediaLibraryAsset) => {
		setOpenedAssetActionMenuId(undefined);
		window.open(assetItem.url, "_blank", "noopener,noreferrer");
	};

	/**
	 * @summary 미디어 뷰 모드 변경
	 */
	const handleAssetViewModeChange: AntDesignSegmentedProps["onChange"] = (value) => {
		setAssetViewMode(value as "grid" | "list");
		setOpenedAssetActionMenuId(undefined);
	};

	/**
	 * @summary 에셋 액션 메뉴 열림 상태 변경
	 */
	const createHandleAssetActionMenuOpenChange =
		(assetId: number): NonNullable<AntDesignPopoverProps["onOpenChange"]> =>
		(open) => {
			setOpenedAssetActionMenuId(open ? assetId : undefined);
		};

	/**
	 * @summary 미디어 라이브러리 페이지 변경
	 */
	const handlePaginationChange: UiPaginationProps["onChange"] = (page, pageSize) => {
		setOpenedAssetActionMenuId(undefined);

		void navigate({
			to: "/project/media-library",
			search: {page, size: pageSize, ...(search.searchKeyword ? {searchKeyword: search.searchKeyword} : {})},
		});
	};

	return (
		<Fragment>
			<WidgetContentHeader title="Media Library" desc="View and manage media assets for your content.">
				<UiButton type="primary" onClick={handleAddNewAssetsButtonClick}>
					Add new assets
				</UiButton>
			</WidgetContentHeader>
			<WidgetContentBody>
				{(() => {
					const filteredAssetItems = responseMediaLibrarySearchMediaLibrary.data
						? filterMediaLibraryAssets(responseMediaLibrarySearchMediaLibrary.data.assets, search.searchKeyword ?? "")
						: [];
					const isAllFilteredAssetsSelected = isAllMediaLibraryAssetsSelected({assets: filteredAssetItems, selectedAssetIds});

					return (
						<div className={clsx("rt_pmli__root")}>
							<div className={clsx("rt_pmli__toolbar")}>
								<div className={clsx("rt_pmli__searchRow")}>
									<div className={clsx("rt_pmli__search")}>
										<UiInputSearch
											variant="filled"
											allowClear
											placeholder="Search assets"
											value={searchInputValue}
											onChange={handleSearchKeywordChange}
											onSearch={handleSearchKeywordSubmit}
										/>
									</div>
								</div>
								<div className={clsx("rt_pmli__viewMode")}>
									<UiSegmented
										value={assetViewMode}
										options={[
											{label: <ListBulleted {...iconPreset.tertiary()} />, value: "list"},
											{label: <Grid {...iconPreset.tertiary()} />, value: "grid"},
										]}
										onChange={handleAssetViewModeChange}
									/>
								</div>
							</div>

							<div className={clsx("rt_pmli__searchPanel")}>
								<MediaLibrarySearchPanel
									definitions={responseFilterSearchFilters.data ?? []}
									fieldStates={mediaLibraryFilterFieldStates}
									isLoading={responseFilterSearchFilters.isLoading}
									isError={responseFilterSearchFilters.isError}
									onRetry={handleFilterRetryButtonClick}
									onSubmit={handleFilterSubmitButtonClick}
									onValueChange={handleFilterFieldValueChange}
								/>
							</div>

							<div className={clsx("rt_pmli__selectionRow")}>
								<div className={clsx("rt_pmli__selectionCount")}>
									<MenuAlt02 {...iconPreset.tertiary()} />
									<span>{filteredAssetItems.length}</span>
								</div>
								<div className={clsx("rt_pmli__selectionActions")}>
									<UiButton onClick={handleSelectAllButtonClick}>{isAllFilteredAssetsSelected ? "Unselect All" : "Select All"}</UiButton>
									<UiButton
										danger
										icon={<Trash {...iconPreset.outlined()} />}
										onClick={handleDeleteSelectedButtonClick}
										disabled={selectedAssetIds.length < 1 || mutationMediaLibraryRemove.isPending}
									>
										Delete
									</UiButton>
								</div>
							</div>

							<Activity mode={actionErrorMessage ? "visible" : "hidden"}>
								<div className={clsx("rt_pmli__status", "rt_pmli__status--error")}>{actionErrorMessage}</div>
							</Activity>

							<Activity mode={responseMediaLibrarySearchMediaLibrary.isLoading ? "visible" : "hidden"}>
								<div className={clsx("rt_pmli__empty")}>
									<UiTypoText type="secondary">Loading media assets...</UiTypoText>
								</div>
							</Activity>

							<Activity
								mode={
									!responseMediaLibrarySearchMediaLibrary.isLoading && filteredAssetItems.length > 0 && assetViewMode === "grid"
										? "visible"
										: "hidden"
								}
							>
								<div className={clsx("rt_pmli__assetGrid")}>
									{filteredAssetItems.map((assetItem) => {
										const isSelected = selectedAssetIds.includes(assetItem.id);
										const isPreviewable = isMediaLibraryAssetPreviewable(assetItem);
										const assetPopoverContent = (
											<div className={clsx("rt_pmli__assetMenu")}>
												<button
													type="button"
													className={clsx("rt_pmli__assetMenuItem")}
													onClick={(event) => {
														event.stopPropagation();
														handleAssetDownloadButtonClick(assetItem);
													}}
												>
													<Download {...iconPreset.outlined()} />
													<span>Download</span>
												</button>
												<button
													type="button"
													className={clsx("rt_pmli__assetMenuItem", "rt_pmli__assetMenuItem--danger")}
													onClick={(event) => {
														event.stopPropagation();
														handleAssetDeleteButtonClick(assetItem.id);
													}}
												>
													<Trash {...iconPreset.outlined()} />
													<span>Delete</span>
												</button>
											</div>
										);

										return (
											<div key={assetItem.path} className={clsx("rt_pmli__assetCard", isSelected && "rt_pmli__assetCard--selected")}>
												<button
													type="button"
													className={clsx("rt_pmli__assetCardButton", isPreviewable && "rt_pmli__assetCardButton--previewable")}
													disabled={!isPreviewable}
													onClick={() => {
														handleAssetItemClick(assetItem);
													}}
												>
													<div className={clsx("rt_pmli__assetCardPreview")}>
														<Activity mode={isPreviewable ? "visible" : "hidden"}>
															<div className={clsx("rt_pmli__assetCardImage")} style={{backgroundImage: `url(${assetItem.url})`}} />
														</Activity>
														<Activity mode={isPreviewable ? "hidden" : "visible"}>
															<div className={clsx("rt_pmli__assetCardFileType")}>
																<Attachment {...iconPreset.outlined({size: 46})} />
																<UiTypoText strong>{assetItem.ext.toUpperCase() || "FILE"}</UiTypoText>
															</div>
														</Activity>
													</div>
													<div className={clsx("rt_pmli__assetCardInfo")}>
														<UiTypoText strong>{assetItem.name}</UiTypoText>
														<UiTypoText type="secondary">{formatMediaLibraryAssetSize(assetItem.size)}</UiTypoText>
														<UiTypoText type="secondary">{`#${assetItem.id} · ${assetItem.path}`}</UiTypoText>
													</div>
												</button>
												<div className={clsx("rt_pmli__assetCardCheckbox")}>
													<UiCheckbox
														checked={isSelected}
														onChange={() => {
															handleAssetSelectToggle(assetItem.id);
														}}
													/>
												</div>
												<div className={clsx("rt_pmli__assetCardMore")}>
													<UiPopover
														trigger="click"
														placement="bottomRight"
														content={assetPopoverContent}
														arrow={false}
														destroyOnHidden
														open={openedAssetActionMenuId === assetItem.id}
														onOpenChange={createHandleAssetActionMenuOpenChange(assetItem.id)}
														classNames={{root: clsx("rt_pmli__assetMenuPopover")}}
													>
														<UiButton type="text" icon={<MoreVertical {...iconPreset.outlined()} size={20} />} />
													</UiPopover>
												</div>
											</div>
										);
									})}
								</div>
							</Activity>

							<Activity
								mode={
									!responseMediaLibrarySearchMediaLibrary.isLoading && filteredAssetItems.length > 0 && assetViewMode === "list"
										? "visible"
										: "hidden"
								}
							>
								<div className={clsx("rt_pmli__assetList")}>
									{filteredAssetItems.map((assetItem) => {
										const isSelected = selectedAssetIds.includes(assetItem.id);
										const isPreviewable = isMediaLibraryAssetPreviewable(assetItem);
										const assetPopoverContent = (
											<div className={clsx("rt_pmli__assetMenu")}>
												<button
													type="button"
													className={clsx("rt_pmli__assetMenuItem")}
													onClick={(event) => {
														event.stopPropagation();
														handleAssetDownloadButtonClick(assetItem);
													}}
												>
													<Download {...iconPreset.outlined()} />
													<span>Download</span>
												</button>
												<button
													type="button"
													className={clsx("rt_pmli__assetMenuItem", "rt_pmli__assetMenuItem--danger")}
													onClick={(event) => {
														event.stopPropagation();
														handleAssetDeleteButtonClick(assetItem.id);
													}}
												>
													<Trash {...iconPreset.outlined()} />
													<span>Delete</span>
												</button>
											</div>
										);

										return (
											<div
												key={assetItem.path}
												className={clsx("rt_pmli__assetListItem", isSelected && "rt_pmli__assetListItem--selected")}
											>
												<div className={clsx("rt_pmli__assetListCheck")}>
													<UiCheckbox
														checked={isSelected}
														onChange={() => {
															handleAssetSelectToggle(assetItem.id);
														}}
													/>
												</div>
												<button
													type="button"
													className={clsx("rt_pmli__assetListMainButton", isPreviewable && "rt_pmli__assetListMainButton--previewable")}
													disabled={!isPreviewable}
													onClick={() => {
														handleAssetItemClick(assetItem);
													}}
												>
													<div className={clsx("rt_pmli__assetListThumb")}>
														<Activity mode={isPreviewable ? "visible" : "hidden"}>
															<div className={clsx("rt_pmli__assetListImage")} style={{backgroundImage: `url(${assetItem.url})`}} />
														</Activity>
														<Activity mode={isPreviewable ? "hidden" : "visible"}>
															<Attachment {...iconPreset.outlined({size: 26})} />
														</Activity>
													</div>
													<div className={clsx("rt_pmli__assetListInfo")}>
														<UiTypoText strong>{assetItem.name}</UiTypoText>
														<UiTypoText type="secondary">{formatMediaLibraryAssetSize(assetItem.size)}</UiTypoText>
														<UiTypoText type="secondary">{`#${assetItem.id} · ${assetItem.path}`}</UiTypoText>
													</div>
												</button>
												<div className={clsx("rt_pmli__assetListMore")}>
													<UiPopover
														trigger="click"
														placement="bottomRight"
														content={assetPopoverContent}
														arrow={false}
														destroyOnHidden
														open={openedAssetActionMenuId === assetItem.id}
														onOpenChange={createHandleAssetActionMenuOpenChange(assetItem.id)}
														classNames={{root: clsx("rt_pmli__assetMenuPopover")}}
													>
														<UiButton type="text" icon={<MoreVertical {...iconPreset.tertiary()} size={20} />} />
													</UiPopover>
												</div>
											</div>
										);
									})}
								</div>
							</Activity>

							<Activity mode={!responseMediaLibrarySearchMediaLibrary.isLoading && filteredAssetItems.length < 1 ? "visible" : "hidden"}>
								<div className={clsx("rt_pmli__empty")}>
									<UiEmpty description="No assets found" />
								</div>
							</Activity>

							<div className={clsx("rt_pmli__pageActions")}>
								<UiPagination
									current={search.page}
									pageSize={search.size}
									total={
										typeof responseMediaLibrarySearchMediaLibrary.data?.totalCount === "number"
											? responseMediaLibrarySearchMediaLibrary.data.totalCount
											: filteredAssetItems.length
									}
									showSizeChanger={false}
									onChange={handlePaginationChange}
								/>
							</div>

							<UiImagePreview
								src={previewImageUrl}
								style={{display: "none"}}
								preview={{open: isImagePreviewVisible, onOpenChange: (visible) => setImagePreviewVisible(visible)}}
							/>
						</div>
					);
				})()}
			</WidgetContentBody>
		</Fragment>
	);
}
