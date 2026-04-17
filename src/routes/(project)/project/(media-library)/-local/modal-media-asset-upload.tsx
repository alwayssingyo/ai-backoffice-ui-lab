import {type MouseEventHandler, useState} from "react";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import clsx from "clsx";
import {useQueryClient} from "@tanstack/react-query";
import WidgetMediaUploader from "@/components/widget/media-uploader/widget-media-uploader.tsx";
import type {WidgetMediaUploaderFile} from "@/components/widget/media-uploader/widget-media-uploader.ts";
import {getWidgetMediaUploadedFiles, hasWidgetMediaUploadingFiles} from "@/components/widget/media-uploader/widget-media-uploader.ts";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {useMediaLibraryUpsert} from "@/services/hooks/media-library/use-media-library-upsert.ts";
import {
	buildMediaLibraryUpsertRequest,
	getMediaLibraryQueryInvalidationKey,
	MEDIA_LIBRARY_DEFAULT_COLUMN_NAME,
} from "@/routes/(project)/project/(media-library)/media-library.ts";
import "./modal-media-asset-upload.css";

const MEDIA_LIBRARY_UPLOAD_TABLE_NAME = "files";

/**
 * @summary Media Library 자산 등록 모달
 */
export const ModalMediaAssetUpload = () => {
	const modal = useModal();
	const queryClient = useQueryClient();
	const [fileList, setFileList] = useState<WidgetMediaUploaderFile[]>([]);
	const [submitErrorMessage, setSubmitErrorMessage] = useState<string>();

	/**
	 * @description 미디어 라이브러리 등록 API
	 */
	const mutationMediaLibraryUpsert = useMediaLibraryUpsert({
		mutation: {
			meta: {successToast: null},
			onSuccess: () => {
				void queryClient.invalidateQueries({queryKey: getMediaLibraryQueryInvalidationKey()});
			},
		},
	});

	/**
	 * @summary 모달 닫기
	 */
	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		modal.resolve(null);
		void modal.hide();
	};

	/**
	 * @summary 업로드 완료 파일을 미디어 라이브러리에 등록합니다.
	 */
	const handleUploadButtonClick: MouseEventHandler<HTMLButtonElement> = async (_event) => {
		if (hasWidgetMediaUploadingFiles(fileList)) {
			setSubmitErrorMessage("업로드가 끝날 때까지 기다려 주세요.");
			return;
		}

		const uploadedFiles = getWidgetMediaUploadedFiles(fileList);
		if (uploadedFiles.length < 1) {
			setSubmitErrorMessage("먼저 업로드할 파일을 선택해 주세요.");
			return;
		}

		setSubmitErrorMessage(undefined);

		try {
			await mutationMediaLibraryUpsert.mutateAsync({data: buildMediaLibraryUpsertRequest(uploadedFiles)});
			modal.resolve(uploadedFiles);
			void modal.hide();
		} catch (_error) {
			setSubmitErrorMessage("미디어 라이브러리 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
		}
	};

	return (
		<UiModal width={780} onCancel={handleCancelButtonClick}>
			<div className={clsx("loc_mmau__root")}>
				<div className={clsx("loc_mmau__header")}>
					<UiTypoTitle level={4}>Add new assets</UiTypoTitle>
					<UiTypoText type="secondary">Presigned upload 후 Media Library에 등록합니다.</UiTypoText>
				</div>
				<div className={clsx("loc_mmau__body")}>
					<WidgetMediaUploader
						columnName={MEDIA_LIBRARY_DEFAULT_COLUMN_NAME}
						fileList={fileList}
						onFileListChange={(nextFileList) => {
							setSubmitErrorMessage(undefined);
							setFileList(nextFileList);
						}}
						options={{
							errorMessage: submitErrorMessage,
							request: {
								onUploadError: (errorMessage) => {
									setSubmitErrorMessage(errorMessage);
								},
							},
						}}
						tableName={MEDIA_LIBRARY_UPLOAD_TABLE_NAME}
					/>
				</div>
				<div className={clsx("loc_mmau__footer")}>
					<div className={clsx("loc_mmau__actions")}>
						<UiButton onClick={handleCancelButtonClick}>Cancel</UiButton>
						<UiButton
							type="primary"
							onClick={handleUploadButtonClick}
							disabled={fileList.length < 1}
							loading={mutationMediaLibraryUpsert.isPending}
						>
							Upload
						</UiButton>
					</div>
				</div>
			</div>
		</UiModal>
	);
};

export default NiceModal.create(ModalMediaAssetUpload);
