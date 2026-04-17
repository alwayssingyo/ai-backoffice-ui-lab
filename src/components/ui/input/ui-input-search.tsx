import {Fragment} from "react";
import {type GetProps, Input} from "antd";

export type AntDesignInputSearchProps = GetProps<typeof Input.Search>;

export interface UiInputSearchProps extends AntDesignInputSearchProps {
	dontUseThisProp?: never;
}

const UiInputSearch = (props: UiInputSearchProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Input.Search {...rest} />
		</Fragment>
	);
};

export default UiInputSearch;
