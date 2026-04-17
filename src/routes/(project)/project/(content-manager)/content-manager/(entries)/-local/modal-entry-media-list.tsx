import {Activity, useState} from "react";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import clsx from "clsx";
import {Attachment} from "griddy-icons";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCheckbox from "@/components/ui/checkbox/ui-checkbox.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTag from "@/components/ui/tag/ui-tag.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {useMediaLibrarySearchMediaLibrary} from "@/services/hooks/media-library/use-media-library-search-media-library.ts";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {
	filterMediaLibraryAssets,
	formatMediaLibraryAssetSize,
	getMediaLibraryPageCount,
	getPagedMediaLibraryAssets,
	isMediaLibraryAssetPreviewable,
	normalizeMediaLibraryAssets,
	type MediaLibraryAsset,
} from "@/routes/(project)/project/(media-library)/media-library.ts";
import "./modal-entry-media-list.css";

/**
 * @summary 엔트리 MEDIA 미리보기 모달 props
 * @property columnTitle 대상 컬럼 제목
 * @property mediaFiles 미리보기 대상 MEDIA 파일 목록
 * @property mode 미리보기 모드 식별자
 */
interface ModalEntryMediaListPreviewProps {
	columnTitle: string;
	mediaFiles: UpsertMediaFileRequest[];
	mode?: "preview";
}

/**
 * @summary 엔트리 MEDIA 선택 모달 props
 * @property columnTitle 대상 컬럼 제목
 * @property mode 미디어 선택 모드 식별자
 * @property selectedMediaFiles 현재 선택된 MEDIA 파일 목록
 */
interface ModalEntryMediaListSelectProps {
	columnTitle: string;
	mode: "select";
	selectedMediaFiles?: UpsertMediaFileRequest[];
}

/**
 * @summary 엔트리 MEDIA 모달 props
 */
type ModalEntryMediaListProps = ModalEntryMediaListPreviewProps | ModalEntryMediaListSelectProps;

const IMAGE_FILE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"] as const;
const ENTRY_MEDIA_PICKER_PAGE_SIZE = 8;

/**
 * @summary MEDIA 파일이 이미지 형식인지 판별
 */
const isImageMediaFile = (mediaFile: UpsertMediaFileRequest) => {
	if (mediaFile.mimeType.startsWith("image/")) {
		return true;
	}

	const fileExt = mediaFile.ext.toLowerCase().replace(".", "");
	if (IMAGE_FILE_EXTENSIONS.includes(fileExt as (typeof IMAGE_FILE_EXTENSIONS)[number])) {
		return true;
	}

	return false;
};

/**
 * @summary 미디어 라이브러리 자산을 엔트리 MEDIA 파일 형식으로 변환
 */
export const toSelectableMediaFile = (asset: MediaLibraryAsset): UpsertMediaFileRequest => {
	return {
		url: asset.url,
		path: asset.path,
		mimeType: asset.mimeType,
		name: asset.name,
		size: asset.size,
		ext: asset.ext,
		provider: asset.provider,
	};
};

/**
 * @summary 엔트리 MEDIA 미리보기/선택 모달
 */
