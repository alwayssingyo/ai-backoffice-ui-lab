import {Fragment} from "react";
import {Form, type GetProps} from "antd";
import clsx from "clsx";
import "./ui-form.css";

export type AntDesignFormItemProps<T> = GetProps<typeof Form.Item<T>>;

interface UiFormItemProps<T> extends AntDesignFormItemProps<T> {
	dontUseThisProp?: never;
}

const UiFormItem = <T,>(props: UiFormItemProps<T>) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Form.Item<T> className={clsx("ui_formItem")} {...rest}>
				{children}
			</Form.Item>
		</Fragment>
	);
};

export default UiFormItem;
