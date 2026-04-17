import {type CredentialResponse, GoogleLogin} from "@react-oauth/google";
import {createFileRoute, redirect, useNavigate} from "@tanstack/react-router";
import {useModal} from "@ebay/nice-modal-react";
import {useForm} from "antd/es/form/Form";
import clsx from "clsx";
import {useTranslation} from "react-i18next";
import UiButton from "@/components/ui/button/ui-button.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiInputPassword from "@/components/ui/input/ui-input-password.tsx";
import {noti} from "@/libraries/ant-design/ant-design-provider.tsx";
import ModalLoginOtpVerify, {type ModalLoginOtpVerifyValues} from "@/routes/login/-local/modal-login-otp-verify.tsx";
import {useAuthorizationLogin} from "@/services/hooks/authorization/use-authorization-login.ts";
import {useAuthorizationVerifyOtp} from "@/services/hooks/authorization/use-authorization-verify-otp.ts";
import {useAuthorizationLoginGoogle} from "@/services/hooks/authorization/use-authorization-login-google.ts";
import type {PlatformLoginRequest} from "@/services/types/platform-login-request.ts";
import {useRoleStore} from "@/stores/use-role-store.ts";
import {useTokenStore} from "@/stores/use-token-store.ts";
import {asset} from "@/entry/asset.ts";
import {useEnvironmentGetAuthPlatformSuspense} from "@/services/hooks/environment/use-environment-get-auth-platform-suspense.ts";
import {Activity} from "react";

export const Route = createFileRoute("/login")({
	component: Login,
	beforeLoad: () => {
		const accessToken = useTokenStore.getState().accessToken;

		if (accessToken) {
			throw redirect({to: "/project", replace: true});
		}
	},
});