export const ModalEntryMediaList = (props: ModalEntryMediaListProps) => {
	const modal = useModal();
	const [searchKeyword, setSearchKeyword] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedAssetPaths, setSelectedAssetPaths] = useState<string[]>(
		props.mode === "select" && props.selectedMediaFiles ? props.selectedMediaFiles.map((mediaFile) => mediaFile.path) : [],
	);
	const isSelectMode = props.mode === "select";
	const previewMediaFiles = props.mode === "select" ? [] : props.mediaFiles;

	/**
	 * @description 미디어 라이브러리 목록 조회 API
	 */
	const responseMediaLibrarySearchMediaLibrary = useMediaLibrarySearchMediaLibrary(
		{includePrivate: true, page: 1, size: 100},
		{
			query: {
				enabled: isSelectMode,
				retry: false,
				select: (data) => {
					return {assets: normalizeMediaLibraryAssets(data.data.list)};
				},
			},
		},
	);

	/**
	 * @summary 모달 닫기 처리
	 */
	const handleModalCancel = () => {
		modal.resolve(null);
		void modal.hide();
	};

	/**
	 * @summary 선택 자산을 적용하고 모달을 닫습니다.
	 */
	const handleApplyButtonClick = () => {
		if (!isSelectMode) {
			return;
		}

		const availableAssets = responseMediaLibrarySearchMediaLibrary.data?.assets;
		if (!availableAssets) {
			return;
		}

		const selectedMediaFiles = availableAssets
			.filter((asset) => selectedAssetPaths.includes(asset.path))
			.map((asset) => toSelectableMediaFile(asset));

		modal.resolve(selectedMediaFiles);
		void modal.hide();
	};

	return (
		<UiModal width={isSelectMode ? 860 : 720} onCancel={handleModalCancel}>
			<div className={clsx("loc_meml__root")}>
				<div className={clsx("loc_meml__header")}>
					<div className={clsx("loc_meml__titleRow")}>
						<UiTypoTitle level={4}>{isSelectMode ? "Select from Media Library" : props.columnTitle}</UiTypoTitle>
						<Activity mode={isSelectMode ? "hidden" : "visible"}>
							<UiTag>
								<strong>{previewMediaFiles.length}</strong>
							</UiTag>
						</Activity>
					</div>
					<Activity mode={isSelectMode ? "visible" : "hidden"}>
						<div className={clsx("loc_meml__search")}>
							<UiInput
								allowClear
								placeholder="Search media library"
								value={searchKeyword}
								onChange={(event) => {
									setSearchKeyword(event.target.value);
									setCurrentPage(1);
								}}
							/>
						</div>
					</Activity>
				</div>

				<Activity mode={isSelectMode ? "hidden" : "visible"}>
					<div className={clsx("loc_meml__list")}>
						{previewMediaFiles.map((mediaFile, index) => {
							const isImageFile = isImageMediaFile(mediaFile);

							return (
								<a
									key={`${mediaFile.path}-${index}`}
									href={mediaFile.url}
									target="_blank"
									rel="noopener noreferrer"
									className={clsx("loc_meml__listItem")}
								>
									<div className={clsx("loc_meml__listItemPreview")}>
										<Activity mode={isImageFile ? "visible" : "hidden"}>
											<img src={mediaFile.url} alt={mediaFile.name} className={clsx("loc_meml__listItemThumb")} />
										</Activity>
										<Activity mode={isImageFile ? "hidden" : "visible"}>
											<div className={clsx("loc_meml__listItemIcon")}>
												<Attachment {...iconPreset.outlined({size: 18})} />
											</div>
										</Activity>
									</div>
									<div className={clsx("loc_meml__listItemName")}>
										<UiTypoText>{mediaFile.name}</UiTypoText>
									</div>
								</a>
							);
						})}
					</div>
				</Activity>

				<Activity mode={isSelectMode ? "visible" : "hidden"}>
					{(() => {
						const filteredSelectableAssets = responseMediaLibrarySearchMediaLibrary.data
							? filterMediaLibraryAssets(responseMediaLibrarySearchMediaLibrary.data.assets, searchKeyword)
							: [];
						const pagedSelectableAssets = getPagedMediaLibraryAssets({
							assets: filteredSelectableAssets,
							currentPage,
							pageSize: ENTRY_MEDIA_PICKER_PAGE_SIZE,
						});
						const totalPageCount = getMediaLibraryPageCount({
							fallbackAssetCount: filteredSelectableAssets.length,
							pageSize: ENTRY_MEDIA_PICKER_PAGE_SIZE,
						});

						return (
							<div className={clsx("loc_meml__picker")}>
								<Activity mode={responseMediaLibrarySearchMediaLibrary.isLoading ? "visible" : "hidden"}>
									<div className={clsx("loc_meml__empty")}>
										<UiTypoText type="secondary">Loading media library...</UiTypoText>
									</div>
								</Activity>
								<Activity
									mode={!responseMediaLibrarySearchMediaLibrary.isLoading && pagedSelectableAssets.length < 1 ? "visible" : "hidden"}
								>
									<div className={clsx("loc_meml__empty")}>
										<UiEmpty description="미디어 라이브러리가 비어 있습니다. 직접 업로드를 사용하세요." />
									</div>
								</Activity>
								<Activity
									mode={!responseMediaLibrarySearchMediaLibrary.isLoading && pagedSelectableAssets.length > 0 ? "visible" : "hidden"}
								>
									<div className={clsx("loc_meml__pickerList")}>
										{pagedSelectableAssets.map((asset) => {
											const isSelected = selectedAssetPaths.includes(asset.path);

											return (
												<button
													key={asset.path}
													type="button"
													className={clsx("loc_meml__pickerItem", isSelected && "loc_meml__pickerItem--selected")}
													onClick={() => {
														setSelectedAssetPaths((currentPaths) => {
															if (currentPaths.includes(asset.path)) {
																return currentPaths.filter((path) => path !== asset.path);
															}

															return [...currentPaths, asset.path];
														});
													}}
												>
													<div className={clsx("loc_meml__pickerCheck")}>
														<UiCheckbox checked={isSelected} />
													</div>
													<div className={clsx("loc_meml__pickerThumb")}>
														<Activity mode={isMediaLibraryAssetPreviewable(asset) ? "visible" : "hidden"}>
															<img src={asset.url} alt={asset.name} className={clsx("loc_meml__pickerImage")} />
														</Activity>
														<Activity mode={isMediaLibraryAssetPreviewable(asset) ? "hidden" : "visible"}>
															<Attachment {...iconPreset.outlined({size: 22})} />
														</Activity>
													</div>
													<div className={clsx("loc_meml__pickerInfo")}>
														<UiTypoText strong>{asset.name}</UiTypoText>
														<UiTypoText type="secondary">
															{formatMediaLibraryAssetSize(asset.size)} · {asset.path}
														</UiTypoText>
													</div>
												</button>
											);
										})}
									</div>
								</Activity>
								<div className={clsx("loc_meml__footer")}>
									<div className={clsx("loc_meml__pageActions")}>
										<UiButton onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>
											Prev
										</UiButton>
										<UiTypoText type="secondary">
											{currentPage} / {totalPageCount}
										</UiTypoText>
										<UiButton
											onClick={() => setCurrentPage((page) => Math.min(totalPageCount, page + 1))}
											disabled={currentPage >= totalPageCount}
										>
											Next
										</UiButton>
									</div>
									<div className={clsx("loc_meml__actions")}>
										<UiButton onClick={handleModalCancel}>Cancel</UiButton>
										<UiButton type="primary" onClick={handleApplyButtonClick} disabled={selectedAssetPaths.length < 1}>
											Use selected assets
										</UiButton>
									</div>
								</div>
							</div>
						);
					})()}
				</Activity>
			</div>
		</UiModal>
	);
};

export default NiceModal.create(ModalEntryMediaList);
