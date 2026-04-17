import {Activity, Fragment, type MouseEventHandler, useEffect, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import {z} from "zod";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiList from "@/components/ui/list/ui-list.tsx";
import UiListItem from "@/components/ui/list/ui-list-item.tsx";
import UiTag from "@/components/ui/tag/ui-tag.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiAvatar from "@/components/ui/avatar/ui-avatar.tsx";
import UiPopover, {type AntDesignPopoverProps} from "@/components/ui/popover/ui-popover.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import {useModal} from "@ebay/nice-modal-react";
import ModalPermissionForm, {
	type ModalPermissionFormValues,
} from "@/routes/(project)/project/(permissions)/-local/modal-permission-form.tsx";
import ModalPermissionAccessForm, {
	type ModalPermissionAccessFormValues,
} from "@/routes/(project)/project/(permissions)/-local/modal-permission-access-form.tsx";
import ModalPermissionMemberForm, {
	type ModalPermissionMemberFormValues,
} from "@/routes/(project)/project/(permissions)/-local/modal-permission-member-form.tsx";
import {useRoleStore} from "@/stores/use-role-store.ts";
import {authorizationInfoSuspenseQueryKey} from "@/services/hooks/authorization/use-authorization-info-suspense.ts";
import {adminSearchAdminsSuspenseQueryKey, useAdminSearchAdminsSuspense} from "@/services/hooks/admin/use-admin-search-admins-suspense.ts";
import {
	permissionGroupGetListSuspenseQueryKey,
	usePermissionGroupGetListSuspense,
} from "@/services/hooks/permission-group/use-permission-group-get-list-suspense.ts";
import {useAdminUpdates} from "@/services/hooks/admin/use-admin-updates.ts";
import {
	permissionGroupGetItemQueryKey,
	usePermissionGroupGetItem,
} from "@/services/hooks/permission-group/use-permission-group-get-item.ts";
import {usePermissionGroupGetApiEndpointListSuspense} from "@/services/hooks/permission-group/use-permission-group-get-api-endpoint-list-suspense.ts";
import {usePermissionGroupUpsert} from "@/services/hooks/permission-group/use-permission-group-upsert.ts";
import {usePermissionGroupRemove} from "@/services/hooks/permission-group/use-permission-group-remove.ts";
import {modalPreset} from "@/components/ui/modal/modal-preset.tsx";
import {modal} from "@/libraries/ant-design/ant-design-provider.tsx";
import type {ApiEndpointSaveRequest} from "@/services/types/api-endpoint-save-request.ts";
import type {PermissionGroupResponse} from "@/services/types/permission-group-response.ts";
import {useQueryClient} from "@tanstack/react-query";
import {KeyAlt, Plus, Trash, Edit, MoreVertical, MenuAlt02, User} from "griddy-icons";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import {util} from "@/entry/util.ts";
import "./permissions.css";

export const Route = createFileRoute("/(project)/project/(permissions)/permissions/")({
	component: RouteComponent,
	validateSearch: z.object({permissionGroupId: z.coerce.number().int().optional()}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const modalPermissionForm = useModal(ModalPermissionForm);
	const modalPermissionAccessForm = useModal(ModalPermissionAccessForm);
	const modalPermissionMemberForm = useModal(ModalPermissionMemberForm);
	const roleStore = useRoleStore();
	const {useSearch} = Route;
	const search = useSearch();
	const [openActionPermissionId, setOpenActionPermissionId] = useState<number | null>(null);

	/**
	 * @description 권한 그룹 목록 조회 API
	 */
	const responsePermissionGroupGetListSuspense = usePermissionGroupGetListSuspense({
		query: {
			select: ({data}) => {
				const list = data.list;
				const found = list.find(({id}) => id === search.permissionGroupId) || list[0];

				return {permissionGroups: list, selectedPermissionGroup: found};
			},
		},
	});
	/**
	 * @description API 엔드포인트 목록 조회 API
	 */
	const responsePermissionGroupGetApiEndpointListSuspense = usePermissionGroupGetApiEndpointListSuspense({
		query: {select: ({data}) => ({endpoints: data.list})},
	});
	/**
	 * @description 관리자 목록 조회 API
	 */
	const responseAdminSearchAdminsSuspense = useAdminSearchAdminsSuspense(
		{page: 1, size: 1000},
		{query: {select: ({data}) => ({admins: data.list})}},
	);
	/**
	 * @description 권한 그룹 상세 조회 API
	 */
	const responsePermissionGroupGetItem = usePermissionGroupGetItem(
		responsePermissionGroupGetListSuspense.data.selectedPermissionGroup?.id,
		{
			query: {
				enabled: !!responsePermissionGroupGetListSuspense.data.selectedPermissionGroup?.id,
				select: ({data}) => ({
					permissionGroup: data.permissionGroup,
					permissions: data.permissions,
					permissionGroupAdmin: data.permissionGroupAdmin,
				}),
			},
		},
	);
	/**
	 * @description 권한 그룹 등록/수정 API
	 */
	const mutationPermissionGroupUpsert = usePermissionGroupUpsert({
		mutation: {
			onSuccess: async (_data, variables) => {
				const permissionGroupId = variables.data.permissionGroupRequest.id;

				if (permissionGroupId == null) {
					await Promise.all([
						queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)}),
						queryClient.invalidateQueries({queryKey: permissionGroupGetListSuspenseQueryKey()}),
						queryClient.invalidateQueries({queryKey: authorizationInfoSuspenseQueryKey()}),
					]);
					return;
				}

				await Promise.all([
					queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetListSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: authorizationInfoSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetItemQueryKey(permissionGroupId)}),
				]);
			},
		},
	});
	/**
	 * @description 권한 그룹 삭제 API
	 */
	const mutationPermissionGroupRemove = usePermissionGroupRemove({
		mutation: {
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetListSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: authorizationInfoSuspenseQueryKey()}),
				]);

				void navigate({to: "/project/permissions", search: {}, replace: true});
			},
		},
	});
	/**
	 * @description 관리자 권한 그룹 일괄 수정 API
	 */
	const mutationAdminUpdates = useAdminUpdates({
		mutation: {
			onSuccess: async (_data, _variables) => {
				await Promise.all([
					queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(adminSearchAdminsSuspenseQueryKey)}),
					queryClient.invalidateQueries({queryKey: permissionGroupGetListSuspenseQueryKey()}),
					queryClient.invalidateQueries({queryKey: util.query.getBaseQueryKey(permissionGroupGetItemQueryKey)}),
					queryClient.invalidateQueries({queryKey: authorizationInfoSuspenseQueryKey()}),
				]);
			},
		},
	});

	/**
	 * @summary 권한 그룹 응답을 스토어에 동기화합니다.
	 */
	useEffect(() => {
		roleStore.setPermissionGroups(responsePermissionGroupGetListSuspense.data.permissionGroups);
	}, [responsePermissionGroupGetListSuspense.data]);

	/**
	 * @summary 좌측 권한 그룹 목록에서 선택한 그룹 아이디를 쿼리스트링으로 반영합니다.
	 */
	const handlePermissionSelectButtonClick =
		(permissionGroup: PermissionGroupResponse): MouseEventHandler<HTMLElement> =>
		(_e) => {
			void navigate({to: "/project/permissions", search: {permissionGroupId: permissionGroup.id}});
		};

	/**
	 * @summary 권한 그룹 등록 모달을 열고 이름/설명을 저장합니다.
	 */
	const handlePermissionAddButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
		const resultPermissionForm = (await modalPermissionForm.show()) as ModalPermissionFormValues | null;

		if (!resultPermissionForm) {
			return;
		}

		mutationPermissionGroupUpsert.mutate({
			data: {permissionGroupRequest: {name: resultPermissionForm.name, description: resultPermissionForm.description}},
		});
	};

	/**
	 * @summary 엔드포인트 권한 설정 모달을 열고 권한 그룹의 API 접근권한을 수정합니다.
	 */
	const handlePermissionEditEndpointPolicyButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
		const {selectedPermissionGroup} = responsePermissionGroupGetListSuspense.data;
		const {permissions} = responsePermissionGroupGetItem.data ?? {};
		const {endpoints} = responsePermissionGroupGetApiEndpointListSuspense.data;

		if (!selectedPermissionGroup || !permissions) {
			return;
		}

		const initialApiEndpoints: ApiEndpointSaveRequest[] = endpoints.map((endpoint) => {
			const foundPermission = permissions.find((permission) => permission.tagName === endpoint.tagName);

			if (!foundPermission) {
				return {tagName: endpoint.tagName, httpMethods: []};
			}

			return {tagName: endpoint.tagName, httpMethods: foundPermission.httpMethods};
		});

		const resultPermissionAccessForm = (await modalPermissionAccessForm.show({
			initialValues: {apiEndpoints: initialApiEndpoints},
			endpoints: endpoints,
		})) as ModalPermissionAccessFormValues | null;

		if (!resultPermissionAccessForm) {
			return;
		}

		const {id, name, description} = selectedPermissionGroup;
		mutationPermissionGroupUpsert.mutate({
			data: {permissionGroupRequest: {id, name, description}, apiEndpoints: resultPermissionAccessForm.apiEndpoints},
		});
	};

	/**
	 * @summary 더보기 메뉴에서 권한 그룹 정보를 수정합니다.
	 */
	const handlePermissionEditButtonClick =
		(permissionGroup: PermissionGroupResponse): MouseEventHandler<HTMLElement> =>
		async (e) => {
			e.stopPropagation();
			setOpenActionPermissionId(null);

			const resultPermissionForm = (await modalPermissionForm.show({
				initialValues: {name: permissionGroup.name, description: permissionGroup.description},
			})) as ModalPermissionFormValues | null;

			if (!resultPermissionForm) {
				return;
			}

			mutationPermissionGroupUpsert.mutate({
				data: {
					permissionGroupRequest: {id: permissionGroup.id, name: resultPermissionForm.name, description: resultPermissionForm.description},
				},
			});
		};

	/**
	 * @summary 현재 선택된 권한 그룹을 삭제합니다.
	 */
	const handlePermissionDeleteButtonClick =
		(permissionGroup: PermissionGroupResponse): MouseEventHandler<HTMLButtonElement> =>
		(_e) => {
			setOpenActionPermissionId(null);

			if (roleStore.superAdminPermissionGroupIds.includes(permissionGroup.id)) {
				return;
			}

			modal.error(
				modalPreset.remove({
					onOk: (..._args) => {
						mutationPermissionGroupRemove.mutate({permissionGroupId: permissionGroup.id});
					},
				}),
			);
		};

	/**
	 * @summary 할당된 멤버 편집 모달을 열고 멤버 소속 권한을 동기화합니다.
	 */
	const handlePermissionEditAssignedUsersButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
		const {selectedPermissionGroup} = responsePermissionGroupGetListSuspense.data;
		const {permissionGroupAdmin} = responsePermissionGroupGetItem.data ?? {};
		const {admins} = responseAdminSearchAdminsSuspense.data;

		if (!selectedPermissionGroup || !permissionGroupAdmin) {
			return;
		}

		const resultPermissionMemberForm = (await modalPermissionMemberForm.show({
			initialValues: {adminIds: permissionGroupAdmin.map((admin) => admin.id)},
			members: admins,
		})) as ModalPermissionMemberFormValues | null;

		if (!resultPermissionMemberForm) {
			return;
		}

		mutationAdminUpdates.mutate({data: {permissionGroupId: selectedPermissionGroup.id, adminIds: resultPermissionMemberForm.adminIds}});
	};

	/**
	 * @summary 권한 그룹의 더보기 팝오버 오픈 상태를 관리합니다.
	 */
	const handlePermissionActionPopoverOpenChange =
		(permissionGroupId: number): NonNullable<AntDesignPopoverProps["onOpenChange"]> =>
		(nextOpen) => {
			setOpenActionPermissionId(nextOpen ? permissionGroupId : null);
		};

	return (
		<Fragment>
			<WidgetContentHeader title={"Permissions"} desc={"Manage roles and the actions each role can perform."} />
			<WidgetContentBody>
				<div className={clsx("rt_dpermi__layout")}>
					{/* 좌측: 권한 그룹 목록 */}
					<section className={clsx("rt_dpermi__panel", "rt_dpermi__sidebar")}>
						<div className={clsx("rt_dpermi__sidebarHeader")}>
							<div className={clsx("rt_dpermi__sidebarTitle")}>
								<KeyAlt {...iconPreset.primary()} />
								<UiTypoText strong>{responsePermissionGroupGetListSuspense.data.permissionGroups.length}</UiTypoText>
							</div>
							<UiButton type="primary" icon={<Plus {...iconPreset.primary()} />} onClick={handlePermissionAddButtonClick}>
								Add role
							</UiButton>
						</div>
						<UiList
							className={clsx("rt_dpermi__list")}
							dataSource={responsePermissionGroupGetListSuspense.data.permissionGroups}
							renderItem={(item) => {
								const isActionOpen = openActionPermissionId === item.id;

								return (
									<UiListItem className={clsx("rt_dpermi__listItem")}>
										{/** biome-ignore lint/a11y/useSemanticElements: 중첩버튼은어쩔수없다? */}
										<div
											role={"button"}
											tabIndex={0}
											onClick={handlePermissionSelectButtonClick(item)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handlePermissionSelectButtonClick(item);
												}
											}}
											className={clsx(
												"rt_dpermi__listButton",
												item.id === responsePermissionGroupGetListSuspense.data.selectedPermissionGroup?.id &&
													"rt_dpermi__listButton--active",
											)}
										>
											<div className={clsx("rt_dpermi__listHeader")}>
												<div className={clsx("rt_dpermi__listInfo")}>
													<UiTypoText strong ellipsis>
														{item.name}
													</UiTypoText>
													<Activity mode={item.description ? "visible" : "hidden"}>
														<UiTypoText ellipsis type="secondary" className={clsx("rt_dpermi__listDesc")}>
															{item.description}
														</UiTypoText>
													</Activity>
												</div>
												<div className={clsx("rt_dpermi__listActions", isActionOpen && "rt_dpermi__listActions--visible")}>
													<UiPopover
														placement="bottomRight"
														trigger="click"
														arrow={false}
														rootClassName="rt_dpermi__listPopover"
														open={isActionOpen}
														onOpenChange={handlePermissionActionPopoverOpenChange(item.id)}
														content={
															<div className={clsx("rt_dpermi__listPopoverMenu")}>
																<button
																	type="button"
																	className={clsx("rt_dpermi__listPopoverItem")}
																	onClick={handlePermissionEditButtonClick(item)}
																>
																	<Edit {...iconPreset.outlined()} />
																	<span>Edit</span>
																</button>
																<button
																	type="button"
																	className={clsx("rt_dpermi__listPopoverItem", "rt_dpermi__listPopoverItem--danger")}
																	onClick={handlePermissionDeleteButtonClick(item)}
																	disabled={roleStore.superAdminPermissionGroupIds.includes(item.id)}
																>
																	<Trash {...iconPreset.outlined()} />
																	<span>Delete</span>
																</button>
															</div>
														}
													>
														<UiButton
															type="text"
															icon={<MoreVertical {...iconPreset.tertiary()} size={20} />}
															onClick={(e) => e.stopPropagation()}
														/>
													</UiPopover>
												</div>
											</div>
										</div>
									</UiListItem>
								);
							}}
						/>
					</section>

					{/* 우측: 권한 그룹 상세 */}
					<section className={clsx("rt_dpermi__panel", "rt_dpermi__detail")}>
						<Activity mode={!responsePermissionGroupGetListSuspense.data.selectedPermissionGroup ? "visible" : "hidden"}>
							<UiEmpty
								description={
									<Fragment>
										No permission selected.
										<br />
										Create or select a permission to review access policy.
									</Fragment>
								}
							/>
						</Activity>
						<Activity mode={responsePermissionGroupGetListSuspense.data.selectedPermissionGroup ? "visible" : "hidden"}>
							<Activity mode={responsePermissionGroupGetItem.data ? "visible" : "hidden"}>
								<div className={clsx("rt_dpermi__detailContent")}>
									{/* 상단: 권한 그룹 기본 정보 */}
									<div className={clsx("rt_dpermi__detailHeader")}>
										<div>
											<div className={clsx("rt_dpermi__detailHeading")}>
												<UiTypoTitle level={3}>{responsePermissionGroupGetItem.data?.permissionGroup.name}</UiTypoTitle>
											</div>
											<UiTypoText type="secondary">{responsePermissionGroupGetItem.data?.permissionGroup.description}</UiTypoText>
										</div>
									</div>

									{/* 중단: API 엔드포인트 접근 정책 */}
									<div className={clsx("rt_dpermi__section")}>
										<div className={clsx("rt_dpermi__sectionHeader")}>
											<UiTypoTitle level={5}>Assigned permissions</UiTypoTitle>
											<div className={clsx("rt_dpermi__sectionMetaRow")}>
												<div className={clsx("rt_dpermi__sectionCount")}>
													<MenuAlt02 {...iconPreset.tertiary()} />
													<UiTypoText>{responsePermissionGroupGetItem.data?.permissions?.length}</UiTypoText>
												</div>
												<div className={clsx("rt_dpermi__sectionActions")}>
													<UiButton
														type="primary"
														onClick={handlePermissionEditEndpointPolicyButtonClick}
														icon={<Edit {...iconPreset.outlined()} />}
													>
														Edit access
													</UiButton>
												</div>
											</div>
										</div>
										<Activity mode={responsePermissionGroupGetItem.data?.permissions?.length ? "hidden" : "visible"}>
											<div className={clsx("rt_dpermi__emptyBox")}>
												<UiEmpty description="No endpoint policy." />
											</div>
										</Activity>
										<Activity mode={responsePermissionGroupGetItem.data?.permissions?.length ? "visible" : "hidden"}>
											<div className={clsx("rt_dpermi__matrix")}>
												{responsePermissionGroupGetItem.data?.permissions?.map((permission) => (
													<div key={permission.tagName} className={clsx("rt_dpermi__matrixRow")}>
														<div className={clsx("rt_dpermi__matrixInfo")}>
															<UiTypoText strong>{permission.tagName}</UiTypoText>
															<UiTypoText type="secondary">
																{
																	responsePermissionGroupGetApiEndpointListSuspense.data.endpoints.find(
																		(apiEndpoint) => apiEndpoint.tagName === permission.tagName,
																	)?.tagDescription
																}
															</UiTypoText>
														</div>
														<div className={clsx("rt_dpermi__matrixActions")}>
															<Activity mode={permission.httpMethods.length ? "hidden" : "visible"}>
																<UiTag variant="outlined" color="default">
																	No endpoint method
																</UiTag>
															</Activity>
															<Activity mode={permission.httpMethods.length ? "visible" : "hidden"}>
																{permission.httpMethods.map((method) => (
																	<UiTag key={`${permission.tagName}-${method}`} variant="outlined">
																		{method}
																	</UiTag>
																))}
															</Activity>
														</div>
													</div>
												))}
											</div>
										</Activity>
									</div>

									{/* 하단: 할당된 사용자 목록 */}
									<div className={clsx("rt_dpermi__section")}>
										<div className={clsx("rt_dpermi__sectionHeader")}>
											<UiTypoTitle level={5}>Assigned users</UiTypoTitle>
											<div className={clsx("rt_dpermi__sectionMetaRow")}>
												<div className={clsx("rt_dpermi__sectionCount")}>
													<MenuAlt02 {...iconPreset.tertiary()} />
													<UiTypoText>{responsePermissionGroupGetItem.data?.permissionGroupAdmin?.length}</UiTypoText>
												</div>
												<div className={clsx("rt_dpermi__sectionActions")}>
													<UiButton
														type="primary"
														icon={<Edit {...iconPreset.outlined()} />}
														onClick={handlePermissionEditAssignedUsersButtonClick}
													>
														Edit users
													</UiButton>
												</div>
											</div>
										</div>
										<Activity mode={responsePermissionGroupGetItem.data?.permissionGroupAdmin?.length ? "hidden" : "visible"}>
											<div className={clsx("rt_dpermi__emptyBox")}>
												<UiEmpty description="No assigned users." />
											</div>
										</Activity>
										<Activity mode={responsePermissionGroupGetItem.data?.permissionGroupAdmin?.length ? "visible" : "hidden"}>
											<div className={clsx("rt_dpermi__userList")}>
												{responsePermissionGroupGetItem.data?.permissionGroupAdmin?.map((admin) => (
													<div key={admin.id} className={clsx("rt_dpermi__userItem")}>
														<UiAvatar size={30}>
															<User filled size={19} />
														</UiAvatar>
														<div className={clsx("rt_dpermi__userInfo")}>
															<UiTypoText>{admin.name}</UiTypoText>
															<UiTypoText type="secondary">{admin.loginId}</UiTypoText>
														</div>
														<UiTag variant="outlined" color={admin.removed ? "red" : "green"}>
															{admin.removed ? "Removed" : "Active"}
														</UiTag>
													</div>
												))}
											</div>
										</Activity>
									</div>
								</div>
							</Activity>
						</Activity>
					</section>
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
