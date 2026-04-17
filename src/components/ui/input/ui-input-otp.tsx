import {Fragment} from "react";
import {type GetProps, Input} from "antd";

export type AntDesignInputOTPProps = GetProps<typeof Input.OTP>;

interface UiInputOtpProps extends AntDesignInputOTPProps {
	dontUseThisProp?: never;
}

const UiInputOtp = (props: UiInputOtpProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Input.OTP {...rest} />
		</Fragment>
	);
};

export default UiInputOtp;
