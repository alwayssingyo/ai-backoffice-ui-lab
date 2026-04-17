import {Fragment, type MouseEventHandler, useEffect, useMemo} from "react";
import clsx from "clsx";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiTextArea from "@/components/ui/input/ui-text-area.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import type {Callbacks} from "@rc-component/form/lib/interface";
import {useForm} from "antd/es/form/Form";
import "./modal-permission-form.css";

export interface ModalPermissionFormValues {
	name: string;
	description?: string;
}

interface ModalPermissionFormProps {
	initialValues?: ModalPermissionFormValues;
	dontUseThisProp?: never;
}

const ModalPermissionForm = (props: ModalPermissionFormProps) => {
	const {dontUseThisProp, initialValues} = props;
	const [form] = useForm<ModalPermissionFormValues>();
	const {UiForm, UiFormItem} = createTypedForm<ModalPermissionFormValues>();
	const modal = useModal();
	const isEdit = !!initialValues;
	const initialFormValues = useMemo(
		() => ({name: initialValues?.name ?? "", description: initialValues?.description ?? ""}),
		[initialValues],
	);

	useEffect(() => {
		form.setFieldsValue(initialFormValues);
	}, [form, initialFormValues]);

	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.resolve(null);
		void modal.hide();
	};

	const handleFinish: Callbacks<ModalPermissionFormValues>["onFinish"] = (values) => {
		modal.resolve(values);
		void modal.hide();
	};

	return (
		<Fragment>
			{dontUseThisProp}
			<UiModal onCancel={handleCancelButtonClick}>
				<div className={clsx("loc_mpermi")}>
					<UiTypoTitle level={4}>{isEdit ? "Edit role" : "New role"}</UiTypoTitle>
					<div className={clsx("loc_mpermi__form")}>
						<UiForm form={form} layout={"vertical"} onFinish={handleFinish} initialValues={initialFormValues}>
							<UiFormItem label="Role name" name={["name"]} rules={[{required: true, message: "Enter a role name."}]}>
								<UiInput placeholder="e.g. Editor, Analyst" />
							</UiFormItem>
							<UiFormItem label="Description" name={["description"]}>
								<UiTextArea rows={3} placeholder="Describe what this role is responsible for." />
							</UiFormItem>
							<div className={clsx("loc_mpermi__actions")}>
								<UiButton onClick={handleCancelButtonClick}>Cancel</UiButton>
								<UiButton htmlType={"submit"} type={"primary"}>
									{isEdit ? "Save" : "Create"}
								</UiButton>
							</div>
						</UiForm>
					</div>
				</div>
			</UiModal>
		</Fragment>
	);
};

export default NiceModal.create(ModalPermissionForm);
