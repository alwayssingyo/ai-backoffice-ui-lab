import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {config} from "@/entry/config.ts";

dayjs.extend(customParseFormat);

type DatePickerMapKey = keyof typeof config.date.pickerMap;

/**
 * @summary 날짜 값을 지정된 형식으로 포맷팅합니다
 * @description 입력된 값을 dateType에 따라 적절한 포맷으로 변환합니다.
 * TIME 타입의 경우 시간 형식으로 파싱하고, 그 외에는 일반 날짜/시간으로 파싱합니다.
 *
 * @param {unknown} value - 포맷팅할 날짜 값 (문자열, 숫자, Date 객체 등)
 * @param {DatePickerMapKey} [dateType] - 날짜 타입 (DATE_PICKER_MAP의 키값, 기본값: DATE_TIME)
 * @returns {string | null} 포맷팅된 날짜 문자열, 유효하지 않은 경우 null 반환
 *
 * @example
 * formatDateValue('2024-01-01', 'DATE') // '2024-01-01'
 * formatDateValue('14:30', 'TIME') // '14:30:00'
 * formatDateValue(null) // null
 * formatDateValue('2024-01-01 10:00:00') // '2024-01-01 10:00:00'
 */
export const formatDateValue = (value: unknown, dateType: DatePickerMapKey = "DATE_TIME") => {
	if (value == null) return null;

	const format = config.date.pickerMap[dateType]?.valueFormat ?? config.date.formats.dateTime;
	const parsed = dateType === "TIME" ? dayjs(String(value), config.date.formats.time) : dayjs(value as string | number | Date);

	if (!parsed.isValid()) return null;

	return parsed.format(format);
};

export default dayjs;
