import type {ReactNode} from "react";
import clsx from "clsx";
import "./widget-content.css";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";

interface WidgetContentHeaderProps {
	/**
	 * @description 컨텐츠 영역 타이틀
	 * @type string
	 */
	title?: string;
	/**
	 * @description 컨텐츠 영역 설명
	 * @type string
	 */
	desc?: string;
	/**
	 * @description 헤더 우측 액션 영역
	 * @type ReactNode
	 */
	children?: ReactNode;
}

const WidgetContentHeader = (props: WidgetContentHeaderProps) => {
	const {title, desc, children} = props;

	return (
		<div className={clsx("wg_contHeader")}>
			<div className={clsx("wg_contHeader__inner")}>
				<div className={clsx("wg_contHeader__title")}>
					<div className={clsx("wg_contHeader__top")}>
						<UiTypoTitle level={2}>{title}</UiTypoTitle>
					</div>
					<div className={clsx("wg_contHeader__bottom")}>{desc}</div>
				</div>
				<div className={clsx("wg_contHeader__actions")}>{children}</div>
			</div>
		</div>
	);
};

export default WidgetContentHeader;
