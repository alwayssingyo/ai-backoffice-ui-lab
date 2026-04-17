import type {RuleObject} from "@rc-component/form/es/interface";
import type {ContentFolderNodeResponse} from "@/services/types/content-folder-node-response.ts";
import {
	contentTypeColumnResponseDateTypeEnum,
	contentTypeColumnResponseFieldTypeEnum,
	type ContentTypeColumnResponse,
} from "@/services/types/content-type-column-response.ts";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";
import {upsertMediaFileRequestProviderEnum} from "@/services/types/upsert-media-file-request.ts";
import {toWidgetMediaUploaderFile, type WidgetMediaUploaderFile} from "@/components/widget/media-uploader/widget-media-uploader.ts";
import {config} from "@/entry/config.ts";
import dayjs, {type Dayjs} from "dayjs";

/**
 * @summary 엔트리 폼 값 레코드
 */
export type EntryFormValues = Record<string, unknown>;

/**
 * @summary 엔트리 table info select 결과
 * @property columns 렌더링 대상 컬럼 목록
 * @property defaultValues 생성 폼 기본값
 */
export type EntryTableInfoSelectData = {columns: ContentTypeColumnResponse[]; defaultValues: EntryFormValues};

/**
 * @summary 엔트리 사이드바 노드 모델
 * @property id 노드 식별자
 * @property nodeType FOLDER/TABLE 구분
 * @property name 노드 표시명
 * @property tableName TABLE 노드의 테이블명
 * @property children 하위 노드 목록
 */
export type EntrySidebarNode = {id: number; nodeType: "FOLDER" | "TABLE"; name: string; tableName?: string; children: EntrySidebarNode[]};

/**
 * @summary 엔트리 TABLE 노드 모델
 * @property id TABLE 노드 식별자
 * @property name TABLE 표시명
 * @property tableName TABLE API 식별명
 */
export type EntryTableNode = {id: number; name: string; tableName: string};

/**
 * @summary 선택된 엔트리 TABLE 상태
 * @property selectedTableNode 현재 선택된 TABLE 노드
 * @property selectedTableName 현재 선택된 TABLE 이름
 * @property hasSelectedTable TABLE 선택 여부
 * @property tableNameForQuery URL/query 동기화용 TABLE 이름
 */
export type SelectedEntryTableState = {
	selectedTableNode: EntryTableNode | undefined;
	selectedTableName: string | undefined;
	hasSelectedTable: boolean;
	tableNameForQuery: string;
};

/**
 * @summary 엔트리 트리 select 결과
 * @property sidebarNodes 사이드바 트리 노드
 * @property tableNodes TABLE 노드 평탄 목록
 * @property hasInvalidNode 유효하지 않은 노드 존재 여부
 */
export type EntryTreeSelectData = {sidebarNodes: EntrySidebarNode[]; tableNodes: EntryTableNode[]; hasInvalidNode: boolean};

/**
 * @summary 엔트리 트리 렌더러 집합
 * @property renderTitle 노드 제목 렌더러
 * @property renderIcon 노드 아이콘 렌더러
 */
export type EntryTreeRenderers = {renderTitle: (node: EntrySidebarNode) => unknown; renderIcon: (node: EntrySidebarNode) => unknown};

const ENTRY_MEDIA_UPLOAD_BYTES_PER_MB = 1024 * 1024;

export const ENTRY_MEDIA_UPLOAD_MAX_FILE_COUNT = 10;
export const ENTRY_MEDIA_UPLOAD_MAX_TOTAL_SIZE_BYTES = 150 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB;
export const ENTRY_MEDIA_UPLOAD_MAX_SIZE_BYTES_BY_EXTENSION: Record<string, number> = {
	jpg: 10 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	jpeg: 10 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	png: 10 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	webp: 10 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	avif: 10 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	gif: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	heic: 15 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	heif: 15 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	pdf: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	doc: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	docx: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	ppt: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	pptx: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	xls: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	xlsx: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	hwp: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	hwpx: 30 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	txt: 5 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	csv: 5 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	json: 5 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	md: 5 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	mp3: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	m4a: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	aac: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	ogg: 20 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	wav: 50 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	mp4: 100 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	webm: 100 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
	mov: 150 * ENTRY_MEDIA_UPLOAD_BYTES_PER_MB,
} as const;
export const ENTRY_MEDIA_UPLOAD_ACCEPT = Object.keys(ENTRY_MEDIA_UPLOAD_MAX_SIZE_BYTES_BY_EXTENSION)
	.map((extension) => `.${extension}`)
	.join(",");

