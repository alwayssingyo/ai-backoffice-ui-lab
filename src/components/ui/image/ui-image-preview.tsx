import {Fragment} from "react";
import {type GetProps, Image} from "antd";

export type AntDesignImageProps = GetProps<typeof Image>;

interface UiImagePreviewProps extends AntDesignImageProps {
	dontUseThisProp?: never;
}

const UiImagePreview = (props: UiImagePreviewProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Image {...rest} />
		</Fragment>
	);
};

export default UiImagePreview;
