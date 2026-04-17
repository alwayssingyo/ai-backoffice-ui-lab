import {Fragment} from "react";
import {Checkbox, type GetProps} from "antd";

export type AntDesignCheckboxProps = GetProps<typeof Checkbox>;

interface UiCheckboxProps extends AntDesignCheckboxProps {
	dontUseThisProp?: never;
}

const UiCheckbox = (props: UiCheckboxProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Checkbox {...rest}>{children}</Checkbox>
		</Fragment>
	);
};

export default UiCheckbox;