/**
 * @summary MEDIA 업로드 검증 후보 파일
 * @property uid 업로드 식별자
 * @property name 파일명
 * @property size 파일 크기
 */
type EntryMediaUploadCandidate = {uid: string; name: string; size: number | undefined};

/**
 * @summary uid 포함 업로드 파일 최소 모델
 * @property uid Upload fileList 식별자
 */
type EntryMediaUploadFileWithUid = {uid: string};

/**
 * @summary MEDIA 업로드 검증 결과
 * @property isValid 검증 통과 여부
 * @property message 검증 실패 메시지
 */
type EntryMediaUploadValidationResult = {isValid: true} | {isValid: false; message: string};

/**
 * @summary MEDIA 업로드 용량 메시지 포맷
 */
const formatEntryMediaUploadSizeMb = (bytes: number): string => {
	return `${Math.floor(bytes / ENTRY_MEDIA_UPLOAD_BYTES_PER_MB)}MB`;
};

/**
 * @description 컬럼 메타데이터를 기반으로 검증규칙을 생성합니다.
 */
export const buildColumnRules = (
	column: Pick<ContentTypeColumnResponse, "required" | "regexpPattern" | "minLength" | "maxLength" | "fieldType">,
): RuleObject[] => {
	const rules: RuleObject[] = [];
	const isStringRuleTarget =
		column.fieldType === contentTypeColumnResponseFieldTypeEnum.TEXT ||
		column.fieldType === contentTypeColumnResponseFieldTypeEnum.JSON ||
		column.fieldType === contentTypeColumnResponseFieldTypeEnum.ENUMERATION;

	if (column.required === true) {
		rules.push({required: true});
	}

	if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.JSON) {
		rules.push({
			validator: async (_rule, value?: string) => {
				if (!value?.trim()) return;

				try {
					JSON.parse(value);
				} catch {
					throw new Error("Invalid JSON format.");
				}
			},
		});
	}

	if (isStringRuleTarget && typeof column.regexpPattern === "string" && column.regexpPattern.length > 0) {
		rules.push({pattern: new RegExp(column.regexpPattern)});
	}

	if (isStringRuleTarget && typeof column.minLength === "number" && Number.isFinite(column.minLength)) {
		rules.push({min: column.minLength});
	}

	if (isStringRuleTarget && typeof column.maxLength === "number" && Number.isFinite(column.maxLength)) {
		rules.push({max: column.maxLength});
	}

	return rules;
};

/**
 * @description 입력값이 비어있으면 null로 정규화합니다.
 */
export const normalizeEmptyStringToNull = (value?: string | null): string | null => {
	if (typeof value !== "string") {
		return value ?? null;
	}

	return value.trim().length === 0 ? null : value;
};

/**
 * @summary DATE 컬럼 문자열 값을 DatePicker value props로 변환합니다.
 */
export const getEntryDatePickerValueProps = (
	value: string | undefined,
	dateType: (typeof contentTypeColumnResponseDateTypeEnum)[keyof typeof contentTypeColumnResponseDateTypeEnum],
): {value: Dayjs | undefined} => {
	if (!value) {
		return {value: undefined};
	}

	if (dateType === contentTypeColumnResponseDateTypeEnum.DATE) {
		return {value: dayjs(value, config.date.formats.date)};
	}

	if (dateType === contentTypeColumnResponseDateTypeEnum.DATE_TIME) {
		return {value: dayjs(value, config.date.formats.dateTime)};
	}

	return {value: dayjs(value, config.date.formats.time)};
};

