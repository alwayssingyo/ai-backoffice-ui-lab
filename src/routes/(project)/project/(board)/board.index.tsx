import {createFileRoute, redirect} from "@tanstack/react-router";

export const Route = createFileRoute("/(project)/project/(board)/board/")({
	beforeLoad: () => {
		throw redirect({to: "/project/board/notice", replace: true});
	},
	component: RouteComponent,
});

function RouteComponent() {
	return null;
}
