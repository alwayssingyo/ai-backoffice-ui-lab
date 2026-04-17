import {Fragment, type MouseEventHandler} from "react";
import clsx from "clsx";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import type {Callbacks} from "@rc-component/form/lib/interface";
import {useForm} from "antd/es/form/Form";
import {useTranslation} from "react-i18next";
import UiButton from "@/components/ui/button/ui-button.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInputOtp from "@/components/ui/input/ui-input-otp.tsx";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import "./modal-login-otp-verify.css";

export interface ModalLoginOtpVerifyValues {
	otp: string;
}

interface ModalLoginOtpVerifyProps {
	dontUseThisProp?: never;
}

const ModalLoginOtpVerify = (props: ModalLoginOtpVerifyProps) => {
	const {dontUseThisProp} = props;
	const [form] = useForm<ModalLoginOtpVerifyValues>();
	const {UiForm, UiFormItem} = createTypedForm<ModalLoginOtpVerifyValues>();
	const modal = useModal();
	const {t} = useTranslation("common");

	/**
	 * @summary OTP 입력 모달을 닫습니다.
	 */
	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		modal.resolve(null);
		void modal.hide();
	};

	/**
	 * @summary 입력한 OTP를 검증 요청 값으로 반환합니다.
	 */
	const handleFinish: Callbacks<ModalLoginOtpVerifyValues>["onFinish"] = (values) => {
		modal.resolve(values);
		void modal.hide();
	};

	return (
		<Fragment>
			{dontUseThisProp}
			<UiModal onCancel={handleCancelButtonClick} width={420}>
				<div className={clsx("loc_lotp__root")}>
					<UiTypoTitle level={4}>{t(($) => $.loc_lotp__title)}</UiTypoTitle>
					<UiTypoText type={"secondary"}>{t(($) => $.loc_lotp__desc)}</UiTypoText>
					<UiForm form={form} layout={"vertical"} onFinish={handleFinish}>
						<UiFormItem
							name={["otp"]}
							rules={[
								{required: true, message: t(($) => $.loc_lotp__otpRequired)},
								{pattern: /^\d+$/, message: t(($) => $.loc_lotp__otpPattern)},
								{len: 6, message: t(($) => $.loc_lotp__otpLength)},
							]}
						>
							<UiInputOtp length={6} size={"large"} className={clsx("loc_lotp__otp")} />
						</UiFormItem>
						<div className={clsx("loc_lotp__actions")}>
							<UiButton onClick={handleCancelButtonClick}>{t(($) => $.ui_button__cancel)}</UiButton>
							<UiButton type={"primary"} htmlType={"submit"}>
								{t(($) => $.ui_button__save)}
							</UiButton>
						</div>
					</UiForm>
				</div>
			</UiModal>
		</Fragment>
	);
};

export default NiceModal.create(ModalLoginOtpVerify);