/**
 * @summary DATE 컬럼 DatePicker 값을 API 요청용 문자열로 정규화합니다.
 */
export const normalizeEntryDatePickerValue = (
	value: Dayjs | undefined,
	dateType: (typeof contentTypeColumnResponseDateTypeEnum)[keyof typeof contentTypeColumnResponseDateTypeEnum],
): string | undefined => {
	if (!value) {
		return undefined;
	}

	if (dateType === contentTypeColumnResponseDateTypeEnum.DATE) {
		return value.format(config.date.formats.date);
	}

	if (dateType === contentTypeColumnResponseDateTypeEnum.DATE_TIME) {
		return value.format(config.date.formats.dateTime);
	}

	return value.format(config.date.formats.time);
};

export const getEntryMediaUploadExtension = (fileName: string): string | undefined => {
	const extensionIndex = fileName.lastIndexOf(".");
	if (extensionIndex < 0) {
		return undefined;
	}

	if (extensionIndex === fileName.length - 1) {
		return undefined;
	}

	return fileName.slice(extensionIndex + 1).toLowerCase();
};

export const validateEntryMediaUploadFile = (file: Pick<EntryMediaUploadCandidate, "name" | "size">): EntryMediaUploadValidationResult => {
	if (typeof file.size !== "number" || file.size < 0) {
		return {isValid: false, message: "File size could not be determined."};
	}

	const extension = getEntryMediaUploadExtension(file.name);
	if (!extension) {
		return {isValid: false, message: "File extension is required."};
	}

	const maxSizeBytes = ENTRY_MEDIA_UPLOAD_MAX_SIZE_BYTES_BY_EXTENSION[extension];
	if (typeof maxSizeBytes !== "number") {
		return {isValid: false, message: `.${extension} files are not supported.`};
	}

	if (file.size > maxSizeBytes) {
		return {isValid: false, message: `.${extension} files must be ${formatEntryMediaUploadSizeMb(maxSizeBytes)} or smaller.`};
	}

	return {isValid: true};
};

// biome-ignore format: KEEP
export const validateEntryMediaUploadBatch = (currentFiles: EntryMediaUploadCandidate[], nextFiles: EntryMediaUploadCandidate[]): EntryMediaUploadValidationResult => {
	const nextFileUidSet = new Set(nextFiles.map((file) => file.uid));
	const persistedCurrentFiles = currentFiles.filter((file) => !nextFileUidSet.has(file.uid));
	const mergedFiles = [...persistedCurrentFiles, ...nextFiles];

	if (mergedFiles.length > ENTRY_MEDIA_UPLOAD_MAX_FILE_COUNT) {
		return {isValid: false, message: `You can upload up to ${ENTRY_MEDIA_UPLOAD_MAX_FILE_COUNT} files.`};
	}

	const totalSizeBytes = mergedFiles.reduce((sum, file) => {
		if (typeof file.size !== "number" || file.size < 0) {
			return Number.NaN;
		}

		return sum + file.size;
	}, 0);
	if (Number.isNaN(totalSizeBytes)) {
		return {isValid: false, message: "File size could not be determined."};
	}

	if (totalSizeBytes > ENTRY_MEDIA_UPLOAD_MAX_TOTAL_SIZE_BYTES) {
		return {
			isValid: false,
			message: `Total upload size must be ${formatEntryMediaUploadSizeMb(ENTRY_MEDIA_UPLOAD_MAX_TOTAL_SIZE_BYTES)} or smaller.`,
		};
	}

	return {isValid: true};
};

/**
 * @summary children 단일 객체/누락 케이스 대응용 하위 노드 배열 보정
 */
const getEntryChildNodes = (node: ContentFolderNodeResponse): ContentFolderNodeResponse[] => {
	if (Array.isArray(node.children)) {
		return node.children as ContentFolderNodeResponse[];
	}

	if (isContentFolderNodeResponse(node.children)) {
		return [node.children];
	}

	return [];
};

