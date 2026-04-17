import type {UiUploadDraggerProps} from "@/components/ui/upload/ui-upload-dragger.tsx";
import type {CreateMediaPresignedUrlResponse} from "@/services/types/create-media-presigned-url-response.ts";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";

/**
 * @summary widget MEDIA 업로더의 Upload fileList 아이템
 */
export type WidgetMediaUploaderFile = NonNullable<UiUploadDraggerProps["fileList"]>[number];

/**
 * @summary Presigned URL 요청 입력값
 * @property tableName 업로드 대상 테이블명
 * @property columnName 업로드 대상 컬럼명
 * @property file 업로드할 원본 파일
 */
export interface WidgetMediaUploaderRequestInput {
	tableName: string;
	columnName: string;
	file: File & {uid: string};
}

/**
 * @summary widget MEDIA 업로드 요청 의존성
 * @property requestPresignedUrl Presigned URL 발급 호출기
 * @property setFileList Upload fileList 갱신기
 * @property onUploadSuccess 업로드 성공 후속 처리
 * @property onUploadError 업로드 실패 메시지 후속 처리
 */
export interface WidgetMediaUploaderRequestDependencies {
	requestPresignedUrl: (input: WidgetMediaUploaderRequestInput) => Promise<CreateMediaPresignedUrlResponse>;
	setFileList: (updater: (currentFileList: WidgetMediaUploaderFile[]) => WidgetMediaUploaderFile[]) => void;
	onUploadSuccess?: (mediaFile: UpsertMediaFileRequest, file: File & {uid: string}) => Promise<void> | void;
	onUploadError?: (errorMessage: string, file: File & {uid: string}) => void;
}

/**
 * @summary Presigned URL 업로드 실행 입력값
 * @property method Presigned 요청 메서드
 * @property presignedUrl 업로드 대상 URL
 * @property file 업로드할 파일
 * @property onProgress 업로드 진행률 반영기
 */
interface WidgetMediaUploaderUploadRequestInput {
	method: string;
	presignedUrl: string;
	file: File;
	onProgress: (percent: number) => void;
}

/**
 * @summary uid 기준 Upload fileList 단건 갱신
 */
const updateWidgetMediaUploaderFileListByUid = (
	fileList: WidgetMediaUploaderFile[],
	fileUid: string,
	updater: (file: WidgetMediaUploaderFile) => WidgetMediaUploaderFile,
) => {
	return fileList.map((file) => {
		if (file.uid !== fileUid) {
			return file;
		}

		return updater(file);
	});
};

/**
 * @summary 업로드 완료 응답의 Upload fileList 변환
 */
export const toWidgetMediaUploaderFile = (mediaFile: UpsertMediaFileRequest, fileUid: string): WidgetMediaUploaderFile => {
	return {
		uid: fileUid,
		name: mediaFile.name,
		size: mediaFile.size,
		type: mediaFile.mimeType,
		status: "done",
		percent: 100,
		url: mediaFile.url,
		response: mediaFile,
	};
};

/**
 * @summary 업로드 진행 중 Upload fileList 변환
 */
export const toWidgetMediaUploaderPendingFile = (file: File & {uid: string}): WidgetMediaUploaderFile => {
	return {uid: file.uid, name: file.name, size: file.size, type: file.type, status: "uploading", percent: 0};
};

/**
 * @summary 업로드 실패 메시지 정규화
 */
export const toWidgetMediaUploaderErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return "파일 업로드 중 오류가 발생했습니다.";
};

/**
 * @summary 업로드 완료 응답만 추출
 */
export const getWidgetMediaUploadedFiles = (fileList: WidgetMediaUploaderFile[]): UpsertMediaFileRequest[] => {
	return fileList
		.map((file) => file.response)
		.filter((response): response is UpsertMediaFileRequest => {
			if (typeof response !== "object" || response === null) {
				return false;
			}

			return "url" in response && "path" in response && "mimeType" in response && "name" in response && "size" in response;
		});
};

