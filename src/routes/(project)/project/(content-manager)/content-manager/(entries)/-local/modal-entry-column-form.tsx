import {Activity, type MouseEventHandler, useEffect, useState} from "react";
import clsx from "clsx";
import NiceModal, {useModal} from "@ebay/nice-modal-react";
import UiModal from "@/components/ui/modal/ui-modal.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCheckbox from "@/components/ui/checkbox/ui-checkbox.tsx";
import type {ContentTypeColumnResponse} from "@/services/types/content-type-column-response.ts";
import {screamingSnakeCase} from "@kubb/core/transformers";
import "./modal-entry-column-form.css";

export type ModalEntryColumnFormValues = {visibleColumnNames: string[]};

interface ModalEntryColumnFormProps {
	columns: ContentTypeColumnResponse[];
	initialValues: ModalEntryColumnFormValues;
}

const ModalEntryColumnForm = (props: ModalEntryColumnFormProps) => {
	const {columns, initialValues} = props;
	const modal = useModal();
	const [visibleColumnNames, setVisibleColumnNames] = useState<string[]>([]);

	/**
	 * @summary 모달 초기 선택값 체크 상태 동기화
	 */
	useEffect(() => {
		setVisibleColumnNames(initialValues.visibleColumnNames);
	}, [initialValues.visibleColumnNames]);

	/**
	 * @summary 컬럼 체크 상태 토글
	 */
	const handleColumnCheckChange = (columnName: string, checked: boolean) => {
		setVisibleColumnNames((prevVisibleColumnNames) => {
			if (checked) {
				if (prevVisibleColumnNames.includes(columnName)) {
					return prevVisibleColumnNames;
				}

				return [...prevVisibleColumnNames, columnName];
			}

			return prevVisibleColumnNames.filter((visibleColumnName) => visibleColumnName !== columnName);
		});
	};

	/**
	 * @summary 저장 시 선택된 컬럼명 반환 및 모달 닫기
	 */
	const handleSaveButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		if (visibleColumnNames.length < 1) {
			return;
		}

		modal.resolve({visibleColumnNames} satisfies ModalEntryColumnFormValues);
		void modal.hide();
	};

	/**
	 * @summary 취소 시 결과 없이 모달 닫기
	 */
	const handleCancelButtonClick: MouseEventHandler<HTMLButtonElement> = (_event) => {
		modal.resolve(null);
		void modal.hide();
	};

	return (
		<UiModal onCancel={handleCancelButtonClick} width={520}>
			<div className={clsx("loc_mecf__root")}>
				<div className={clsx("loc_mecf__header")}>
					<UiTypoTitle level={4}>Column settings</UiTypoTitle>
					<UiTypoText type="secondary">Select columns to show in the table.</UiTypoText>
				</div>
				<div className={clsx("loc_mecf__body")}>
					{columns.map((column) => (
						// biome-ignore lint/a11y/noLabelWithoutControl: IDONCARE
						<label key={column.name} className={clsx("loc_mecf__item")}>
							<UiCheckbox
								checked={visibleColumnNames.includes(column.name)}
								onChange={(event) => {
									handleColumnCheckChange(column.name, event.target.checked);
								}}
							/>
							<UiTypoText>{screamingSnakeCase(column.name)}</UiTypoText>
						</label>
					))}
				</div>
				<Activity mode={visibleColumnNames.length < 1 ? "visible" : "hidden"}>
					<UiTypoText type="danger">At least one column must be selected.</UiTypoText>
				</Activity>
				<div className={clsx("loc_mecf__footer")}>
					<UiButton onClick={handleCancelButtonClick}>Cancel</UiButton>
					<UiButton type="primary" onClick={handleSaveButtonClick} disabled={visibleColumnNames.length < 1}>
						Save
					</UiButton>
				</div>
			</div>
		</UiModal>
	);
};

export default NiceModal.create(ModalEntryColumnForm);