const isContentFolderNodeResponse = (value: unknown): value is ContentFolderNodeResponse => {
	if (typeof value !== "object" || !value) {
		return false;
	}

	return !(!("id" in value) || !("nodeType" in value) || !("name" in value) || !("orderNumber" in value) || !("displayed" in value));
};

/**
 * @summary 엔트리 화면 사이드바/테이블 노드 분리용 트리 변환
 */
const mapEntryNodes = (
	nodes: ContentFolderNodeResponse[],
): {sidebarNodes: EntrySidebarNode[]; tableNodes: EntryTableNode[]; hasInvalidNode: boolean} => {
	const sidebarNodes: EntrySidebarNode[] = [];
	const tableNodes: EntryTableNode[] = [];
	let hasInvalidNode = false;

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as ContentFolderNodeResponse;
		if (currentNode.nodeType === "TABLE") {
			if (currentNode.name.trim().length < 1) {
				hasInvalidNode = true;
				continue;
			}

			if (typeof currentNode.tableName !== "string" || currentNode.tableName.trim().length < 1) {
				hasInvalidNode = true;
				continue;
			}

			const tableNode: EntryTableNode = {id: currentNode.id, name: currentNode.name, tableName: currentNode.tableName};

			tableNodes.push(tableNode);
			sidebarNodes.push({...tableNode, nodeType: "TABLE", children: []});
			continue;
		}

		const childNodeResult = mapEntryNodes(getEntryChildNodes(currentNode));
		if (childNodeResult.hasInvalidNode) {
			hasInvalidNode = true;
		}

		if (childNodeResult.sidebarNodes.length < 1) {
			continue;
		}

		sidebarNodes.push({id: currentNode.id, nodeType: "FOLDER", name: currentNode.name, children: childNodeResult.sidebarNodes});
		tableNodes.push(...childNodeResult.tableNodes);
	}

	return {sidebarNodes, tableNodes, hasInvalidNode};
};

/**
 * @summary 폴더 API 응답의 엔트리 화면 전용 select 데이터 변환
 */
export const selectEntryTreeDataFromApi = (nodes: ContentFolderNodeResponse[]): EntryTreeSelectData => {
	const mappedEntryNodes = mapEntryNodes(nodes);

	return {
		sidebarNodes: mappedEntryNodes.sidebarNodes,
		tableNodes: mappedEntryNodes.tableNodes,
		hasInvalidNode: mappedEntryNodes.hasInvalidNode,
	};
};

/**
 * @summary 초기 확장 상태 복원용 FOLDER key 재귀 수집
 */
export const collectEntryFolderKeys = (nodes: EntrySidebarNode[]): string[] => {
	const folderKeys: string[] = [];

	for (let index = 0; index < nodes.length; index += 1) {
		const currentNode = nodes[index] as EntrySidebarNode;
		if (currentNode.nodeType !== "FOLDER") {
			continue;
		}

		folderKeys.push(getEntryTreeFolderKey(currentNode.id));
		folderKeys.push(...collectEntryFolderKeys(currentNode.children));
	}

	return folderKeys;
};

/**
 * @summary FOLDER 트리 key 생성
 */
export const getEntryTreeFolderKey = (id: number): string => {
	return `folder:${id}`;
};

/**
 * @summary TABLE 트리 key 생성
 */
export const getEntryTreeTableKey = (tableName: string): string => {
	return `table:${tableName}`;
};

export const toEntryMediaColumnRequestName = (columnName: string): string => {
	return columnName
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[\s-]+/g, "_")
		.toLowerCase();
};

/**
 * @summary URL 쿼리/기본값 동기화용 선택 테이블 계산
 * biome-ignore format: KEEP
 */
export const resolveSelectedEntryTableState = (tableNodes: EntryTableNode[], searchTableName: string | undefined): SelectedEntryTableState => {
	let selectedTableNode: EntryTableNode | undefined;

	for (let index = 0; index < tableNodes.length; index += 1) {
		const currentTableNode = tableNodes[index] as EntryTableNode;
		if (currentTableNode.tableName !== searchTableName) {
			continue;
		}

		selectedTableNode = currentTableNode;
		break;
	}

	if (typeof selectedTableNode === "undefined" && tableNodes.length > 0) {
		selectedTableNode = tableNodes[0];
	}

	const selectedTableName = selectedTableNode?.tableName;
	const hasSelectedTable = typeof selectedTableName === "string";
	if (!hasSelectedTable) {
		return {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery: ""};
	}

	return {selectedTableNode, selectedTableName, hasSelectedTable, tableNameForQuery: selectedTableName};
};

