import {Fragment} from "react";
import {Form, type GetProps} from "antd";

export type AntDesignFormProviderProps = GetProps<typeof Form.Provider>;

export interface UiFormProviderProps extends AntDesignFormProviderProps {
	dontUseThisProp?: never;
}

const UiFormProvider = (props: UiFormProviderProps) => {
	const {dontUseThisProp, children, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Form.Provider {...rest}>{children}</Form.Provider>
		</Fragment>
	);
};

export default UiFormProvider;
