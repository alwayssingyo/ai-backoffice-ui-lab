import {Fragment} from "react";
import {DatePicker, type GetProps} from "antd";

export type AntDesignRangePickerProps = GetProps<typeof DatePicker.RangePicker>;

interface UiRangePickerProps extends AntDesignRangePickerProps {
	dontUseThisProp?: never;
}

const UiRangePicker = (props: UiRangePickerProps) => {
	const {dontUseThisProp, ...rest} = props;
	const {RangePicker} = DatePicker;

	return (
		<Fragment>
			{dontUseThisProp}
			<RangePicker {...rest} />
		</Fragment>
	);
};

export default UiRangePicker;
