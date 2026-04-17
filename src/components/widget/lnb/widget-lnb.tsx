import type {ReactNode} from "react";
import clsx from "clsx";
import "./widget-lnb.css";

interface WidgetLnbProps {
	/**
	 * @description 타이틀
	 * @type string
	 */
	title?: string;
	/**
	 * @description 서브타이틀
	 * @type string
	 */
	subTitle?: string;
	/**
	 * @description lnb 메뉴 리스트
	 * @type ReactNode
	 */
	children?: ReactNode;
}

const WidgetLnb = (props: WidgetLnbProps) => {
	const {title, subTitle, children} = props;

	return (
		<div className={clsx("wg_lnb")}>
			<div className={clsx("wg_lnb__top")}>
				<div className={clsx("wg_lnb__title")}>{title}</div>
				<div className={clsx("wg_lnb__subTitle")}>{subTitle}</div>
			</div>
			<div className={clsx("wg_lnb__menu")}>{children}</div>
		</div>
	);
};

export default WidgetLnb;
