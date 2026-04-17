import {type GetProps, Menu} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-menu.css";
export type AntDesignMenuProps = GetProps<typeof Menu>;

export interface UiMenuProps extends AntDesignMenuProps {
	dontUseThisProp?: never;
}

const UiMenu = (props: UiMenuProps) => {
	const {dontUseThisProp, className, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Menu className={clsx("ui_menu", className)} {...rest} />
		</Fragment>
	);
};

export default UiMenu;
