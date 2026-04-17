import {create} from "zustand";
import {combine} from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export const DEFAULT_THEME_MODE: ThemeMode = "light";
export const DEFAULT_THEME_PRIMARY_COLOR = "#282828";
export const THEME_MODE_CONFIG_KEY = "theme-mode";
export const THEME_PRIMARY_COLOR_CONFIG_KEY = "primary-color";

const THEME_PRIMARY_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type ThemeState = {mode: ThemeMode; primaryColor: string};

type ThemeAction = {
	toggleTheme: () => void;
	setTheme: (mode: ThemeMode) => void;
	setPrimaryColor: (primaryColor: string) => void;
	resetTheme: () => void;
};

export const normalizeThemeMode = (value?: string): ThemeMode => {
	return value === "dark" ? "dark" : DEFAULT_THEME_MODE;
};

export const normalizeThemePrimaryColor = (value?: string) => {
	return value && THEME_PRIMARY_COLOR_PATTERN.test(value) ? value.toLowerCase() : DEFAULT_THEME_PRIMARY_COLOR;
};

export const useThemeStore = create<ThemeState & ThemeAction>()(
	combine<ThemeState, ThemeAction>({mode: DEFAULT_THEME_MODE, primaryColor: DEFAULT_THEME_PRIMARY_COLOR}, (set) => ({
		toggleTheme: () => {
			set((state) => ({mode: state.mode === "light" ? "dark" : "light"}));
		},
		setTheme: (mode: ThemeMode) => {
			set({mode});
		},
		setPrimaryColor: (primaryColor: string) => {
			set({primaryColor: normalizeThemePrimaryColor(primaryColor)});
		},
		resetTheme: () => {
			set({mode: DEFAULT_THEME_MODE, primaryColor: DEFAULT_THEME_PRIMARY_COLOR});
		},
	})),
);
