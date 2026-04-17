import type {ReactNode} from "react";
import clsx from "clsx";
import "./widget-content.css";

interface WidgetContentBodyProps {
	/**
	 * @description 컨텐츠 내용
	 * @type ReactNode
	 */
	children: ReactNode;
}

const WidgetContentBody = (props: WidgetContentBodyProps) => {
	const {children} = props;

	return (
		<div className={clsx("wg_contBody")}>
			<div className={clsx("wg_contBody__inner")}>{children}</div>
		</div>
	);
};

export default WidgetContentBody;
