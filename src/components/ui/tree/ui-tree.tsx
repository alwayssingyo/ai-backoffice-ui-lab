import {Fragment} from "react";
import {type GetProps, Tree} from "antd";

export type UiTreeProps = GetProps<typeof Tree>;

interface UiTreeComponentProps extends UiTreeProps {
	dontUseThisProp?: never;
}

const UiTree = (props: UiTreeComponentProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Tree {...rest} />
		</Fragment>
	);
};

export default UiTree;
