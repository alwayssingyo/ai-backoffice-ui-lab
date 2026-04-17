import {Fragment} from "react";
import {type GetProps, Tag} from "antd";

export type AntDesignTagProps = GetProps<typeof Tag>;

interface UiTagProps extends AntDesignTagProps {
	dontUseThisProp?: never;
}

const UiTag = (props: UiTagProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Tag {...rest} />
		</Fragment>
	);
};

export default UiTag;
