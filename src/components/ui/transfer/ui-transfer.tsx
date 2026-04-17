import {Fragment} from "react";
import {type GetProps, Transfer} from "antd";
import "./ui-transfer.css";

export type AntDesignTransferProps = GetProps<typeof Transfer>;

interface UiTransferProps extends AntDesignTransferProps {
	dontUseThisProp?: never;
}

const UiTransfer = (props: UiTransferProps) => {
	const {dontUseThisProp, ...rest} = props;

	return (
		<Fragment>
			{dontUseThisProp}
			<Transfer className="ui_transfer" {...rest} />
		</Fragment>
	);
};

export default UiTransfer;
