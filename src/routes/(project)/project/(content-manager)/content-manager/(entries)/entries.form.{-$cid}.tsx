import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Activity, Fragment, type MouseEventHandler, useEffect, useState} from "react";
import {useModal} from "@ebay/nice-modal-react";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import type {WidgetMediaUploaderFile} from "@/components/widget/media-uploader/widget-media-uploader.ts";
import UiButton from "@/components/ui/button/ui-button.tsx";
import {useForm} from "antd/es/form/Form";
import {toNumber} from "es-toolkit/compat";
import {z} from "zod";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiTextArea from "@/components/ui/input/ui-text-area.tsx";
import UiInputNumber from "@/components/ui/input/ui-input-number.tsx";
import UiSelect from "@/components/ui/select/ui-select.tsx";
import UiDatePicker from "@/components/ui/datepicker/ui-date-picker.tsx";
import UiRadioGroup from "@/components/ui/radio/ui-radio-group.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {
	type ContentTypeColumnResponse,
	contentTypeColumnResponseDateTypeEnum,
	contentTypeColumnResponseFieldTypeEnum,
	contentTypeColumnResponseTextTypeEnum,
} from "@/services/types/content-type-column-response.ts";
import {config} from "@/entry/config.ts";
import {screamingSnakeCase} from "@kubb/core/transformers";
import clsx from "clsx";
import {useQueryClient} from "@tanstack/react-query";
import "./entries.css";
import {util} from "@/entry/util.ts";
import isNonNullable from "antd/es/_util/isNonNullable";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import UiFormProvider, {type UiFormProviderProps} from "@/components/ui/form/ui-form-provider.tsx";
import {useContentManagerGetTableInfoSuspense} from "@/services/hooks/content-manager/use-content-manager-get-table-info-suspense.ts";
import {useContentManagerGetItem} from "@/services/hooks/content-manager/use-content-manager-get-item.ts";
import {useContentManagerUpsert} from "@/services/hooks/content-manager/use-content-manager-upsert.ts";
import {useContentManagerRemoves} from "@/services/hooks/content-manager/use-content-manager-removes.ts";
import type {UpsertMediaFileRequest} from "@/services/types/upsert-media-file-request.ts";
import type {ContentManagerUpsertMutationRequest} from "@/services/types/content-manager/content-manager-upsert.ts";
import {contentManagerSearchContentsSuspenseQueryKey} from "@/services/hooks/content-manager/use-content-manager-search-contents-suspense.ts";
import UiDivider from "@/components/ui/divider/ui-divider.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import {Attachment, Trash, Upload, FolderOpen, RefreshCcw} from "griddy-icons";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import ModalEntryMediaList from "./-local/modal-entry-media-list.tsx";
import ModalEntryMediaUpload from "./-local/modal-entry-media-upload.tsx";
import {
	buildEntryMediaColumnRules,
	buildColumnRules,
	createEntryMediaUploadFileListFromMediaFiles,
	type EntryFormValues,
	type EntryTableInfoSelectData,
	extractEntryMediaFiles,
	getEntryDatePickerValueProps,
	getEntryMediaUploadFileList,
	getEntryUploadedMediaFilesFromUploadFileList,
	hasEntryMediaUploadingFile,
	normalizeEmptyStringToNull,
	normalizeEntryDatePickerValue,
	toEntryMediaColumnRequestName,
	updateEntryMediaUploadFileListByColumn,
} from "./entries.ts";
import {
	formatMediaLibraryAssetSize,
	getMediaLibraryQueryInvalidationKey,
} from "@/routes/(project)/project/(media-library)/media-library.ts";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/(entries)/entries/form/{-$cid}")({
	component: RouteComponent,
	validateSearch: z.object({table: z.string()}),
});

const IMAGE_FILE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"] as const;

/**
 * @summary 엔트리 MEDIA가 이미지 형식인지 판별합니다.
 */
