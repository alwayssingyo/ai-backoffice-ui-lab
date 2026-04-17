import {Fragment} from "react";
import {type GetProps, List} from "antd";

export type AntDesignListItemProps = GetProps<typeof List.Item>;

interface UiListItemProps extends AntDesignListItemProps {
	dontUseThisProp?: never;
}

const UiListItem = (props: UiListItemProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<List.Item {...rest}>{children}</List.Item>
		</Fragment>
	);
};

export default UiListItem;
