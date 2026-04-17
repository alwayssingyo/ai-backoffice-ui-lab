export const formats = {date: "YYYY-MM-DD", time: "HH:mm:ss", dateTime: "YYYY-MM-DD HH:mm:ss"} as const;

export const pickerMap = {
	DATE_TIME: {showTime: true, format: formats.dateTime, valueFormat: formats.dateTime},
	TIME: {picker: "time", format: formats.time, valueFormat: formats.time},
	DATE: {format: formats.date, valueFormat: formats.date},
} as const;
