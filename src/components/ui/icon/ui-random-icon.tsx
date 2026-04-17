import {useMemo, type ElementType} from "react";
import * as GriddyIcons from "griddy-icons";

const ICONS = Object.values(GriddyIcons) as ElementType[];

const getSeededIndex = (seed: string, max: number) => {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash += seed.charCodeAt(i);
	}
	return max === 0 ? 0 : hash % max;
};

interface UiRandomIconProps {
	/**
	 * (선택) 고정된 시드값. 이 값을 넣으면 항상 같은 아이콘이 나옵니다.
	 * 예: 사용자 ID, 사용자 이름 등
	 */
	seed?: string;
	className?: string;
}

export const UiRandomIcon = ({seed, className}: UiRandomIconProps) => {
	const IconComponent = useMemo(() => {
		if (ICONS.length === 0) return null;
		const index = seed ? getSeededIndex(seed, ICONS.length) : Math.floor(Math.random() * ICONS.length);
		return ICONS[index] ?? null;
	}, [seed]);

	if (!IconComponent) return null;

	return <IconComponent className={className} />;
};
