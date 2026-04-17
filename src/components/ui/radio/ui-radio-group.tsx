import {Fragment} from "react";
import {type GetProps, Radio} from "antd";

export type AntDesignRadioGroupProps = GetProps<typeof Radio.Group>;

interface UiRadioGroupProps extends AntDesignRadioGroupProps {
	dontUseThisProp?: never;
}

const UiRadioGroup = (props: UiRadioGroupProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Radio.Group {...rest}>{children}</Radio.Group>
		</Fragment>
	);
};

export default UiRadioGroup;