/**
 * @summary 업로드 진행 중 파일 존재 여부 판별
 */
export const hasWidgetMediaUploadingFiles = (fileList: WidgetMediaUploaderFile[]): boolean => {
	return fileList.some((file) => file.status === "uploading");
};

/**
 * @summary uid 기준 Upload fileList 제거
 */
export const removeWidgetMediaUploaderFile = (fileList: WidgetMediaUploaderFile[], fileUid: string): WidgetMediaUploaderFile[] => {
	return fileList.filter((file) => file.uid !== fileUid);
};

/**
 * @summary Presigned URL 대상 파일 업로드 실행
 */
export const uploadFileToPresignedUrl = (input: WidgetMediaUploaderUploadRequestInput): Promise<void> => {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();

		request.open(input.method, input.presignedUrl);
		if (input.file.type.length > 0) {
			request.setRequestHeader("Content-Type", input.file.type);
		}

		request.upload.onprogress = (event) => {
			if (!event.lengthComputable) {
				return;
			}

			input.onProgress(Math.round((event.loaded / event.total) * 100));
		};

		request.onload = () => {
			if (request.status >= 200 && request.status < 300) {
				resolve();
				return;
			}

			reject(new Error(`MEDIA upload failed: ${request.status}`));
		};

		request.onerror = () => {
			reject(new Error("MEDIA upload failed by network error"));
		};

		request.send(input.file);
	});
};

/**
 * @summary Widget MEDIA 업로드용 customRequest 생성
 */
export const createWidgetMediaUploaderRequestHandler =
	(dependencies: WidgetMediaUploaderRequestDependencies): NonNullable<UiUploadDraggerProps["customRequest"]> =>
	async (option) => {
		const uploadFile = option.file as File & {uid: string};
		const uploadFileUid = uploadFile.uid;

		dependencies.setFileList((currentFileList) => {
			return [...removeWidgetMediaUploaderFile(currentFileList, uploadFileUid), toWidgetMediaUploaderPendingFile(uploadFile)];
		});

		try {
			const presignedUrl = await dependencies.requestPresignedUrl({
				tableName: option.data?.tableName as string,
				columnName: option.data?.columnName as string,
				file: uploadFile,
			});

			await uploadFileToPresignedUrl({
				method: presignedUrl.method,
				presignedUrl: presignedUrl.presignedUrl,
				file: uploadFile,
				onProgress: (percent) => {
					dependencies.setFileList((currentFileList) => {
						return updateWidgetMediaUploaderFileListByUid(currentFileList, uploadFileUid, (file) => ({
							...file,
							status: "uploading",
							percent,
						}));
					});

					option.onProgress?.({percent});
				},
			});

			const uploadedMediaFile: UpsertMediaFileRequest = {
				url: presignedUrl.file.url,
				path: presignedUrl.file.path,
				mimeType: presignedUrl.file.mimeType,
				name: presignedUrl.file.name,
				size: presignedUrl.file.size,
				ext: presignedUrl.file.ext,
				provider: presignedUrl.file.provider,
			};

			dependencies.setFileList((currentFileList) => {
				return updateWidgetMediaUploaderFileListByUid(currentFileList, uploadFileUid, () => {
					return toWidgetMediaUploaderFile(uploadedMediaFile, uploadFileUid);
				});
			});

			await dependencies.onUploadSuccess?.(uploadedMediaFile, uploadFile);
			option.onSuccess?.(uploadedMediaFile);
		} catch (error) {
			dependencies.setFileList((currentFileList) => {
				return updateWidgetMediaUploaderFileListByUid(currentFileList, uploadFileUid, (file) => ({...file, status: "error"}));
			});

			dependencies.onUploadError?.(toWidgetMediaUploaderErrorMessage(error), uploadFile);
			option.onError?.(error as Error);
		}
	};
