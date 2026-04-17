import type {IconProps} from "griddy-icons";
type IconPresetFunction = (props?: IconProps) => IconProps;

export const iconPreset = {
	primary: (props?: IconProps) => {
		return {filled: true, size: 16, ...props};
	},
	outlined: (props?: IconProps) => {
		return {filled: false, size: 16, ...props};
	},
	tertiary: (props?: IconProps) => {
		return {filled: true, size: 16, style: {color: "var(--cms-color-text-tertiary, rgba(0, 0, 0, 0.45))"}, ...props};
	},
} satisfies Record<string, IconPresetFunction>;
