import {Link, type LinkComponentProps} from "@tanstack/react-router";
import {Fragment} from "react";

interface UiLinkProps extends LinkComponentProps {
	dontUseThisProp?: never;
}

const UiLink = (props: UiLinkProps) => {
	const {children, ...rest} = props;

	return (
		<Fragment>
			<Link {...rest}>{children}</Link>
		</Fragment>
	);
};

export default UiLink;
