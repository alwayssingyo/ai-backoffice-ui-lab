import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Activity, Fragment, type MouseEventHandler, useEffect} from "react";
import clsx from "clsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiSelect from "@/components/ui/select/ui-select.tsx";
import UiDivider from "@/components/ui/divider/ui-divider.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiFormProvider, {type UiFormProviderProps} from "@/components/ui/form/ui-form-provider.tsx";
import {createTypedForm} from "@/components/ui/form/create-typed-form.tsx";
import {useForm} from "antd/es/form/Form";
import {useQueryClient} from "@tanstack/react-query";
import {toNumber} from "es-toolkit/compat";
import isNonNullable from "antd/es/_util/isNonNullable";
import {useTranslation} from "react-i18next";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {adminGetItemQueryKey, useAdminGetItem} from "@/services/hooks/admin/use-admin-get-item.ts";
import {useAdminUpsert} from "@/services/hooks/admin/use-admin-upsert.ts";
import {authorizationInfoSuspenseQueryKey} from "@/services/hooks/authorization/use-authorization-info-suspense.ts";
import {adminSearchAdminsSuspenseQueryKey} from "@/services/hooks/admin/use-admin-search-admins-suspense.ts";
import {permissionGroupGetItemQueryKey} from "@/services/hooks/permission-group/use-permission-group-get-item.ts";
import {permissionGroupGetListSuspenseQueryKey} from "@/services/hooks/permission-group/use-permission-group-get-list-suspense.ts";
import {usePermissionGroupGetListSuspense} from "@/services/hooks/permission-group/use-permission-group-get-list-suspense.ts";
import {useTenantSearchTenantsSuspense} from "@/services/hooks/tenant/use-tenant-search-tenants-suspense.ts";
import {util} from "@/entry/util.ts";
import "./members.css";

export const Route = createFileRoute("/(project)/project/(members)/members/form/{-$mid}")({component: RouteComponent});

type MemberFormValues = {loginId: string; name: string; password: string; permissionGroupId: number; tenantId?: number};

