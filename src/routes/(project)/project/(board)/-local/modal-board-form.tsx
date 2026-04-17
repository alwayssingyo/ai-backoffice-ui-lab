import {Fragment, type MouseEventHandler, useEffect} from "react";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import {useForm} from "antd/es/form/Form";
import type {Callbacks} from "@rc-component/form/lib/interface";
import clsx from "clsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiTextArea from "@/components/ui/input/ui-text-area.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiSelect from "@/components/ui/select/ui-select.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {
	buildBoardGradeRules,
	buildBoardNameRules,
	buildBoardTitleRules,
	normalizeBoardContent,
	normalizeBoardName,
	normalizeNoticeGrade,
	type BoardFormValues,
	type BoardRouteConfig,
} from "../board.ts";
import "./modal-board-form.css";

interface ModalBoardFormProps {
	boardLabel: string;
	routeConfig: BoardRouteConfig;
	initialValues?: BoardFormValues;
	dontUseThisProp?: never;
}

const ModalBoardForm = (props: ModalBoardFormProps) => {
	const {boardLabel, dontUseThisProp, initialValues, routeConfig} = props;
	const [form] = useForm<BoardFormValues>();
	const {UiForm, UiFormItem} = createTypedForm<BoardFormValues>();
	const modal = useModal();
	const isEdit = typeof initialValues?.id === "number";

	useEffect(() => {
		form.setFieldsValue({
			name: initialValues?.name ?? "",
			grade: initialValues?.grade ?? routeConfig.defaultGrade,
			title: initialValues?.title ?? "",
			content: initialValues?.content ?? "",
		});
	}, [form, initialValues]);

	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.resolve(null);
		void modal.hide();
	};

	const handleFinish: Callbacks<BoardFormValues>["onFinish"] = (values) => {
		modal.resolve({
			...values,
			...(typeof initialValues?.id === "number" ? {id: initialValues.id} : {}),
			...(routeConfig.formMode === "rich"
				? {
						grade: routeConfig.gradeOptions ? normalizeNoticeGrade(values.grade) : normalizeBoardName(values.grade ?? ""),
						title: normalizeBoardName(values.title ?? ""),
						content: normalizeBoardContent(values.content),
					}
				: {name: normalizeBoardName(values.name ?? "")}),
		});
		void modal.hide();
	};

	return (
		<Fragment>
			{dontUseThisProp}
			<UiModal onCancel={handleCancelButtonClick}>
				<div className={clsx("loc_mbof")}>
					<UiTypoTitle level={4}>{isEdit ? `${boardLabel} 수정` : `${boardLabel} 추가`}</UiTypoTitle>
					<div className={clsx("loc_mbof__form")}>
						<UiForm
							form={form}
							layout={"vertical"}
							onFinish={handleFinish}
							initialValues={{
								name: initialValues?.name ?? "",
								grade: initialValues?.grade ?? routeConfig.defaultGrade,
								title: initialValues?.title ?? "",
								content: initialValues?.content ?? "",
							}}
						>
							{routeConfig.formMode === "rich" ? (
								<Fragment>
									<UiFormItem
										label={routeConfig.gradeLabel ?? "등급"}
										name={["grade"]}
										rules={buildBoardGradeRules({label: routeConfig.gradeLabel ?? "등급", options: routeConfig.gradeOptions})}
									>
										{routeConfig.gradeOptions ? (
											<UiSelect
												options={routeConfig.gradeOptions.map((option) => ({label: option.label, value: option.value}))}
												placeholder={routeConfig.gradePlaceholder ?? "등급을 선택해 주세요."}
											/>
										) : (
											<UiInput placeholder={routeConfig.gradePlaceholder ?? "등급을 입력해 주세요."} maxLength={255} />
										)}
									</UiFormItem>
									<UiFormItem
										label={routeConfig.titleLabel ?? "제목"}
										name={["title"]}
										rules={buildBoardTitleRules(routeConfig.titleLabel ?? "제목")}
									>
										<UiInput placeholder={routeConfig.titlePlaceholder ?? "제목을 입력해 주세요."} maxLength={500} />
									</UiFormItem>
									<UiFormItem label={routeConfig.contentLabel ?? "내용"} name={["content"]}>
										<UiTextArea rows={6} placeholder={routeConfig.contentPlaceholder ?? "내용을 입력해 주세요."} maxLength={5000} />
									</UiFormItem>
								</Fragment>
							) : (
								<UiFormItem label={`${boardLabel} 이름`} name={["name"]} rules={buildBoardNameRules()}>
									<UiInput placeholder="이름을 입력해 주세요." maxLength={500} />
								</UiFormItem>
							)}
							<div className={clsx("loc_mbof__actions")}>
								<UiButton onClick={handleCancelButtonClick}>취소</UiButton>
								<UiButton htmlType={"submit"} type={"primary"}>
									{isEdit ? "저장" : "추가"}
								</UiButton>
							</div>
						</UiForm>
					</div>
				</div>
			</UiModal>
		</Fragment>
	);
};

export default NiceModal.create(ModalBoardForm);
