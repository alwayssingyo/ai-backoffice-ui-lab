/**
 * @summary 테마 기본 색상 프리셋 항목
 * @property label 프리셋 표시 이름
 * @property color 저장할 primary color hex 값
 * @property description 프리셋 설명
 */
export interface ThemePrimaryPresetItem {
	label: string;
	color: string;
	description: string;
}

export const THEME_PRIMARY_PRESET_ITEMS = [
	{label: "Graphite", color: "#282828", description: "Balanced neutral default"},
	{label: "Ocean", color: "#1677ff", description: "Bright product accent"},
	{label: "Teal", color: "#0f766e", description: "Calm operational tone"},
	{label: "Green", color: "#16a34a", description: "Positive publishing mood"},
	{label: "Orange", color: "#ea580c", description: "Warm attention cue"},
	{label: "Red", color: "#dc2626", description: "Strong alert emphasis"},
	{label: "Violet", color: "#7c3aed", description: "More expressive branding"},
] satisfies ThemePrimaryPresetItem[];
