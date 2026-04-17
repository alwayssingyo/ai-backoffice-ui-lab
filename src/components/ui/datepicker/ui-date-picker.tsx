import {Fragment} from "react";
import {DatePicker, type GetProps} from "antd";

export type AntDesignDatePickerProps = GetProps<typeof DatePicker>;

interface UiDatepickerProps extends AntDesignDatePickerProps {
	dontUseThisProp?: never;
}

const UiDatePicker = (props: UiDatepickerProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<DatePicker {...rest} />
		</Fragment>
	);
};

export default UiDatePicker;
