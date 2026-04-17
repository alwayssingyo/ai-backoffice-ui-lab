import {Fragment} from "react";
import {type GetProps, List} from "antd";

export type AntDesignListProps<T> = GetProps<typeof List<T>>;

interface UiListProps<T> extends AntDesignListProps<T> {
	dontUseThisProp?: never;
}

const UiList = <T,>(props: UiListProps<T>) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<List<T> {...rest} />
		</Fragment>
	);
};

export default UiList;
