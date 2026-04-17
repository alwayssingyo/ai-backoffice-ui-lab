import {Fragment} from "react";
import {type GetProps, Radio} from "antd";

export type AntDesignRadioProps = GetProps<typeof Radio>;

interface UiRadioProps extends AntDesignRadioProps {
	dontUseThisProp?: never;
}

const UiRadio = (props: UiRadioProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Radio {...rest}>{children}</Radio>
		</Fragment>
	);
};

export default UiRadio;
