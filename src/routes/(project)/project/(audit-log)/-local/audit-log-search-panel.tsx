import {Activity, type ChangeEventHandler, type MouseEventHandler} from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCheckbox from "@/components/ui/checkbox/ui-checkbox.tsx";
import UiDatePicker from "@/components/ui/datepicker/ui-date-picker.tsx";
import UiEmpty from "@/components/ui/empty/ui-empty.tsx";
import UiInput from "@/components/ui/input/ui-input.tsx";
import UiRadio from "@/components/ui/radio/ui-radio.tsx";
import UiRadioGroup from "@/components/ui/radio/ui-radio-group.tsx";
import UiSelect from "@/components/ui/select/ui-select.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import {
	getAuditLogFilterPlaceholder,
	isAuditLogBetweenOperator,
	type AuditLogFilterDefinition,
	type AuditLogFilterFieldStateMap,
} from "../audit-log.ts";
import "./audit-log-search-panel.css";

interface AuditLogSearchPanelProps {
	definitions: AuditLogFilterDefinition[];
	fieldStates: AuditLogFilterFieldStateMap;
	isLoading: boolean;
	isError: boolean;
	onRetry: MouseEventHandler<HTMLButtonElement>;
	onSubmit: MouseEventHandler<HTMLButtonElement>;
	onValueChange: (definition: AuditLogFilterDefinition, value: unknown) => void;
}

const getAuditLogFilterTestIdKey = (definition: AuditLogFilterDefinition) => {
	return definition.field.length > 0 ? definition.field : `definition-${definition.id}`;
};

