import {useEffect, useRef} from "react";
import clsx from "clsx";
import {Upload} from "griddy-icons";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiUploadDragger, {type UiUploadDraggerProps} from "@/components/ui/upload/ui-upload-dragger.tsx";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {useContentMediaCreatePresignedUrls} from "@/services/hooks/content-media/use-content-media-create-presigned-urls.ts";
import {
	createWidgetMediaUploaderRequestHandler,
	removeWidgetMediaUploaderFile,
	type WidgetMediaUploaderRequestDependencies,
	type WidgetMediaUploaderFile,
} from "./widget-media-uploader.ts";
import "./widget-media-uploader.css";

/**
 * @summary Widget MEDIA 업로더가 UiUploadDragger에 위임하는 options
 * @property accept 허용 확장자 목록
 * @property beforeUpload 업로드 전 파일 검증 훅
 * @property disabled 업로드 비활성화 여부
 * @property maxCount 허용 파일 수 제한
 * @property multiple 다중 업로드 허용 여부
 * @property showUploadList antd Upload list 표시 옵션
 */
export interface WidgetMediaUploaderDraggerOptions
	extends Pick<UiUploadDraggerProps, "accept" | "beforeUpload" | "disabled" | "maxCount" | "multiple" | "showUploadList"> {}

const DEFAULT_WIDGET_MEDIA_UPLOADER_SHOW_UPLOAD_LIST: NonNullable<WidgetMediaUploaderDraggerOptions["showUploadList"]> = {
	showPreviewIcon: false,
	showDownloadIcon: false,
};

/**
 * @summary Widget MEDIA 업로더 options
 * @property request 업로드 요청 후속 처리 옵션
 * @property dragger UiUploadDragger에 위임할 업로드 옵션
 * @property guideTitle 드래거 가이드 제목
 * @property guideDescription 드래거 가이드 설명
 * @property errorMessage 업로드 오류 메시지
 */
export interface WidgetMediaUploaderOptions {
	request?: Pick<WidgetMediaUploaderRequestDependencies, "onUploadSuccess" | "onUploadError">;
	dragger?: WidgetMediaUploaderDraggerOptions;
	guideTitle?: string;
	guideDescription?: string;
	errorMessage?: string;
}

/**
 * @summary Widget MEDIA 업로더 props
 * @property tableName 업로드 대상 테이블명
 * @property columnName 업로드 대상 컬럼명
 * @property fileList Upload fileList 상태
 * @property onFileListChange Upload fileList 변경 반영기
 * @property options 업로드/표시 옵션 묶음
 */
interface WidgetMediaUploaderProps {
	tableName: string;
	columnName: string;
	fileList: WidgetMediaUploaderFile[];
	onFileListChange: (fileList: WidgetMediaUploaderFile[]) => void;
	options?: WidgetMediaUploaderOptions;
}

/**
 * @summary 공용 Presigned MEDIA 업로더 widget
 */
const WidgetMediaUploader = (props: WidgetMediaUploaderProps) => {
	const {tableName, columnName, fileList, onFileListChange, options} = props;
	const fileListRef = useRef(fileList);
	const resolvedDraggerOptions = {
		...options?.dragger,
		multiple: options?.dragger?.multiple ?? true,
		showUploadList: options?.dragger?.showUploadList ?? DEFAULT_WIDGET_MEDIA_UPLOADER_SHOW_UPLOAD_LIST,
	} satisfies WidgetMediaUploaderDraggerOptions;

	/**
	 * @summary 최신 Upload fileList ref 동기화
	 */
	useEffect(() => {
		fileListRef.current = fileList;
	}, [fileList]);

	/**
	 * @description MEDIA Presigned URL 발급 API
	 */
	const mutationContentMediaCreatePresignedUrls = useContentMediaCreatePresignedUrls({mutation: {meta: {successToast: null}}});

	/**
	 * @summary Presigned 업로드 요청 핸들러 생성
	 */
	const handleUploadRequest = createWidgetMediaUploaderRequestHandler({
		requestPresignedUrl: async (input) => {
			let mimeType = input.file.type;
			if (mimeType.length < 1) {
				mimeType = "application/octet-stream";
			}

			const responseCreatePresignedUrls = await mutationContentMediaCreatePresignedUrls.mutateAsync({
				params: {tableName: input.tableName},
				data: [{columnName: input.columnName, name: input.file.name, mimeType, size: input.file.size}],
			});
			const createdPresignedUrl = responseCreatePresignedUrls.data[0];
			if (!createdPresignedUrl) {
				throw new Error("Presigned URL을 발급하지 못했습니다.");
			}

			return createdPresignedUrl;
		},
		setFileList: (updater) => {
			onFileListChange(updater(fileListRef.current));
		},
		onUploadSuccess: async (mediaFile, file) => {
			await options?.request?.onUploadSuccess?.(mediaFile, file);
		},
		onUploadError: (errorMessage, file) => {
			options?.request?.onUploadError?.(errorMessage, file);
		},
	});

	/**
	 * @summary Upload fileList 단건 제거
	 */
	const handleUploadRemove: NonNullable<UiUploadDraggerProps["onRemove"]> = (file) => {
		onFileListChange(removeWidgetMediaUploaderFile(fileList, file.uid));
		return true;
	};

	/**
	 * @summary Upload change 이벤트를 widget fileList로 반영
	 */
	const handleUploadChange: NonNullable<UiUploadDraggerProps["onChange"]> = (info) => {
		onFileListChange(info.fileList as WidgetMediaUploaderFile[]);
	};

	return (
		<div className={clsx("wg_wmu__root")}>
			<div className={clsx("wg_wmu__dropzone")}>
				<UiUploadDragger
					{...resolvedDraggerOptions}
					customRequest={handleUploadRequest}
					fileList={fileList}
					onChange={handleUploadChange}
					onRemove={handleUploadRemove}
					data={{tableName, columnName}}
				>
					<div className={clsx("wg_wmu__guide")}>
						<div className={clsx("wg_wmu__guideIcon")}>
							<Upload {...iconPreset.outlined({size: 30, style: {color: "var(--cms-color-text-secondary, rgba(0, 0, 0, 0.45))"}})} />
						</div>
						<div className={clsx("wg_wmu__guideTitle")}>{options?.guideTitle ?? "Drop files here or click to upload"}</div>
						<div className={clsx("wg_wmu__guideDesc")}>{options?.guideDescription ?? "Multiple files allowed"}</div>
					</div>
				</UiUploadDragger>
			</div>
			<div className={clsx("wg_wmu__meta")}>
				<UiTypoText type="secondary">
					<span className={clsx("wg_wmu__count")}>선택된 파일 {fileList.length}개</span>
				</UiTypoText>
				{options?.errorMessage ? <span className={clsx("wg_wmu__error")}>{options.errorMessage}</span> : null}
			</div>
		</div>
	);
};

export default WidgetMediaUploader;
