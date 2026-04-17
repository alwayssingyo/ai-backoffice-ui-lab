import {Fragment} from "react";
import {InputNumber, type GetProps} from "antd";
import {config} from "@/entry/config.ts";

export type AntDesignInputProps = GetProps<typeof InputNumber>;

interface UiInputProps extends AntDesignInputProps {
	dontUseThisProp?: never;
}

const UiInputNumber = (props: UiInputProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<InputNumber max={config.number.int32Max} min={config.number.int32Min} {...rest} />
		</Fragment>
	);
};

export default UiInputNumber;