const AuditLogSearchPanel = (props: AuditLogSearchPanelProps) => {
	const renderRestrictedControl = (definition: AuditLogFilterDefinition) => {
		if (definition.component === "radio") {
			return (
				<UiRadioGroup disabled className={clsx("rt_palsp__radioGroup")}>
					<UiRadio value="restricted">Option metadata unavailable</UiRadio>
				</UiRadioGroup>
			);
		}

		if (definition.component === "checkbox") {
			return (
				<div className={clsx("rt_palsp__checkboxGroup")}>
					<UiCheckbox disabled checked={false}>
						Option metadata unavailable
					</UiCheckbox>
				</div>
			);
		}

		if (definition.component === "select") {
			return <UiSelect disabled style={{width: "100%"}} options={[]} placeholder="Option metadata unavailable" />;
		}

		return <UiInput disabled placeholder={definition.restrictionReason ?? "Unavailable filter"} />;
	};

	const renderFilterControl = (definition: AuditLogFilterDefinition) => {
		const fieldState = props.fieldStates[definition.id];

		if (!fieldState || !fieldState.isEnabled) {
			return renderRestrictedControl(definition);
		}

		if (definition.component === "datetime") {
			if (isAuditLogBetweenOperator(definition.operator)) {
				const rangeValue =
					typeof fieldState.value === "object" && fieldState.value !== null && "start" in fieldState.value && "end" in fieldState.value
						? fieldState.value
						: {start: "", end: ""};
				const startValue = typeof rangeValue.start === "string" && dayjs(rangeValue.start).isValid() ? dayjs(rangeValue.start) : null;
				const endValue = typeof rangeValue.end === "string" && dayjs(rangeValue.end).isValid() ? dayjs(rangeValue.end) : null;

				return (
					<div className={clsx("rt_palsp__rangeGroup")}>
						<UiDatePicker
							showTime
							format="YYYY-MM-DD HH:mm:ss"
							style={{width: "100%"}}
							placeholder={getAuditLogFilterPlaceholder(definition, "start")}
							value={startValue}
							onChange={(_value, dateString) => {
								props.onValueChange(definition, {
									start: Array.isArray(dateString) ? (dateString[0] ?? "") : dateString,
									end: typeof rangeValue.end === "string" ? rangeValue.end : "",
								});
							}}
							data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}-start`}
						/>
						<UiDatePicker
							showTime
							format="YYYY-MM-DD HH:mm:ss"
							style={{width: "100%"}}
							placeholder={getAuditLogFilterPlaceholder(definition, "end")}
							value={endValue}
							onChange={(_value, dateString) => {
								props.onValueChange(definition, {
									start: typeof rangeValue.start === "string" ? rangeValue.start : "",
									end: Array.isArray(dateString) ? (dateString[0] ?? "") : dateString,
								});
							}}
							data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}-end`}
						/>
					</div>
				);
			}

			const dateValue = typeof fieldState.value === "string" && dayjs(fieldState.value).isValid() ? dayjs(fieldState.value) : null;

			return (
				<UiDatePicker
					showTime
					format="YYYY-MM-DD HH:mm:ss"
					style={{width: "100%"}}
					placeholder={getAuditLogFilterPlaceholder(definition)}
					value={dateValue}
					onChange={(_value, dateString) => {
						props.onValueChange(definition, Array.isArray(dateString) ? (dateString[0] ?? "") : dateString);
					}}
					data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}`}
				/>
			);
		}

		if (definition.component === "text") {
			if (isAuditLogBetweenOperator(definition.operator)) {
				const rangeValue =
					typeof fieldState.value === "object" && fieldState.value !== null && "start" in fieldState.value && "end" in fieldState.value
						? fieldState.value
						: {start: "", end: ""};

				return (
					<div className={clsx("rt_palsp__rangeGroup")}>
						<UiInput
							allowClear
							placeholder={getAuditLogFilterPlaceholder(definition, "start")}
							value={typeof rangeValue.start === "string" ? rangeValue.start : ""}
							onChange={(event) => {
								props.onValueChange(definition, {start: event.target.value, end: typeof rangeValue.end === "string" ? rangeValue.end : ""});
							}}
							data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}-start`}
						/>
						<UiInput
							allowClear
							placeholder={getAuditLogFilterPlaceholder(definition, "end")}
							value={typeof rangeValue.end === "string" ? rangeValue.end : ""}
							onChange={(event) => {
								props.onValueChange(definition, {
									start: typeof rangeValue.start === "string" ? rangeValue.start : "",
									end: event.target.value,
								});
							}}
							data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}-end`}
						/>
					</div>
				);
			}

			const handleTextChange: ChangeEventHandler<HTMLInputElement> = (event) => {
				props.onValueChange(definition, event.target.value);
			};

			return (
				<UiInput
					allowClear
					placeholder={getAuditLogFilterPlaceholder(definition)}
					value={typeof fieldState.value === "string" ? fieldState.value : ""}
					onChange={handleTextChange}
					data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}`}
				/>
			);
		}

		if (definition.component === "radio") {
			return (
				<UiRadioGroup
					value={typeof fieldState.value === "string" ? fieldState.value : undefined}
					onChange={(event) => {
						props.onValueChange(definition, event.target.value);
					}}
				>
					{definition.items.map((item) => (
						<UiRadio key={`${definition.id}-${item.value}`} value={item.value}>
							{item.label}
						</UiRadio>
					))}
				</UiRadioGroup>
			);
		}

		if (definition.component === "checkbox") {
			const checkboxValue = Array.isArray(fieldState.value)
				? fieldState.value.filter((item): item is string => typeof item === "string")
				: [];

			return (
				<div className={clsx("rt_palsp__checkboxGroup")}>
					{definition.items.map((item) => {
						const isChecked = checkboxValue.includes(item.value);

						return (
							<UiCheckbox
								key={`${definition.id}-${item.value}`}
								checked={isChecked}
								onChange={(event) => {
									props.onValueChange(
										definition,
										event.target.checked ? [...checkboxValue, item.value] : checkboxValue.filter((value) => value !== item.value),
									);
								}}
							>
								{item.label}
							</UiCheckbox>
						);
					})}
				</div>
			);
		}

		if (definition.component === "select") {
			return (
				<UiSelect
					allowClear
					style={{width: "100%"}}
					mode={definition.operator === "in" || definition.operator === "notIn" ? "multiple" : undefined}
					options={definition.items.map((item) => ({label: item.label, value: item.value}))}
					value={
						definition.operator === "in" || definition.operator === "notIn"
							? Array.isArray(fieldState.value)
								? fieldState.value
								: []
							: typeof fieldState.value === "string"
								? fieldState.value
								: undefined
					}
					placeholder={getAuditLogFilterPlaceholder(definition)}
					onChange={(value) => {
						props.onValueChange(definition, value ?? (definition.operator === "in" || definition.operator === "notIn" ? [] : ""));
					}}
					data-testid={`audit-log-filter-input-${getAuditLogFilterTestIdKey(definition)}`}
				/>
			);
		}

		return renderRestrictedControl(definition);
	};

	return (
		<section className={clsx("rt_palsp__root")} data-testid="audit-log-search-panel">
			<div className={clsx("rt_palsp__header")}>
				<div className={clsx("rt_palsp__heading")}>
					<UiTypoText strong>Search Conditions</UiTypoText>
					<UiTypoText type="secondary">Filter definitions for audit log query</UiTypoText>
				</div>
				<div className={clsx("rt_palsp__actions")}>
					<Activity mode={props.isError ? "visible" : "hidden"}>
						<UiButton onClick={props.onRetry}>다시 시도</UiButton>
					</Activity>
					<UiButton type="primary" onClick={props.onSubmit} disabled={props.isLoading} data-testid="audit-log-search-panel-submit">
						조회
					</UiButton>
				</div>
			</div>

			<Activity mode={props.isLoading ? "visible" : "hidden"}>
				<div className={clsx("rt_palsp__empty")}>
					<UiTypoText type="secondary">검색 조건을 불러오는 중입니다.</UiTypoText>
				</div>
			</Activity>

			<Activity mode={!props.isLoading && props.isError ? "visible" : "hidden"}>
				<div className={clsx("rt_palsp__empty", "rt_palsp__empty--error")}>
					<UiTypoText>검색 조건을 불러오지 못했습니다.</UiTypoText>
				</div>
			</Activity>

			<Activity mode={!props.isLoading && !props.isError && props.definitions.length < 1 ? "visible" : "hidden"}>
				<div className={clsx("rt_palsp__empty")}>
					<UiEmpty description="사용 가능한 검색 조건이 없습니다." />
				</div>
			</Activity>

			<Activity mode={!props.isLoading && !props.isError && props.definitions.length > 0 ? "visible" : "hidden"}>
				<div className={clsx("rt_palsp__rows")}>
					{props.definitions.map((definition) => {
						const fieldState = props.fieldStates[definition.id];
						const testIdKey = getAuditLogFilterTestIdKey(definition);

						return (
							<div key={definition.id} className={clsx("rt_palsp__row")} data-testid={`audit-log-filter-row-${testIdKey}`}>
								<div className={clsx("rt_palsp__labelGroup")}>
									<UiTypoText strong data-testid={`audit-log-filter-label-${testIdKey}`}>
										{definition.displayLabel}
									</UiTypoText>
								</div>
								<div className={clsx("rt_palsp__controlGroup")}>
									{renderFilterControl(definition)}
									<Activity mode={fieldState?.isEnabled === false && definition.restrictionReason ? "visible" : "hidden"}>
										<UiTypoText
											type="secondary"
											className={clsx("rt_palsp__helper")}
											data-testid={`audit-log-filter-restriction-${testIdKey}`}
										>
											{definition.restrictionReason}
										</UiTypoText>
									</Activity>
								</div>
							</div>
						);
					})}
				</div>
			</Activity>
		</section>
	);
};

export default AuditLogSearchPanel;
