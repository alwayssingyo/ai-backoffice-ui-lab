import {Fragment} from "react";
import {type GetProps, Select} from "antd";

export type AntDesignSelectProps = GetProps<typeof Select>;

interface UiSelectProps extends AntDesignSelectProps {
	dontUseThisProp?: never;
}

const UiSelect = (props: UiSelectProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Select {...rest} />
		</Fragment>
	);
};

export default UiSelect;
