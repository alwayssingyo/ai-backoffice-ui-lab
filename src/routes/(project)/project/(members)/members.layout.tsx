import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ensureSuperAdminRouteAccess} from "@/routes/(project)/-local/project-role-guard.ts";
import "./members.css";

export const Route = createFileRoute("/(project)/project/(members)/members")({
	beforeLoad: async ({context}) => {
		await ensureSuperAdminRouteAccess(context.queryClient);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
