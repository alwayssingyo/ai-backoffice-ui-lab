import {type GetProps, Tooltip} from "antd";
import {Fragment} from "react";
export type AntDesignTooltipProps = GetProps<typeof Tooltip>;

export interface UiTooltipProps extends AntDesignTooltipProps {
	dontUseThisProp?: never;
}

const UiTooltip = (props: UiTooltipProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Tooltip {...rest} />
		</Fragment>
	);
};

export default UiTooltip;
