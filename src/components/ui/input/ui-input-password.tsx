import {Fragment} from "react";
import {Input, type GetProps} from "antd";

export type AntDesignInputPasswordProps = GetProps<typeof Input.Password>;

interface UiInputPasswordProps extends AntDesignInputPasswordProps {
	dontUseThisProp?: never;
}

const UiInputPassword = (props: UiInputPasswordProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Input.Password allowClear={true} {...rest} />
		</Fragment>
	);
};

export default UiInputPassword;
