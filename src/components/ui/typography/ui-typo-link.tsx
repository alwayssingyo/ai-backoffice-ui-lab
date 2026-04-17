import {Fragment} from "react";
import {type GetProps, Typography} from "antd";

export type AntDesignTypographyLinkProps = GetProps<typeof Typography.Link>;

interface UiTypoLinkProps extends AntDesignTypographyLinkProps {
	dontUseThisProp?: never;
}

const UiTypoLink = (props: UiTypoLinkProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Typography.Link {...rest}>{children}</Typography.Link>
		</Fragment>
	);
};

export default UiTypoLink;
