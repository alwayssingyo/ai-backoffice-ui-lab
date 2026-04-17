import {Fragment} from "react";
import {Form, type GetProps} from "antd";

export type AntDesignFormProps<T> = GetProps<typeof Form<T>>;

export interface UiFormProps<T> extends AntDesignFormProps<T> {
	dontUseThisProp?: never;
}

const UiForm = <T,>(props: UiFormProps<T>) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Form<T> {...rest}>{children}</Form>
		</Fragment>
	);
};

export default UiForm;
