import {Fragment} from "react";
import {type GetProps, Upload} from "antd";

export type AntDesignDraggerProps = GetProps<typeof Upload.Dragger>;

export interface UiUploadDraggerProps extends AntDesignDraggerProps {
	dontUseThisProp?: never;
}

const UiUploadDragger = (props: UiUploadDraggerProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Upload.Dragger {...rest}>{children}</Upload.Dragger>
		</Fragment>
	);
};

export default UiUploadDragger;