const isEntryMediaImageFile = (mediaFile: UpsertMediaFileRequest) => {
	if (mediaFile.mimeType.startsWith("image/")) {
		return true;
	}

	const fileExtension = mediaFile.ext.toLowerCase().replace(".", "");
	if (IMAGE_FILE_EXTENSIONS.includes(fileExtension as (typeof IMAGE_FILE_EXTENSIONS)[number])) {
		return true;
	}

	return false;
};

/**
 * @summary RELATION 컬럼의 폼 바인딩 키를 계산합니다.
 */
const resolveRelationFieldName = (columnName: string) => {
	if (columnName.endsWith("_id")) {
		return columnName;
	}

	return `${columnName}_id`;
};

/**
 * @summary 엔트리 생성/수정 화면
 */
export function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [form] = useForm<EntryFormValues>();
	const {UiForm, UiFormItem} = createTypedForm<EntryFormValues>();
	const queryClient = useQueryClient();
	const isEdit = isNonNullable(params.cid);
	const modalEntryMediaList = useModal(ModalEntryMediaList);
	const modalEntryMediaUpload = useModal(ModalEntryMediaUpload);
	const [mediaUploadFileListByColumn, setMediaUploadFileListByColumn] = useState<Record<string, WidgetMediaUploaderFile[]>>({});

	/**
	 * @description 테이블/컬럼 정보 조회(등록, 수정용) API
	 */
	const responseContentManagerGetTableInfoSuspense = useContentManagerGetTableInfoSuspense<EntryTableInfoSelectData>(
		{tableName: search.table, includeSystemColumns: false, includePrivate: true},
		{
			query: {
				select: (data) => {
					const columns = data.data.list;
					const defaultValues = Object.fromEntries(
						columns.map((column) => {
							const fieldName =
								column.fieldType === contentTypeColumnResponseFieldTypeEnum.RELATION ? resolveRelationFieldName(column.name) : column.name;

							return [fieldName, column.defaultValue];
						}),
					);

					return {columns: columns, defaultValues: defaultValues};
				},
			},
		},
	);
	/**
	 * @description 컨텐츠 상세 조회 API
	 */
	const responseContentManagerGetItem = useContentManagerGetItem<{column: Record<string, unknown>}>(
		toNumber(params.cid),
		{tableName: search.table, includePrivate: true},
		{
			query: {
				enabled: isEdit,
				select: (data) => {
					const rawColumn = data.data.list[0] as Record<string, unknown>;
					const nextColumn = {...rawColumn};

					for (let index = 0; index < responseContentManagerGetTableInfoSuspense.data.columns.length; index += 1) {
						const column = responseContentManagerGetTableInfoSuspense.data.columns[index] as ContentTypeColumnResponse;
						if (column.fieldType !== contentTypeColumnResponseFieldTypeEnum.RELATION) {
							continue;
						}

						const relationFieldName = resolveRelationFieldName(column.name);
						if (typeof nextColumn[relationFieldName] !== "undefined") {
							continue;
						}

						nextColumn[relationFieldName] = nextColumn[column.name];
					}

					return {column: nextColumn};
				},
			},
		},
	);
	/**
	 * @description 컨텐츠 생성/수정 API (body에 id가 있으면 UPDATE, 없으면 INSERT)
	 */
	const mutationContentManagerUpsert = useContentManagerUpsert({
		mutation: {
			onSuccess: () => {
				void queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(contentManagerSearchContentsSuspenseQueryKey)});
				void queryClient.invalidateQueries({queryKey: getMediaLibraryQueryInvalidationKey()});
				void navigate({to: "/project/content-manager/entries", search: {table: search.table}});
			},
		},
	});
	/**
	 * @description 컨텐츠 삭제 API
	 */
	const mutationContentManagerRemoves = useContentManagerRemoves({
		mutation: {
			onSuccess: () => {
				void queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(contentManagerSearchContentsSuspenseQueryKey)});
				void navigate({to: "/project/content-manager/entries", search: {table: search.table}});
			},
		},
	});
	/**
	 * @summary 테이블 변경 시 MEDIA 업로드 상태 초기화
	 */
	useEffect(() => {
		setMediaUploadFileListByColumn({});
	}, [params.cid, search.table]);

	/**
	 * @summary 수정 화면 진입 시 기존 MEDIA 파일 목록 복원
	 */
	useEffect(() => {
		if (!isEdit) {
			return;
		}

		if (!responseContentManagerGetItem.data) {
			return;
		}

		const nextMediaUploadFileListByColumn: Record<string, WidgetMediaUploaderFile[]> = {};

		for (let index = 0; index < responseContentManagerGetTableInfoSuspense.data.columns.length; index += 1) {
			const column = responseContentManagerGetTableInfoSuspense.data.columns[index] as ContentTypeColumnResponse;
			if (column.fieldType !== contentTypeColumnResponseFieldTypeEnum.MEDIA) {
				continue;
			}

			const rawMediaColumnValue = responseContentManagerGetItem.data.column[column.name];
			const extractedMediaFiles = extractEntryMediaFiles(rawMediaColumnValue);
			const mediaUploadFileList = createEntryMediaUploadFileListFromMediaFiles(column.name, extractedMediaFiles);

			nextMediaUploadFileListByColumn[column.name] = mediaUploadFileList;
			form.setFieldValue([column.name], mediaUploadFileList);
		}

		setMediaUploadFileListByColumn(nextMediaUploadFileListByColumn);
	}, [form, isEdit, responseContentManagerGetItem.data, responseContentManagerGetTableInfoSuspense.data.columns]);

	/**
	 * @summary MEDIA 업로드 파일 목록 폼 동기화
	 */
	useEffect(() => {
		for (let index = 0; index < responseContentManagerGetTableInfoSuspense.data.columns.length; index += 1) {
			const column = responseContentManagerGetTableInfoSuspense.data.columns[index] as ContentTypeColumnResponse;
			if (column.fieldType !== contentTypeColumnResponseFieldTypeEnum.MEDIA) {
				continue;
			}

			form.setFieldValue([column.name], getEntryMediaUploadFileList(mediaUploadFileListByColumn, column.name));
		}
	}, [form, mediaUploadFileListByColumn, responseContentManagerGetTableInfoSuspense.data.columns]);

	/**
	 * @summary 컬럼별 MEDIA fileList 제어 핸들러
	 */
	const handleMediaUploadFileListChange = (columnName: string, nextFileList: WidgetMediaUploaderFile[]) => {
		setMediaUploadFileListByColumn((prevMediaUploadFileListByColumn) => {
			return updateEntryMediaUploadFileListByColumn(prevMediaUploadFileListByColumn, columnName, () => nextFileList);
		});
	};

	/**
	 * @summary 미디어 라이브러리 picker를 열고 선택 결과를 반영합니다.
	 */
	const handleMediaLibrarySelectButtonClick =
		(columnName: string, columnTitle: string): MouseEventHandler<HTMLButtonElement> =>
		async (_event) => {
			const selectedMediaFiles = getEntryUploadedMediaFilesFromUploadFileList(
				getEntryMediaUploadFileList(mediaUploadFileListByColumn, columnName),
			);
			const selectedAssets = await modalEntryMediaList.show({mode: "select", columnTitle, selectedMediaFiles});

			if (!Array.isArray(selectedAssets)) {
				return;
			}

			handleMediaUploadFileListChange(columnName, createEntryMediaUploadFileListFromMediaFiles(columnName, selectedAssets));
		};

	/**
	 * @summary 업로드 모달을 열고 선택 결과를 반영합니다.
	 */
	const handleMediaUploadButtonClick =
		(columnName: string, columnTitle: string): MouseEventHandler<HTMLButtonElement> =>
		async (_event) => {
			const selectedMediaFiles = getEntryUploadedMediaFilesFromUploadFileList(
				getEntryMediaUploadFileList(mediaUploadFileListByColumn, columnName),
			);
			const uploadedMediaFiles = await modalEntryMediaUpload.show({columnName, columnTitle, tableName: search.table, selectedMediaFiles});

			if (!Array.isArray(uploadedMediaFiles)) {
				return;
			}

			handleMediaUploadFileListChange(columnName, createEntryMediaUploadFileListFromMediaFiles(columnName, uploadedMediaFiles));
		};

	/**
	 * @summary MEDIA 단건 제거
	 */
	const handleMediaItemRemoveButtonClick = (columnName: string, filePath: string) => {
		const currentMediaFiles = getEntryUploadedMediaFilesFromUploadFileList(
			getEntryMediaUploadFileList(mediaUploadFileListByColumn, columnName),
		);
		const nextMediaFiles = currentMediaFiles.filter((mediaFile) => mediaFile.path !== filePath);

		handleMediaUploadFileListChange(columnName, createEntryMediaUploadFileListFromMediaFiles(columnName, nextMediaFiles));
	};

	/**
	 * @summary 로우 하나 만들기 또는 수정하고 페이지이동
	 */
	const handleFormFinish: UiFormProviderProps["onFormFinish"] = (name, info) => {
		if (name !== "content-manager-form") {
			return;
		}

		const nextBody: Record<string, unknown> = {...info.values};

		const fileRequests: NonNullable<ContentManagerUpsertMutationRequest["fileRequests"]> = [];

		for (let index = 0; index < responseContentManagerGetTableInfoSuspense.data.columns.length; index += 1) {
			const column = responseContentManagerGetTableInfoSuspense.data.columns[index] as ContentTypeColumnResponse;

			if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.RELATION && !column.name.endsWith("_id")) {
				nextBody[`${column.name}_id`] = nextBody[column.name];
				delete nextBody[column.name];
			}

			if (column.fieldType !== contentTypeColumnResponseFieldTypeEnum.MEDIA) {
				continue;
			}

			const mediaUploadFileList = getEntryMediaUploadFileList(mediaUploadFileListByColumn, column.name);
			if (hasEntryMediaUploadingFile(mediaUploadFileList)) {
				modal.warning({title: "Media upload in progress", content: "Please wait until all files finish uploading."});
				return;
			}

			delete nextBody[column.name];

			fileRequests.push({
				columnName: toEntryMediaColumnRequestName(column.name),
				files: getEntryUploadedMediaFilesFromUploadFileList(mediaUploadFileList),
			});
		}

		if (params.cid) {
			nextBody.id = toNumber(params.cid);
		}

		const upsertContentMutationRequest: ContentManagerUpsertMutationRequest = {body: nextBody, fileRequests};

		mutationContentManagerUpsert.mutate({params: {tableName: search.table, includePrivate: true}, data: upsertContentMutationRequest});
	};
	/**
	 * @summary 컨텐츠를 삭제합니다 이후 목록으로 이동
	 */
	const handleContentRemoveButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.error(
			modalPreset.remove({
				onOk: (..._args) => {
					mutationContentManagerRemoves.mutate({params: {tableName: search.table, ids: [toNumber(params.cid)]}});
				},
			}),
		);
	};
	/**
	 * @summary 목록으로 돌아가요
	 */
	const handleCancelClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void navigate({to: "/project/content-manager/entries", search: {table: search.table}});
	};

	return (
		<UiFormProvider onFormFinish={handleFormFinish}>
			<Fragment>
				<WidgetContentHeader title={params.cid ? "Edit an entry" : "Create an entry"} desc={search.table}>
					<UiButton onClick={handleCancelClick}>Cancel</UiButton>
					<Activity mode={isEdit ? "visible" : "hidden"}>
						<Fragment>
							<UiDivider orientation="vertical" />
							<UiButton danger onClick={handleContentRemoveButtonClick}>
								Delete
							</UiButton>
						</Fragment>
					</Activity>
					<UiButton type="primary" htmlType="submit" onClick={form.submit}>
						Save
					</UiButton>
				</WidgetContentHeader>
				<WidgetContentBody>
					<div className={clsx("rt_pcmf__form")}>
						<UiForm
							key={isEdit ? `edit-${params.cid}-${responseContentManagerGetItem.status}` : "create"}
							form={form}
							name={"content-manager-form"}
							layout={"vertical"}
							initialValues={
								isEdit ? responseContentManagerGetItem.data?.column : responseContentManagerGetTableInfoSuspense.data.defaultValues
							}
						>
							<UiTypoTitle level={4}>Entry details</UiTypoTitle>
							<div className={clsx("rt_pcmf__grid")}>
								{responseContentManagerGetTableInfoSuspense.data.columns.map((column) => {
									const label = screamingSnakeCase(column.name);
									const columnRules = buildColumnRules(column);

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.MEDIA) {
										return null;
									}
									//입력 받을 때는 굳이 테넌트를 표시하지 않음. 필요하다면 추후에 권한이 있을 때만 표시하도록 변경
									if (column.name === "tenant" && !isEdit) {
										return null;
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.TEXT) {
										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[column.name]} rules={columnRules}>
													{column.textType === contentTypeColumnResponseTextTypeEnum.LONG_TEXT ? (
														<UiTextArea placeholder={`Enter ${label.toLowerCase()}`} />
													) : (
														<UiInput placeholder={`Enter ${label.toLowerCase()}`} />
													)}
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.BOOLEAN) {
										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[column.name]} rules={columnRules}>
													<UiRadioGroup
														options={[
															{label: "True", value: true},
															{label: "False", value: false},
														]}
													/>
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.JSON) {
										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[column.name]} rules={columnRules} normalize={normalizeEmptyStringToNull}>
													<UiTextArea rows={6} placeholder={"Enter JSON"} />
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.NUMBER) {
										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[column.name]} rules={columnRules}>
													<UiInputNumber placeholder={`Enter ${label.toLowerCase()}`} min={column.minValue} max={column.maxValue} />
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.DATE) {
										const dateType = column.dateType || contentTypeColumnResponseDateTypeEnum.DATE;
										const pickerProps = config.date.pickerMap[dateType];

										return (
											<div key={column.name}>
												<UiFormItem
													label={label}
													name={[column.name]}
													rules={columnRules}
													getValueProps={(value: string) => getEntryDatePickerValueProps(value, dateType)}
													normalize={(value) => normalizeEntryDatePickerValue(value, dateType)}
												>
													<UiDatePicker style={{width: "100%"}} placeholder={`Select ${label.toLowerCase()}`} {...pickerProps} />
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.ENUMERATION) {
										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[column.name]} rules={columnRules}>
													<UiSelect
														allowClear
														options={(column.enumValues || []).map((value) => ({label: value, value}))}
														placeholder={`Select ${label.toLowerCase()}`}
													/>
												</UiFormItem>
											</div>
										);
									}

									if (column.fieldType === contentTypeColumnResponseFieldTypeEnum.RELATION) {
										const relationFieldName = resolveRelationFieldName(column.name);

										return (
											<div key={column.name}>
												<UiFormItem label={label} name={[relationFieldName]} rules={columnRules}>
													<UiInputNumber disabled={column.name === "tenant"} placeholder={`Enter ${label.toLowerCase()}`} />
												</UiFormItem>
											</div>
										);
									}

									return (
										<div key={column.name}>
											<UiFormItem label={label} name={[column.name]} rules={columnRules}>
												<UiInput placeholder={`Enter ${label.toLowerCase()}`} />
											</UiFormItem>
										</div>
									);
								})}
							</div>
							<Activity
								mode={
									responseContentManagerGetTableInfoSuspense.data.columns.some(
										(column) => column.fieldType === contentTypeColumnResponseFieldTypeEnum.MEDIA,
									)
										? "visible"
										: "hidden"
								}
							>
								<Fragment>
									<UiDivider />
									<UiTypoTitle level={4}>Media</UiTypoTitle>
									<div className={clsx("rt_pcmf__mediaGrid")}>
										{responseContentManagerGetTableInfoSuspense.data.columns.map((column) => {
											if (column.fieldType !== contentTypeColumnResponseFieldTypeEnum.MEDIA) {
												return null;
											}

											const label = screamingSnakeCase(column.name);
											const mediaUploadFileList = getEntryMediaUploadFileList(mediaUploadFileListByColumn, column.name);
											const mediaFiles = getEntryUploadedMediaFilesFromUploadFileList(mediaUploadFileList);
											const mediaColumnRules = buildEntryMediaColumnRules(column);

											return (
												<div key={column.name}>
													<UiFormItem label={label} name={[column.name]} rules={mediaColumnRules} validateTrigger={"onSubmit"}>
														<div className={clsx("rt_pcmf__mediaField")}>
															<div className={clsx("rt_pcmf__mediaActions")}>
																<UiButton
																	type="primary"
																	icon={<FolderOpen {...iconPreset.outlined()} />}
																	onClick={handleMediaLibrarySelectButtonClick(column.name, label)}
																>
																	Media Library
																</UiButton>
																<UiButton
																	type="primary"
																	icon={<Upload {...iconPreset.outlined()} />}
																	onClick={handleMediaUploadButtonClick(column.name, label)}
																>
																	Upload files
																</UiButton>
															</div>
															<Activity mode={mediaFiles.length > 0 ? "visible" : "hidden"}>
																<div className={clsx("rt_pcmf__mediaListHeader")}>
																	<UiTypoText type="secondary">선택된 파일 {mediaFiles.length}개</UiTypoText>
																	<Activity mode={mediaFiles.length > 0 ? "visible" : "hidden"}>
																		<UiButton
																			type="text"
																			danger
																			icon={<RefreshCcw {...iconPreset.outlined()} />}
																			onClick={() => {
																				handleMediaUploadFileListChange(column.name, []);
																			}}
																		>
																			Clear
																		</UiButton>
																	</Activity>
																</div>
																<div className={clsx("rt_pcmf__mediaList")}>
																	{mediaFiles.map((mediaFile) => {
																		const isImageFile = isEntryMediaImageFile(mediaFile);
																		let mediaFileExtensionLabel = "FILE";
																		if (mediaFile.ext.trim().length > 0) {
																			mediaFileExtensionLabel = mediaFile.ext.replace(".", "").toUpperCase();
																		}
																		const mediaFileMetaLabel = `${mediaFileExtensionLabel} · ${formatMediaLibraryAssetSize(mediaFile.size)}`;

																		return (
																			<div key={mediaFile.path} className={clsx("rt_pcmf__mediaListItem")}>
																				<a
																					href={mediaFile.url}
																					target="_blank"
																					rel="noopener noreferrer"
																					className={clsx("rt_pcmf__mediaListLink")}
																				>
																					<div className={clsx("rt_pcmf__mediaListThumb")}>
																						<Activity mode={isImageFile ? "visible" : "hidden"}>
																							<img src={mediaFile.url} alt={mediaFile.name} className={clsx("rt_pcmf__mediaListImage")} />
																						</Activity>
																						<Activity mode={isImageFile ? "hidden" : "visible"}>
																							<div className={clsx("rt_pcmf__mediaListIcon")}>
																								<Attachment {...iconPreset.outlined({size: 18})} />
																							</div>
																						</Activity>
																					</div>
																					<div className={clsx("rt_pcmf__mediaListInfo")}>
																						<UiTypoText strong>{mediaFile.name}</UiTypoText>
																						<UiTypoText type="secondary">{mediaFileMetaLabel}</UiTypoText>
																					</div>
																				</a>
																				<UiButton
																					type="text"
																					icon={<Trash {...iconPreset.outlined()} />}
																					onClick={() => {
																						handleMediaItemRemoveButtonClick(column.name, mediaFile.path);
																					}}
																				/>
																			</div>
																		);
																	})}
																</div>
															</Activity>
															<Activity mode={mediaFiles.length < 1 ? "visible" : "hidden"}>
																<UiEmpty description="No media files selected" />
															</Activity>
														</div>
													</UiFormItem>
												</div>
											);
										})}
									</div>
								</Fragment>
							</Activity>
						</UiForm>
					</div>
				</WidgetContentBody>
			</Fragment>
		</UiFormProvider>
	);
}
