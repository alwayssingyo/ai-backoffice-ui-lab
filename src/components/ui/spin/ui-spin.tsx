import {type GetProps, Spin} from "antd";
import {Fragment} from "react";

export type AntDesignSpinProps = GetProps<typeof Spin>;

interface UiSpinProps extends AntDesignSpinProps {
	dontUseThisProp?: never;
}

const UiSpin = (props: UiSpinProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Spin {...rest} />
		</Fragment>
	);
};

export default UiSpin;
