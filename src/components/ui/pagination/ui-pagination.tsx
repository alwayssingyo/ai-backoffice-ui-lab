import {Fragment} from "react";
import {type GetProps, Pagination} from "antd";

export type AntDesignPaginationProps = GetProps<typeof Pagination>;

export interface UiPaginationProps extends AntDesignPaginationProps {
	dontUseThisProp?: never;
}

const UiPagination = (props: UiPaginationProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Pagination {...rest} />
		</Fragment>
	);
};

export default UiPagination;
