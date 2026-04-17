import type {ReactNode} from "react";
import {GoogleOAuthProvider as BaseGoogleOAuthProvider} from "@react-oauth/google";

interface GoogleOAuthProviderProps {
	children: ReactNode;
}

const GoogleOAuthProvider = ({children}: GoogleOAuthProviderProps) => {
	return <BaseGoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>{children}</BaseGoogleOAuthProvider>;
};

export default GoogleOAuthProvider;
