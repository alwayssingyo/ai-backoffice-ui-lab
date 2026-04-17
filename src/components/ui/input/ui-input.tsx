import {Fragment} from "react";
import {Input, type GetProps} from "antd";

export type AntDesignInputProps = GetProps<typeof Input>;

interface UiInputProps extends AntDesignInputProps {
	dontUseThisProp?: never;
}

const UiInput = (props: UiInputProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Input allowClear={true} {...rest} />
		</Fragment>
	);
};

export default UiInput;
