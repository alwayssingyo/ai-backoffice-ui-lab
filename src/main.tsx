import {createRouter, RouterProvider} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals.ts";
import {routeTree} from "./routeTree.gen";
import "./styles/style.css";
import UiResult from "@/components/ui/result/ui-result.tsx";
import UiSpin from "@/components/ui/spin/ui-spin.tsx";
import AntDesignProvider from "@/libraries/ant-design/ant-design-provider.tsx";
import GoogleOAuthProvider from "@/libraries/google-oauth/google-oauth-provider.tsx";
import ReactQueryProvider, {queryClient} from "@/libraries/react-query/react-query-provider.tsx";
import NiceModalProvider from "@/libraries/nice-modal/nice-modal-provider.tsx";
import TanstackDevtools from "@/libraries/tanstack-devtools/tanstack-devtools.tsx";
import "@/libraries/axios/setup-axios.ts";
import "@/libraries/dayjs/setup-dayjs.ts";
import "@/libraries/i18n/setup-i18n.ts";
import {StrictMode} from "react";

const router = createRouter({
	routeTree,
	context: {queryClient},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	defaultErrorComponent: () => {
		return <UiResult status={"error"} title={"Sorry, something went wrong."} />;
	},
	defaultNotFoundComponent: () => {
		return <UiResult status={"404"} title={"404"} subTitle={"Not Found"} />;
	},
	defaultPendingComponent: () => {
		return <UiSpin fullscreen={true} />;
	},
	Wrap: ({children}) => {
		return (
			<GoogleOAuthProvider>
				<ReactQueryProvider>
					<AntDesignProvider>
						<NiceModalProvider>
							{children}
							<TanstackDevtools router={router} />
						</NiceModalProvider>
					</AntDesignProvider>
				</ReactQueryProvider>
			</GoogleOAuthProvider>
		);
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
}

reportWebVitals();
