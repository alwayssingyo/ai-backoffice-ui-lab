import {Fragment} from "react";
import {Form, type GetProps} from "antd";

export type AntDesignFormListProps = GetProps<typeof Form.List>;

interface UiFormListProps extends AntDesignFormListProps {
	dontUseThisProp?: never;
}

const UiFormList = (props: UiFormListProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Form.List {...rest} />
		</Fragment>
	);
};

export default UiFormList;
