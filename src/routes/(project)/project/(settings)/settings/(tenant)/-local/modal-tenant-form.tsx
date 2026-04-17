import {Fragment, type MouseEventHandler, useEffect} from "react";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import {useForm} from "antd/es/form/Form";
import type {Callbacks} from "@rc-component/form/lib/interface";
import clsx from "clsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {buildTenantNameRules, normalizeTenantName, type TenantFormValues, type TenantTableRow} from "../tenant.ts";
import "./modal-tenant-form.css";

interface ModalTenantFormProps {
	initialValues?: TenantFormValues;
	rows?: TenantTableRow[];
	dontUseThisProp?: never;
}

const ModalTenantForm = (props: ModalTenantFormProps) => {
	const {dontUseThisProp, initialValues, rows = []} = props;
	const [form] = useForm<TenantFormValues>();
	const {UiForm, UiFormItem} = createTypedForm<TenantFormValues>();
	const modal = useModal();
	const isEdit = typeof initialValues?.id === "number";

	useEffect(() => {
		form.setFieldsValue({name: initialValues?.name ?? ""});
	}, [form, initialValues]);

	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.resolve(null);
		void modal.hide();
	};

	const handleFinish: Callbacks<TenantFormValues>["onFinish"] = (values) => {
		modal.resolve({
			...values,
			...(typeof initialValues?.id === "number" ? {id: initialValues.id} : {}),
			name: normalizeTenantName(values.name),
		});
		void modal.hide();
	};

	return (
		<Fragment>
			{dontUseThisProp}
			<UiModal onCancel={handleCancelButtonClick}>
				<div className={clsx("loc_mtenf")}>
					<UiTypoTitle level={4}>{isEdit ? "Tenant 수정" : "Tenant 추가"}</UiTypoTitle>
					<div className={clsx("loc_mtenf__form")}>
						<UiForm form={form} layout={"vertical"} onFinish={handleFinish} initialValues={{name: initialValues?.name ?? ""}}>
							<UiFormItem label="Tenant 이름" name={["name"]} rules={buildTenantNameRules(rows, initialValues?.id)}>
								<UiInput placeholder="Tenant 이름을 입력해 주세요." maxLength={255} />
							</UiFormItem>
							<div className={clsx("loc_mtenf__actions")}>
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

export default NiceModal.create(ModalTenantForm);
