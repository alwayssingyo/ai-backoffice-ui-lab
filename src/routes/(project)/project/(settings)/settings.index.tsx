import {createFileRoute, redirect} from "@tanstack/react-router";

export const Route = createFileRoute("/(project)/project/(settings)/settings/")({
	beforeLoad: () => {
		throw redirect({to: "/project/settings/theme", replace: true});
	},
	component: RouteComponent,
});

function RouteComponent() {
	return null;
}
