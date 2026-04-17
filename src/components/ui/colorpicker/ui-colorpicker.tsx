import {Fragment} from "react";
import {ColorPicker, type GetProps} from "antd";

export type AntDesignColorPickerProps = GetProps<typeof ColorPicker>;

/**
 * @summary Ui color picker props
 * @property dontUseThisProp 내부 사용 금지용 placeholder prop
 */
export interface UiColorpickerProps extends AntDesignColorPickerProps {
	dontUseThisProp?: never;
}

const UiColorpicker = (props: UiColorpickerProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<ColorPicker {...rest} />
		</Fragment>
	);
};

export default UiColorpicker;
