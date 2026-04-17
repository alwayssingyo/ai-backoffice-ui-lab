import {Fragment} from "react";
import {type GetProps, Avatar} from "antd";

export type AntDesignAvatarProps = GetProps<typeof Avatar>;

interface UiAvatarProps extends AntDesignAvatarProps {
	dontUseThisProp?: never;
}

const UiAvatar = (props: UiAvatarProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Avatar {...rest} />
		</Fragment>
	);
};

export default UiAvatar;
