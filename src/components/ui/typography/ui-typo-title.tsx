import {type GetProps, Typography} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-typo.css";

type AntDesignTypographyTitleProps = GetProps<typeof Typography.Title>;

interface UiTypoTitleProps extends AntDesignTypographyTitleProps {
	dontUseThisProp?: never;
}

const UiTypoTitle = (props: UiTypoTitleProps) => {
	const {children, ...rest} = props;

	return (
		<Fragment>
			<Typography.Title {...rest} className={clsx("ui_typoTtl")}>
				{children}
			</Typography.Title>
		</Fragment>
	);
};

export default UiTypoTitle;
