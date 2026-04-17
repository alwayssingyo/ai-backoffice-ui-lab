import {Fragment} from "react";
import {type GetProps, Switch} from "antd";

export type AntDesignSwitchProps = GetProps<typeof Switch>;

interface UiSwitchProps extends AntDesignSwitchProps {
	dontUseThisProp?: never;
}

const UiSwitch = (props: UiSwitchProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Switch {...rest} />
		</Fragment>
	);
};

export default UiSwitch;
