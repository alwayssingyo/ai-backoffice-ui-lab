import {Activity, type MouseEventHandler, useState} from "react";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import {Upload as AntDesignUpload} from "antd";
import clsx from "clsx";
import WidgetMediaUploader, {type WidgetMediaUploaderDraggerOptions} from "@/components/widget/media-uploader/widget-media-uploader.tsx";
import type {WidgetMediaUploaderFile} from "@/components/widget/media-uploader/widget-media-uploader.ts";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {modal as antDesignModal} from "@/libraries/ant-design/ant-design-provider.tsx";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";
import {
	createEntryMediaUploadFileListFromMediaFiles,
	ENTRY_MEDIA_UPLOAD_ACCEPT,
	ENTRY_MEDIA_UPLOAD_MAX_FILE_COUNT,
	getEntryUploadedMediaFilesFromUploadFileList,
	hasEntryMediaUploadingFile,
	toEntryMediaColumnRequestName,
	validateEntryMediaUploadBatch,
	validateEntryMediaUploadFile,
} from "../entries.ts";
import "./modal-entry-media-upload.css";

interface ModalEntryMediaUploadProps {
	columnName: string;
	columnTitle: string;
	tableName: string;
	selectedMediaFiles?: UpsertMediaFileRequest[];
}

const ModalEntryMediaUpload = (props: ModalEntryMediaUploadProps) => {
	const modal = useModal();
	let initialMediaFiles: UpsertMediaFileRequest[] = [];
	if (props.selectedMediaFiles) {
		initialMediaFiles = props.selectedMediaFiles;
	}
	const [mediaUploadFileList, setMediaUploadFileList] = useState<WidgetMediaUploaderFile[]>(
		createEntryMediaUploadFileListFromMediaFiles(props.columnName, initialMediaFiles),
	);

	/**
	 * @summary 업로드 모달 닫기
	 */
	const handleModalCancel = () => {
		modal.resolve(null);
		void modal.hide();
	};

	/**
	 * @summary 업로드 모달 적용
	 */
	const handleApplyButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (hasEntryMediaUploadingFile(mediaUploadFileList)) {
			return;
		}

		modal.resolve(getEntryUploadedMediaFilesFromUploadFileList(mediaUploadFileList));
		void modal.hide();
	};

	/**
	 * @summary 업로드 전 파일 검증
	 */
	const handleBeforeUpload: NonNullable<WidgetMediaUploaderDraggerOptions["beforeUpload"]> = (file, fileList) => {
		const batchValidationResult = validateEntryMediaUploadBatch(
			mediaUploadFileList.map((uploadFile) => ({uid: uploadFile.uid, name: uploadFile.name, size: uploadFile.size})),
			fileList.map((currentFile) => ({uid: currentFile.uid, name: currentFile.name, size: currentFile.size})),
		);

		if (!batchValidationResult.isValid) {
			if (file.uid === fileList[0]?.uid) {
				antDesignModal.warning({title: "Upload limit exceeded", content: batchValidationResult.message});
			}

			return AntDesignUpload.LIST_IGNORE;
		}

		const fileValidationResult = validateEntryMediaUploadFile({name: file.name, size: file.size});
		if (!fileValidationResult.isValid) {
			antDesignModal.warning({title: "Unsupported file", content: fileValidationResult.message});
			return AntDesignUpload.LIST_IGNORE;
		}

		return true;
	};

	return (
		<UiModal width={820} onCancel={handleModalCancel}>
			<div className={clsx("loc_memu__root")}>
				<div className={clsx("loc_memu__header")}>
					<UiTypoTitle level={4}>Upload files</UiTypoTitle>
					<UiTypoText type="secondary">Drag and drop files or click to upload multiple files.</UiTypoText>
				</div>
				<div className={clsx("loc_memu__content")}>
					<WidgetMediaUploader
						columnName={toEntryMediaColumnRequestName(props.columnName)}
						options={{
							dragger: {accept: ENTRY_MEDIA_UPLOAD_ACCEPT, beforeUpload: handleBeforeUpload, maxCount: ENTRY_MEDIA_UPLOAD_MAX_FILE_COUNT},
						}}
						fileList={mediaUploadFileList}
						onFileListChange={(nextFileList) => {
							setMediaUploadFileList(nextFileList);
						}}
						tableName={props.tableName}
					/>
				</div>
				<div className={clsx("loc_memu__footer")}>
					<Activity mode={hasEntryMediaUploadingFile(mediaUploadFileList) ? "visible" : "hidden"}>
						<UiTypoText type="secondary">Uploading files...</UiTypoText>
					</Activity>
					<div className={clsx("loc_memu__actions")}>
						<UiButton onClick={handleModalCancel}>Cancel</UiButton>
						<UiButton
							type="primary"
							onClick={handleApplyButtonClick}
							disabled={mediaUploadFileList.length < 1 || hasEntryMediaUploadingFile(mediaUploadFileList)}
						>
							Apply
						</UiButton>
					</div>
				</div>
			</div>
		</UiModal>
	);
};

export default NiceModal.create(ModalEntryMediaUpload);
