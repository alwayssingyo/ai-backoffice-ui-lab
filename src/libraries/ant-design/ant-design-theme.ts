import type {ThemeConfig} from "antd/es/config-provider/context";
import {DEFAULT_THEME_PRIMARY_COLOR, type ThemeMode} from "@/stores/use-theme-store.ts";

type PrimaryThemeToken = Pick<
	NonNullable<ThemeConfig["token"]>,
	"colorPrimary" | "colorPrimaryHover" | "colorPrimaryActive" | "colorPrimaryBg" | "colorPrimaryBgHover"
>;

const DEFAULT_LIGHT_PRIMARY_THEME_TOKEN: PrimaryThemeToken = {
	colorPrimary: DEFAULT_THEME_PRIMARY_COLOR,
	colorPrimaryHover: "#4a4f57",
	colorPrimaryActive: "#24262a",
	colorPrimaryBg: "#dcdcdc",
	colorPrimaryBgHover: "#eef0f2",
};

const clampRgbChannel = (value: number): number => {
	return Math.max(0, Math.min(255, Math.round(value)));
};

const normalizeHexColor = (value: string): string => {
	const trimmedValue = value.trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/.test(trimmedValue)) {
		return trimmedValue;
	}

	return DEFAULT_THEME_PRIMARY_COLOR;
};

const mixHexColor = (baseHexColor: string, mixHexColorValue: string, mixPercentage: number): string => {
	const normalizedBaseHexColor = normalizeHexColor(baseHexColor);
	const normalizedMixHexColor = normalizeHexColor(mixHexColorValue);
	const mixWeight = Math.max(0, Math.min(100, mixPercentage)) / 100;

	const baseColor = Number.parseInt(normalizedBaseHexColor.slice(1), 16);
	const mixColor = Number.parseInt(normalizedMixHexColor.slice(1), 16);

	const redChannel = clampRgbChannel(((baseColor >> 16) & 0xff) * (1 - mixWeight) + ((mixColor >> 16) & 0xff) * mixWeight);
	const greenChannel = clampRgbChannel(((baseColor >> 8) & 0xff) * (1 - mixWeight) + ((mixColor >> 8) & 0xff) * mixWeight);
	const blueChannel = clampRgbChannel((baseColor & 0xff) * (1 - mixWeight) + (mixColor & 0xff) * mixWeight);

	return `#${[redChannel, greenChannel, blueChannel].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

/**
 * @summary Ant Design primary seed 하나를 프로젝트 시각 기준의 파생 토큰 세트로 변환
 */
export const getPrimaryThemeToken = (mode: ThemeMode, primaryColor: string): PrimaryThemeToken => {
	const normalizedPrimaryColor = normalizeHexColor(primaryColor);
	if (mode === "light" && normalizedPrimaryColor === DEFAULT_THEME_PRIMARY_COLOR) {
		return DEFAULT_LIGHT_PRIMARY_THEME_TOKEN;
	}

	if (mode === "dark") {
		return {
			colorPrimary: normalizedPrimaryColor,
			colorPrimaryHover: mixHexColor(normalizedPrimaryColor, "#ffffff", 14),
			colorPrimaryActive: mixHexColor(normalizedPrimaryColor, "#000000", 18),
			colorPrimaryBg: mixHexColor(normalizedPrimaryColor, "#000000", 76),
			colorPrimaryBgHover: mixHexColor(normalizedPrimaryColor, "#000000", 68),
		};
	}

	return {
		colorPrimary: normalizedPrimaryColor,
		colorPrimaryHover: mixHexColor(normalizedPrimaryColor, "#ffffff", 18),
		colorPrimaryActive: mixHexColor(normalizedPrimaryColor, "#000000", 12),
		colorPrimaryBg: mixHexColor(normalizedPrimaryColor, "#ffffff", 85),
		colorPrimaryBgHover: mixHexColor(normalizedPrimaryColor, "#ffffff", 92),
	};
};
