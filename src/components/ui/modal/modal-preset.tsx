import type {ModalFuncProps} from "antd";
type ModalFunction = (props?: ModalFuncProps) => ModalFuncProps;

export const modalPreset = {
	save: (props?: ModalFuncProps) => {
		return {
			title: "저장하시겠습니까?",
			content: "변경된 내용이 저장됩니다.",
			okText: "저장",
			cancelText: "취소",
			okCancel: true,
			centered: true,
			...props,
		};
	},
	remove: (props?: ModalFuncProps) => ({
		title: "삭제하시겠습니까?",
		content: "이 작업은 되돌릴 수 없습니다.",
		okType: "danger",
		okText: "삭제",
		cancelText: "취소",
		okCancel: true,
		centered: true,
		...props,
	}),
} satisfies Record<string, ModalFunction>;
