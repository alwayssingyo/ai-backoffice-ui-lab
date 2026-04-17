import {Fragment, type MouseEventHandler, useEffect, useState} from "react";
import clsx from "clsx";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiTransfer from "@/components/ui/transfer/ui-transfer.tsx";
import type {AntDesignTransferProps} from "@/components/ui/transfer/ui-transfer.tsx";
import type {AdminPermissionGroupBulkUpdateRequest} from "@/services/types/admin-permission-group-bulk-update-request.ts";
import type {AdminSummaryResponse} from "@/services/types/admin-summary-response.ts";
import "./modal-permission-member-form.css";

export type ModalPermissionMemberFormValues = Pick<AdminPermissionGroupBulkUpdateRequest, "adminIds">;

interface ModalPermissionMemberFormProps {
	initialValues: ModalPermissionMemberFormValues;
	members: AdminSummaryResponse[];
	dontUseThisProp?: never;
}

interface PermissionMemberTransferItem {
	key: string;
	title: string;
	loginId: string;
	disabled: boolean;
}

const ModalPermissionMemberForm = (props: ModalPermissionMemberFormProps) => {
	const {dontUseThisProp, initialValues, members} = props;
	const modal = useModal();
	const [selectedUserKeys, setSelectedUserKeys] = useState<string[]>([]);
	const [targetUserKeys, setTargetUserKeys] = useState<string[]>([]);

	/**
	 * @summary 초기 할당된 멤버를 트랜스퍼 타겟으로 반영합니다.
	 */
	useEffect(() => {
		setTargetUserKeys(initialValues.adminIds.map((assignedUserId) => String(assignedUserId)));
	}, [initialValues.adminIds]);

	const memberTransferItems: PermissionMemberTransferItem[] = members.map((member) => ({
		key: String(member.id),
		title: member.name,
		loginId: member.loginId,
		disabled: member.removed,
	}));

	/**
	 * @summary 트랜스퍼 좌우 이동 시 선택 대상 키를 갱신합니다.
	 */
	const handleTransferChange: AntDesignTransferProps["onChange"] = (nextTargetKeys) => {
		setTargetUserKeys(nextTargetKeys.map((nextTargetKey) => String(nextTargetKey)));
	};

	/**
	 * @summary 트랜스퍼 좌우 선택 시 선택 키를 갱신합니다.
	 */
	const handleTransferSelectChange: AntDesignTransferProps["onSelectChange"] = (sourceSelectedKeys, targetSelectedKeys) => {
		setSelectedUserKeys([...sourceSelectedKeys, ...targetSelectedKeys].map((selectedKey) => String(selectedKey)));
	};

	/**
	 * @summary 할당된 멤버 변경 결과를 반환하고 모달을 닫습니다.
	 */
	const handleSaveButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		const adminIds = targetUserKeys.map((targetUserKey) => Number(targetUserKey));
		modal.resolve({adminIds: adminIds} satisfies ModalPermissionMemberFormValues);
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
		<Fragment>
			{dontUseThisProp}
			<UiModal width={850} onCancel={handleCancelButtonClick}>
				<div className={clsx("loc_mpmf__transfer")}>
					<UiTypoTitle level={4}>Edit assigned users</UiTypoTitle>
					<UiTransfer
						dataSource={memberTransferItems}
						targetKeys={targetUserKeys}
						selectedKeys={selectedUserKeys}
						onChange={handleTransferChange}
						onSelectChange={handleTransferSelectChange}
						render={(item) => {
							const memberTransferItem = item as PermissionMemberTransferItem;

							return (
								<div className={clsx("loc_mpmf__memberItem")}>
									<div className={clsx("loc_mpmf__memberInfo")}>
										<span className={clsx("loc_mpmf__memberName")}>{memberTransferItem.title}</span>
										<span className={clsx("loc_mpmf__memberLoginId")}>{memberTransferItem.loginId}</span>
									</div>
								</div>
							);
						}}
						showSearch
						oneWay
						locale={{searchPlaceholder: "Search users", itemUnit: "users", itemsUnit: "users"}}
						filterOption={(inputValue, option) => {
							if (!option) {
								return false;
							}

							const lowerInputValue = inputValue.toLowerCase();
							const lowerTitle = String(option.title).toLowerCase();
							const lowerDescription = String(option.description).toLowerCase();
							return lowerTitle.includes(lowerInputValue) || lowerDescription.includes(lowerInputValue);
						}}
						titles={["Available Users", "Assigned Users"]}
					/>
					<div className={clsx("loc_mpmf__actions")}>
						<UiButton onClick={handleCancelButtonClick}>Cancel</UiButton>
						<UiButton type="primary" onClick={handleSaveButtonClick}>
							Save
						</UiButton>
					</div>
				</div>
			</UiModal>
		</Fragment>
	);
};

export default NiceModal.create(ModalPermissionMemberForm);
