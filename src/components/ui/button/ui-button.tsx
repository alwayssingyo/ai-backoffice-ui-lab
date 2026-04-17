import {Button, type GetProps} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-button.css";

export type AntDesignButtonProps = GetProps<typeof Button>;

export interface UiButtonProps extends AntDesignButtonProps {
	dontUseThisProp?: never;
}

const UiButton = (props: UiButtonProps) => {
	const {children, ...rest} = props;

	return (
		<Fragment>
			<Button className={clsx("ui_button")} {...rest}>
				{children}
			</Button>
		</Fragment>
	);
};

export default UiButton;