/**
 * @summary 엔트리 사이드바 노드의 UiTree 데이터 변환
 * biome-ignore format: KEEP
 */
export const mapEntryNodeToTreeData = (node: EntrySidebarNode, renderers: EntryTreeRenderers): Record<string, unknown> => {
	if (node.nodeType === "TABLE") {
		return {
			key: getEntryTreeTableKey(node.tableName as string),
			title: renderers.renderTitle(node),
			icon: renderers.renderIcon(node),
			isLeaf: true,
		};
	}
	
	return {
		key: getEntryTreeFolderKey(node.id),
		title: renderers.renderTitle(node),
		icon: renderers.renderIcon(node),
		selectable: false,
		children: node.children.map((childNode) => {
			return mapEntryNodeToTreeData(childNode, renderers);
		}),
	};
};

/**
 * @summary 객체 레코드 타입 가드
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

/**
 * @summary MEDIA 파일 단건 데이터 정규화
 */
export const toUpsertMediaFileRequest = (value: unknown): UpsertMediaFileRequest | undefined => {
	if (!isObjectRecord(value)) {
		return undefined;
	}

	const url = value.url;
	const path = value.path;
	const mimeType = value.mimeType;
	const name = value.name;
	const size = value.size;
	const ext = value.ext;
	const provider = value.provider;

	if (typeof url !== "string" || url.length < 1) {
		return undefined;
	}

	if (typeof path !== "string" || path.length < 1) {
		return undefined;
	}

	if (typeof mimeType !== "string" || mimeType.length < 1) {
		return undefined;
	}

	if (typeof name !== "string" || name.length < 1) {
		return undefined;
	}

	if (typeof size !== "number" || size < 1) {
		return undefined;
	}

	if (typeof ext !== "string") {
		return undefined;
	}

	if (
		provider !== upsertMediaFileRequestProviderEnum.AWS &&
		provider !== upsertMediaFileRequestProviderEnum.GCP &&
		provider !== upsertMediaFileRequestProviderEnum.NCP &&
		provider !== upsertMediaFileRequestProviderEnum.LOCAL
	) {
		return undefined;
	}

	return {url, path, mimeType, name, size, ext, provider};
};

/**
 * @summary MEDIA 컬럼 값에서 파일 목록 추출
 */
export const extractEntryMediaFiles = (value: unknown): UpsertMediaFileRequest[] => {
	if (Array.isArray(value)) {
		return value
			.map((file) => toUpsertMediaFileRequest(file))
			.filter((file): file is UpsertMediaFileRequest => typeof file !== "undefined");
	}

	if (!isObjectRecord(value)) {
		return [];
	}

	if (Array.isArray(value.files)) {
		return value.files
			.map((file) => toUpsertMediaFileRequest(file))
			.filter((file): file is UpsertMediaFileRequest => typeof file !== "undefined");
	}

	const singleMediaFile = toUpsertMediaFileRequest(value);
	if (singleMediaFile) {
		return [singleMediaFile];
	}

	return [];
};

/**
 * @summary Presigned URL 업로드 실행
 * biome-ignore format: KEEP
 */
export const uploadFileToPresignedUrl = (method: string, presignedUrl: string, file: File, onProgress: (percent: number) => void): Promise<void> => {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open(method, presignedUrl);
		if (file.type.length > 0) {
			request.setRequestHeader("Content-Type", file.type);
		}
		request.upload.onprogress = (event) => {
			if (!event.lengthComputable) {
				return;
			}

			onProgress(Math.round((event.loaded / event.total) * 100));
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
		request.send(file);
	});
};

