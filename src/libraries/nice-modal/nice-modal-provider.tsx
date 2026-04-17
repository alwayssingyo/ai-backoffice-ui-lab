import type {ReactNode} from "react";
import NiceModal from "@ebay/nice-modal-react";

interface NiceModalProviderProps {
	children: ReactNode;
}

const NiceModalProvider = ({children}: NiceModalProviderProps) => {
	return <NiceModal.Provider>{children}</NiceModal.Provider>;
};

export default NiceModalProvider;
