import {Fragment} from "react";
import {type GetProps, Popover} from "antd";

export type AntDesignPopoverProps = GetProps<typeof Popover>;

interface UiPopoverProps extends AntDesignPopoverProps {
	dontUseThisProp?: never;
}

const UiPopover = (props: UiPopoverProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Popover {...rest} />
		</Fragment>
	);
};

export default UiPopover;