/**
 * @summary MEDIA 업로드 파일 목록 조회
 */
export const getEntryMediaUploadFileList = <T>(uploadFileListByColumn: Record<string, T[]>, columnName: string): T[] => {
	const foundUploadFileList = uploadFileListByColumn[columnName];
	if (!Array.isArray(foundUploadFileList)) {
		return [];
	}

	return foundUploadFileList;
};

/**
 * @summary 선택된 MEDIA 파일 목록을 Upload fileList로 복원합니다.
 */
export const createEntryMediaUploadFileListFromMediaFiles = (
	columnName: string,
	mediaFiles: UpsertMediaFileRequest[],
): WidgetMediaUploaderFile[] => {
	return mediaFiles.map((mediaFile, mediaFileIndex) => {
		return toWidgetMediaUploaderFile(mediaFile, `selected-${columnName}-${mediaFileIndex}`);
	});
};

/**
 * @summary MEDIA 컬럼별 업로드 파일 목록을 갱신합니다.
 * biome-ignore format: KEEP
 */
export const updateEntryMediaUploadFileListByColumn = <T extends EntryMediaUploadFileWithUid>(uploadFileListByColumn: Record<string, T[]>, columnName: string, updater: (uploadFileList: T[]) => T[]): Record<string, T[]> => {
	return {...uploadFileListByColumn, [columnName]: updater(getEntryMediaUploadFileList(uploadFileListByColumn, columnName))};
};

/**
 * @summary MEDIA 업로드 파일 한 건 상태를 갱신합니다.
 * biome-ignore format: KEEP
 */
export const updateEntryMediaUploadFileByUid = <T extends EntryMediaUploadFileWithUid>(uploadFileListByColumn: Record<string, T[]>, columnName: string, fileUid: string, updater: (uploadFile: T) => T): Record<string, T[]> => {
	return updateEntryMediaUploadFileListByColumn(uploadFileListByColumn, columnName, (uploadFileList) => {
		return uploadFileList.map((uploadFile) => {
			if (uploadFile.uid !== fileUid) {
				return uploadFile;
			}

			return updater(uploadFile);
		});
	});
};

type EntryMediaUploadFileLike = {response?: unknown; status?: string};

/**
 * @summary Upload fileList 기반 업로드 완료 MEDIA 파일 메타 추출
 */
export const getEntryUploadedMediaFilesFromUploadFileList = (uploadFileList: EntryMediaUploadFileLike[]): UpsertMediaFileRequest[] => {
	return uploadFileList
		.map((uploadFile) => toUpsertMediaFileRequest(uploadFile.response))
		.filter((mediaFile): mediaFile is UpsertMediaFileRequest => typeof mediaFile !== "undefined");
};

/**
 * @summary Upload fileList 기준 MEDIA 업로드 진행 상태 여부 확인
 */
export const hasEntryMediaUploadingFile = (uploadFileList: EntryMediaUploadFileLike[]): boolean => {
	return uploadFileList.some((uploadFile) => uploadFile.status === "uploading");
};

/**
 * @summary MEDIA 컬럼 폼 검증 규칙 생성
 */
export const buildEntryMediaColumnRules = (column: Pick<ContentTypeColumnResponse, "required">): RuleObject[] => {
	if (column.required !== true) {
		return [];
	}

	return [
		{
			validator: async (_rule: unknown, value: unknown) => {
				if (!Array.isArray(value)) {
					throw new Error("Please upload at least one media file.");
				}

				const uploadFileList = value as EntryMediaUploadFileLike[];
				if (uploadFileList.length < 1) {
					throw new Error("Please upload at least one media file.");
				}

				const hasUploadPendingOrDoneFile = uploadFileList.some((uploadFile) => {
					if (uploadFile.status === "uploading" || uploadFile.status === "done") {
						return true;
					}

					return typeof toUpsertMediaFileRequest(uploadFile.response) !== "undefined";
				});
				if (hasUploadPendingOrDoneFile) {
					return;
				}

				throw new Error("Please upload at least one media file.");
			},
		},
	];
};