function RouteComponent() {
	const {useParams} = Route;
	const navigate = useNavigate();
	const params = useParams();
	const {t} = useTranslation("common");
	const [form] = useForm<MemberFormValues>();
	const {UiForm, UiFormItem} = createTypedForm<MemberFormValues>();
	const queryClient = useQueryClient();
	const isEdit = isNonNullable(params.mid);

	/**
	 * @description 권한 그룹 목록 조회 API
	 */
	const responsePermissionGroupGetListSuspense = usePermissionGroupGetListSuspense({
		query: {select: ({data}) => ({permissionGroups: data.list})},
	});
	/**
	 * @description 테넌트 목록 조회 API
	 */
	const responseTenantSearchTenantsSuspense = useTenantSearchTenantsSuspense({}, {query: {select: ({data}) => ({tenants: data.list})}});
	/**
	 * @description 관리자 상세 조회 API
	 */
	const responseAdminGetItem = useAdminGetItem(toNumber(params.mid), {query: {enabled: isEdit, select: ({data}) => ({admin: data})}});
	/**
	 * @description 관리자 등록/수정 API
	 */
	const mutationAdminUpsert = useAdminUpsert({
		mutation: {
			onSuccess: async (_data, variables) => {
				const adminId = variables.data.id;

				await Promise.all([
					queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetListSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: authorizationInfoSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetItemQueryKey(variables.data.permissionGroupId)}),
				]);

				if (isEdit && isNonNullable(adminId)) {
					queryClient.removeQueries({queryKey: adminGetItemQueryKey(adminId)});
				}

				void navigate({to: "/project/members"});
			},
		},
	});

	/**
	 * @summary 수정 모드에서 관리자 상세 응답을 폼에 반영
	 */
	useEffect(() => {
		const admin = responseAdminGetItem.data?.admin;
		if (!isEdit || !admin) {
			return;
		}

		form.setFieldsValue({loginId: admin.loginId, name: admin.name, permissionGroupId: admin.permissionGroup?.id, tenantId: admin.tenantId});
	}, [responseAdminGetItem, form, isEdit]);

	/**
	 * @summary 멤버목록으로돌아...갈...
	 */
	const handleCancelClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void navigate({to: "/project/members"});
	};

	/**
	 * @summary 멤버 저장 처리
	 */
	const handleFormFinish: UiFormProviderProps["onFormFinish"] = (_name, info) => {
		if (_name === "members-form") {
			const values = info.values as MemberFormValues;

			mutationAdminUpsert.mutate({
				data: {
					...(isEdit ? {id: toNumber(params.mid)} : {}),
					loginId: values.loginId?.trim(),
					name: values.name?.trim(),
					...(!isEdit ? {password: values.password} : {}),
					permissionGroupId: values.permissionGroupId,
					tenantId: values.tenantId,
				},
			});
		}
	};

	return (
		<UiFormProvider onFormFinish={handleFormFinish}>
			<Fragment>
				<WidgetContentHeader title={isEdit ? "Edit member" : "Create member"} desc="Manage member details and access permissions.">
					<UiButton onClick={handleCancelClick}>Cancel</UiButton>
					<UiButton type="primary" htmlType="submit" onClick={form.submit}>
						Save
					</UiButton>
				</WidgetContentHeader>
				<WidgetContentBody>
					<div className={clsx("rt_dmf__form")}>
						<UiForm form={form} name={"members-form"} layout={"vertical"}>
							<UiTypoTitle level={4}>Member details</UiTypoTitle>
							<div className={clsx("rt_dmf__grid")}>
								<UiFormItem label="Email" name="loginId" rules={[{required: true, message: "Email is required."}]}>
									<UiInput placeholder="Email" readOnly={isEdit} />
								</UiFormItem>
								<UiFormItem label="Name" name="name" rules={[{required: true, message: "Name is required."}]}>
									<UiInput placeholder="Name" />
								</UiFormItem>
								<Activity mode={isEdit ? "hidden" : "visible"}>
									<UiFormItem label="Password" name="password" rules={[{required: true, message: "Password is required."}]}>
										<UiInput type="password" placeholder="Password" />
									</UiFormItem>
								</Activity>
								<UiFormItem
									label="Permission group"
									name="permissionGroupId"
									rules={[{required: true, message: "Permission group is required."}]}
								>
									<UiSelect
										data-testid="member-permission-group-select"
										options={responsePermissionGroupGetListSuspense.data.permissionGroups.map((permissionGroup) => ({
											label: permissionGroup.name,
											value: permissionGroup.id,
										}))}
										placeholder="Select permission group"
									/>
								</UiFormItem>
								<UiFormItem label="Tenant" name="tenantId">
									<UiSelect
										data-testid="member-tenant-select"
										options={responseTenantSearchTenantsSuspense.data.tenants.map((tenant) => ({label: tenant.name, value: tenant.id}))}
										placeholder="Select tenant"
										allowClear
									/>
								</UiFormItem>
							</div>

							<Activity mode={isEdit ? "visible" : "hidden"}>
								<>
									<UiDivider />
									<UiTypoTitle level={4}>Account info</UiTypoTitle>
									<div className={clsx("rt_dmf__infoGrid")}>
										<div className={clsx("rt_dmf__infoItem")}>
											<div className={clsx("rt_dmf__infoTitle")}>{t(($) => $.rt_dmf__lastLogin)}</div>
											<div className={clsx("rt_dmf__infoValue")}>
												{formatDateValue(responseAdminGetItem.data?.admin.lastLoginAt) ?? "-"}
											</div>
										</div>

										<div className={clsx("rt_dmf__infoItem")}>
											<div className={clsx("rt_dmf__infoTitle")}>{t(($) => $.rt_dmf__createdAt)}</div>
											<div className={clsx("rt_dmf__infoValue")}>{formatDateValue(responseAdminGetItem.data?.admin.createdAt) ?? "-"}</div>
										</div>

										<div className={clsx("rt_dmf__infoItem")}>
											<div className={clsx("rt_dmf__infoTitle")}>Status</div>
											<div className={clsx("rt_dmf__infoValue")}>{responseAdminGetItem.data?.admin.removed ? "Removed" : "Active"}</div>
										</div>
									</div>
								</>
							</Activity>
						</UiForm>
					</div>
				</WidgetContentBody>
			</Fragment>
		</UiFormProvider>
	);
}
