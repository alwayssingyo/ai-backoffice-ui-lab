import {useIsMutating, type QueryClient} from "@tanstack/react-query";
import {createRootRouteWithContext, HeadContent, Outlet, useRouterState} from "@tanstack/react-router";
import {Fragment, useContext, useEffect} from "react";
import UiSpin from "@/components/ui/spin/ui-spin.tsx";
import NiceModal, {NiceModalContext} from "@ebay/nice-modal-react";

interface RouteContext {
	queryClient: QueryClient;
}

function resolveRuntimeLabel(runtimeLabel: string) {
	if (runtimeLabel === "PROD") {
		return "PROD";
	}

	if (runtimeLabel === "LOCAL") {
		return "LOCAL";
	}

	return "DEV";
}

const RUNTIME_LABEL = resolveRuntimeLabel(import.meta.env.VITE_RUNTIME_LABEL);

export const Route = createRootRouteWithContext<RouteContext>()({
	head: () => ({
		meta: [
			{charSet: "UTF-8"},
			{title: `CMS::${RUNTIME_LABEL}`},
			{name: "viewport", content: "width=device-width, initial-scale=1.0"},
			{name: "theme-color", content: "#000000"},
			{name: "description", content: `CMS::${RUNTIME_LABEL}::0`},
		],
		links: [
			{rel: "icon", href: "/favicon.ico"},
			{rel: "apple-touch-icon", href: "/logo192.png"},
			{rel: "manifest", href: "/manifest.json"},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	const routerState = useRouterState();
	const modalStore = useContext(NiceModalContext);

	/**
	 * @summary navigation 발생 시 모든 모달 닫기
	 */
	useEffect(() => {
		Object.keys(modalStore).forEach((modalId) => {
			const modalState = modalStore[modalId];

			if (modalState?.visible) {
				void NiceModal.hide(modalId);
			}
		});
	}, [routerState.location]);

	return (
		<Fragment>
			<HeadContent />
			<Outlet />
			<MutationSpin />
		</Fragment>
	);
}

function MutationSpin() {
	const mutationCount = useIsMutating();
	const isMutating = mutationCount > 0;
	const SPIN_DELAY_MS = 250;

	return <UiSpin fullscreen={true} spinning={isMutating} delay={SPIN_DELAY_MS} />;
}
