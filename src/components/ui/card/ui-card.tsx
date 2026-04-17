import {Fragment} from "react";
import {Card, type GetProps} from "antd";

export type AntDesignCardProps = GetProps<typeof Card>;

interface UiCardProps extends AntDesignCardProps {
	dontUseThisProp?: never;
}

const UiCard = (props: UiCardProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Card {...rest}>{children}</Card>
		</Fragment>
	);
};

export default UiCard;
