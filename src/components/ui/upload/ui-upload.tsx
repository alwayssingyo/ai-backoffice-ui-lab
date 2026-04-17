import {Upload, type GetProps} from "antd";
import {Fragment} from "react";
export type AntDesignUploadProps = GetProps<typeof Upload>;

export interface UiUploadProps extends AntDesignUploadProps {
	dontUseThisProp?: never;
}

const UiUpload = (props: UiUploadProps) => {
	const {children, ...rest} = props;

	return (
		<Fragment>
			<Upload {...rest}>{children}</Upload>
		</Fragment>
	);
};

export default UiUpload;
