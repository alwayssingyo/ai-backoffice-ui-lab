import {type GetProps, Result} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-result.css";

export type AntDesignResultProps = GetProps<typeof Result>;

interface UiResultProps extends AntDesignResultProps {
	dontUseThisProp?: never;
}

const UiResult = (props: UiResultProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<div className={clsx("ui_result")}>
				<Result {...rest} />
			</div>
		</Fragment>
	);
};

export default UiResult;
