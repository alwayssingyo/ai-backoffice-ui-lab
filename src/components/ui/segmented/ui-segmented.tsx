import {Fragment} from "react";
import {type GetProps, Segmented} from "antd";
import clsx from "clsx";
import "./ui-segmented.css";

export type AntDesignSegmentedProps = GetProps<typeof Segmented>;

/**
 * @summary Ui segmented props
 * @property dontUseThisProp 내부 사용 금지용 placeholder prop
 */
export interface UiSegmentedProps extends AntDesignSegmentedProps {
	dontUseThisProp?: never;
}

const UiSegmented = (props: UiSegmentedProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Segmented className={clsx("ui_segmented")} {...rest} />
		</Fragment>
	);
};

export default UiSegmented;
