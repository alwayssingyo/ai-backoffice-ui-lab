import {type GetProps, Typography} from "antd";
import {Fragment} from "react";

type AntDesignTypographyTextProps = GetProps<typeof Typography.Text>;

interface UiTypoTextProps extends AntDesignTypographyTextProps {
	dontUseThisProp?: never;
}

const UiTypoText = (props: UiTypoTextProps) => {
	const {children, ...rest} = props;

	return (
		<Fragment>
			<Typography.Text {...rest}>{children}</Typography.Text>
		</Fragment>
	);
};

export default UiTypoText;
