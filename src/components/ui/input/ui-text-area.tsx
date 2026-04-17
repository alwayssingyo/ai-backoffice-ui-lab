import {Fragment} from "react";
import {type GetProps, Input} from "antd";
import type TextArea from "antd/es/input/TextArea";

export type AntDesignTextAreaProps = GetProps<typeof TextArea>;

interface UiTextareaProps extends AntDesignTextAreaProps {
	dontUseThisProp?: never;
}

const UiTextArea = (props: UiTextareaProps) => {
	const {dontUseThisProp, ...rest} = props;
	const {TextArea} = Input;

	return (
		<Fragment>
			{dontUseThisProp}
			<TextArea {...rest} />
		</Fragment>
	);
};

export default UiTextArea;
