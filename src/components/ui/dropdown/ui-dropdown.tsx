import {Fragment} from "react";
import {Dropdown, type GetProps} from "antd";

export type AntDesignDropdownProps = GetProps<typeof Dropdown>;

interface UiDropdownProps extends AntDesignDropdownProps {
	dontUseThisProp?: never;
}

const UiDropdown = (props: UiDropdownProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Dropdown {...rest} />
		</Fragment>
	);
};

export default UiDropdown;