export function Login() {
	const navigate = useNavigate();
	const tokenStore = useTokenStore();
	const roleStore = useRoleStore();
	const modalLoginOtpVerify = useModal(ModalLoginOtpVerify);
	const {t} = useTranslation("common");
	const [form] = useForm<PlatformLoginRequest>();
	const {UiForm, UiFormItem} = createTypedForm<PlatformLoginRequest>();

	/**
	 * @description 로그인 플랫폼 사용 유무 조회 API
	 */
	const responseEnvironmentGetAuthPlatformSuspense = useEnvironmentGetAuthPlatformSuspense({
		query: {select: ({data}) => ({isPlatformLoginEnabled: data.usePlatformLogin, isGoogleLoginEnabled: data.useGcpLogin})},
	});

	/**
	 * @description OTP 검증 API
	 */
	const mutationAuthorizationVerifyOtp = useAuthorizationVerifyOtp({
		mutation: {
			meta: {successToast: t(($) => $.rt_index__otpToastSuccess), errorToast: t(($) => $.rt_index__otpToastError)},
			onSuccess: (data, _variables, _onMutateResult, _context) => {
				const tokenInfo = data.data;

				tokenStore.setOtpToken(null);
				tokenStore.setAccessToken(tokenInfo.accessToken);
				tokenStore.setRefreshToken(tokenInfo.refreshToken);
				roleStore.reset();

				void navigate({to: "/project"});
			},
		},
	});

	/**
	 * @description 플랫폼 로그인 API
	 */
	const mutationAuthorizationLogin = useAuthorizationLogin({
		mutation: {
			meta: {successToast: null, errorToast: t(($) => $.rt_index__platformToastError)},
			onSuccess: async (data, _variables, _onMutateResult, _context) => {
				if (data.data.otpRequired) {
					if (!data.data.otpToken) {
						console.error("Login succeeded but otpToken is missing");
						return;
					}

					tokenStore.setOtpToken(data.data.otpToken);

					const resultOtpVerifyModal = (await modalLoginOtpVerify.show()) as ModalLoginOtpVerifyValues | null;

					if (!resultOtpVerifyModal) {
						tokenStore.setOtpToken(null);
						return;
					}

					mutationAuthorizationVerifyOtp.mutate({params: {otp: Number(resultOtpVerifyModal.otp)}});

					return;
				} else {
					const tokenInfo = data.data.tokenInfo;

					if (!tokenInfo?.accessToken || !tokenInfo?.refreshToken) {
						console.error("Login succeeded but tokenInfo is missing");
						return;
					}

					tokenStore.setAccessToken(tokenInfo.accessToken);
					tokenStore.setRefreshToken(tokenInfo.refreshToken);
					roleStore.reset();
					noti.success({
						title: t(($) => $.rt_index__platformToastSuccess),
						placement: "topRight",
						showProgress: true,
						pauseOnHover: true,
						duration: 2.5,
					});

					void navigate({to: "/project"});
				}
			},
		},
	});

	/**
	 * @description Google 로그인 API
	 */
	const mutationAuthorizationLoginGoogle = useAuthorizationLoginGoogle({
		mutation: {
			meta: {successToast: t(($) => $.rt_index__googleToastSuccess), errorToast: t(($) => $.rt_index__googleToastError)},
			onSuccess: (data, _variables, _onMutateResult, _context) => {
				const tokenInfo = data.data?.tokenInfo;
				if (!tokenInfo?.accessToken || !tokenInfo?.refreshToken) {
					console.error("Login succeeded but tokenInfo is missing");
					return;
				}

				tokenStore.setAccessToken(tokenInfo.accessToken);
				tokenStore.setRefreshToken(tokenInfo.refreshToken);
				roleStore.reset();

				void navigate({to: "/project"});
			},
		},
	});

	/**
	 * @summary 플랫폼 로그인 폼 제출
	 */
	const handleFormFinish = (values: PlatformLoginRequest) => {
		mutationAuthorizationLogin.mutate({data: values});
	};
	/**
	 * @summary 구글 로그인 성공 핸들러
	 */
	const handleGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
		if (!credentialResponse.credential) {
			console.error("No credential received");
			return;
		}

		mutationAuthorizationLoginGoogle.mutate({data: {token: credentialResponse.credential}});
	};
	/**
	 * @summary 구글 로그인 실패 핸들러
	 */
	const handleGoogleLoginError = () => {
		noti.error({
			title: t(($) => $.rt_index__googleToastError),
			description: t(($) => $.rt_index__googleOauthError),
			placement: "topRight",
			showProgress: true,
			pauseOnHover: true,
			duration: 2.5,
		});
	};

	return (
		<div className={clsx("rt_index__root")}>
			<div className={clsx("rt_index__login")}>
				<div className={clsx("rt_index__loginArea")}>
					<img src={asset.images.logoIntroPng} alt={t(($) => $.rt_index__logoAlt)} className={clsx("rt_index__loginLogo")} />
					<h1 className={clsx("rt_index__loginTitle")}>{t(($) => $.rt_index__title)}</h1>
					<div className={clsx("rt_index__loginDesc")}>{t(($) => $.rt_index__desc)}</div>
					<Activity mode={responseEnvironmentGetAuthPlatformSuspense.data.isPlatformLoginEnabled ? "visible" : "hidden"}>
						<div className={clsx("rt_index__loginForm")}>
							<UiForm form={form} layout={"vertical"} onFinish={handleFormFinish}>
								<UiFormItem label={"Login ID"} name={["loginId"]} rules={[{required: true, message: "Please enter login ID"}]}>
									<UiInput placeholder={"Enter login ID"} autoComplete={"username"} />
								</UiFormItem>
								<UiFormItem label={"Password"} name={["password"]} rules={[{required: true, message: "Please enter password"}]}>
									<UiInputPassword placeholder={"Enter password"} autoComplete={"current-password"} />
								</UiFormItem>
								<UiButton
									block
									type={"primary"}
									htmlType={"submit"}
									loading={mutationAuthorizationLogin.isPending || mutationAuthorizationVerifyOtp.isPending}
								>
									Sign in
								</UiButton>
							</UiForm>
						</div>
					</Activity>
					<Activity
						mode={
							responseEnvironmentGetAuthPlatformSuspense.data.isPlatformLoginEnabled &&
							responseEnvironmentGetAuthPlatformSuspense.data.isGoogleLoginEnabled
								? "visible"
								: "hidden"
						}
					>
						<div className={clsx("rt_index__loginDivider")}>
							<span>OR</span>
						</div>
					</Activity>
					<Activity mode={responseEnvironmentGetAuthPlatformSuspense.data.isGoogleLoginEnabled ? "visible" : "hidden"}>
						<div className={clsx("rt_index__loginBtn")}>
							<GoogleLogin
								onSuccess={handleGoogleLoginSuccess}
								onError={handleGoogleLoginError}
								width={300}
								size="large"
								text="signin_with"
								shape="circle"
							/>
						</div>
					</Activity>
				</div>
			</div>
		</div>
	);
}
