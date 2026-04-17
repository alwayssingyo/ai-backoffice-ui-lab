import {type MouseEventHandler, useEffect, useState} from "react";
import clsx from "clsx";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCheckbox from "@/components/ui/checkbox/ui-checkbox.tsx";
import type {ApiEndpointResponse} from "@/services/types/api-endpoint-response.ts";
import type {ApiEndpointSaveRequest, ApiEndpointSaveRequestHttpMethodsEnumKey} from "@/services/types/api-endpoint-save-request.ts";
import "./modal-permission-form.css";

export type ModalPermissionAccessFormValues = {apiEndpoints: ApiEndpointSaveRequest[]};

interface ModalPermissionAccessFormProps {
	initialValues: ModalPermissionAccessFormValues;
	endpoints: ApiEndpointResponse[];
}

const ModalPermissionAccessForm = (props: ModalPermissionAccessFormProps) => {
	const {initialValues, endpoints} = props;
	const modal = useModal();
	const [selectedApiEndpoints, setSelectedApiEndpoints] = useState<ApiEndpointSaveRequest[]>([]);

	/**
	 * @summary 모달 초기값을 로컬 상태에 반영합니다.
	 */
	useEffect(() => {
		setSelectedApiEndpoints(initialValues.apiEndpoints);
	}, [initialValues.apiEndpoints]);

	/**
	 * @summary 태그명으로 선택된 메서드 목록을 조회합니다.
	 */
	const getSelectedHttpMethods = (tagName: string) => {
		const foundApiEndpoint = selectedApiEndpoints.find((apiEndpoint) => apiEndpoint.tagName === tagName);
		if (!foundApiEndpoint) {
			return [] as ApiEndpointSaveRequestHttpMethodsEnumKey[];
		}

		return foundApiEndpoint.httpMethods;
	};

	/**
	 * @summary 체크박스 변경에 따라 태그별 메서드 목록을 갱신합니다.
	 */
	const handleMethodToggle = (tagName: string, httpMethod: ApiEndpointSaveRequestHttpMethodsEnumKey, isChecked: boolean) => {
		setSelectedApiEndpoints((prevApiEndpoints) => {
			const foundApiEndpoint = prevApiEndpoints.find((apiEndpoint) => apiEndpoint.tagName === tagName);
			const prevHttpMethods = foundApiEndpoint ? foundApiEndpoint.httpMethods : [];
			const hasHttpMethod = prevHttpMethods.includes(httpMethod);

			let nextHttpMethods = prevHttpMethods;

			if (isChecked && !hasHttpMethod) {
				nextHttpMethods = [...prevHttpMethods, httpMethod];
			}
			if (!isChecked) {
				nextHttpMethods = prevHttpMethods.filter((method) => method !== httpMethod);
			}

			if (!foundApiEndpoint && !isChecked) {
				return prevApiEndpoints;
			}

			if (!foundApiEndpoint && isChecked) {
				return [...prevApiEndpoints, {tagName: tagName, httpMethods: nextHttpMethods}];
			}

			if (nextHttpMethods.length === 0) {
				return prevApiEndpoints.filter((apiEndpoint) => apiEndpoint.tagName !== tagName);
			}

			return prevApiEndpoints.map((apiEndpoint) => {
				if (apiEndpoint.tagName !== tagName) {
					return apiEndpoint;
				}

				return {tagName: tagName, httpMethods: nextHttpMethods};
			});
		});
	};

	/**
	 * @summary 모달 저장 시 선택된 엔드포인트 메서드 목록을 반환합니다.
	 */
	const handleSaveButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		const normalizedApiEndpoints = endpoints.map((endpoint) => ({
			tagName: endpoint.tagName,
			httpMethods: getSelectedHttpMethods(endpoint.tagName),
		}));

		modal.resolve({apiEndpoints: normalizedApiEndpoints});
		void modal.hide();
	};

	/**
	 * @summary 모달 취소 시 결과 없이 닫습니다.
	 */
	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.resolve(null);
		void modal.hide();
	};

	return (
		<UiModal onCancel={handleCancelButtonClick} width={800}>
			<div className={clsx("loc_mpermi")}>
				<UiTypoTitle level={4}>Edit access by menu</UiTypoTitle>
				<div className={clsx("loc_mpermi__form")}>
					<div className={clsx("loc_mpermi__matrix")}>
						<div className={clsx("loc_mpermi__matrixBody")}>
							{endpoints.map((endpoint) => {
								const selectedHttpMethods = getSelectedHttpMethods(endpoint.tagName);

								return (
									<div key={endpoint.tagName} className={clsx("loc_mpermi__matrixRow")}>
										<div className={clsx("loc_mpermi__matrixInfo")}>
											<UiTypoText strong>{endpoint.tagName}</UiTypoText>
											<UiTypoText type="secondary">{endpoint.tagDescription || "-"}</UiTypoText>
										</div>
										<div className={clsx("loc_mpermi__matrixActions")}>
											{endpoint.httpMethods.map((httpMethod) => (
												// biome-ignore lint/a11y/noLabelWithoutControl: UiCheckbox가 내부 input과 label 연결을 처리합니다.
												<label key={`${endpoint.tagName}-${httpMethod}`} className={clsx("loc_mpermi__matrixAction")}>
													<UiCheckbox
														checked={selectedHttpMethods.includes(httpMethod)}
														onChange={(event) => {
															handleMethodToggle(endpoint.tagName, httpMethod, event.target.checked);
														}}
													/>
													<UiTypoText>{httpMethod}</UiTypoText>
												</label>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className={clsx("loc_mpermi__actions")}>
						<UiButton onClick={handleCancelButtonClick}>Cancel</UiButton>
						<UiButton type={"primary"} onClick={handleSaveButtonClick}>
							Save
						</UiButton>
					</div>
				</div>
			</div>
		</UiModal>
	);
};

export default NiceModal.create(ModalPermissionAccessForm);
