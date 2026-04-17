import * as date from "../config/date.ts";
import * as navigation from "../config/navigation.ts";
import * as number from "../config/number.ts";
import * as text from "../config/text.ts";

export const config = {date, navigation, number, text} as const;
