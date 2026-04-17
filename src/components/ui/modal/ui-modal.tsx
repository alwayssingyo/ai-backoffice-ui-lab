import {useModal} from "@ebay/nice-modal-react";
import {type GetProps, Modal} from "antd";
import {Fragment} from "react";
import clsx from "clsx";
import "./ui-modal.css";
import {util} from "@/entry/util.ts";

export type AntDesignModalProps = GetProps<typeof Modal>;

interface UiModalProps extends Omit<AntDesignModalProps, "className" | "classNames" | "rootClassName" | "wrapClassName"> {
	dontUseThisProp?: never;
}

const UiModal = (props: UiModalProps) => {
	const {children, onOk, onCancel, afterClose, ...rest} = props;
	const modal = useModal();

	return (
		<Fragment>
			<Modal
				className={clsx("ui_modal")}
				open={modal.visible}
				onOk={util.fn.chain(onOk, modal.hide)}
				onCancel={util.fn.chain(onCancel, modal.hide)}
				afterClose={util.fn.chain(afterClose, modal.remove)}
				centered={true}
				mask={{enabled: true, blur: false, closable: false}}
				footer={null}
				{...rest}
			>
				{children}
			</Modal>
		</Fragment>
	);
};

export default UiModal;
