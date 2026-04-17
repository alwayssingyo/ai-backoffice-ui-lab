import {Empty, type GetProps} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-empty.css";

export type AntDesignEmptyProps = GetProps<typeof Empty>;

interface UiEmptyProps extends AntDesignEmptyProps {
	dontUseThisProp?: never;
}

const UiEmpty = (props: UiEmptyProps) => {
	const {dontUseThisProp, className, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Empty className={clsx("ui_empty", className)} image={Empty.PRESENTED_IMAGE_SIMPLE} {...rest} />
		</Fragment>
	);
};

export default UiEmpty;
