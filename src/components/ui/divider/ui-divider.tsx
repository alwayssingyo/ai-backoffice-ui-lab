import {Fragment} from "react";
import {Divider, type GetProps} from "antd";

export type AntDesignDividerProps = GetProps<typeof Divider>;

interface UiDividerProps extends AntDesignDividerProps {
	dontUseThisProp?: never;
}

const UiDivider = (props: UiDividerProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Divider {...rest} />
		</Fragment>
	);
};

export default UiDivider;
