import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ensureSuperAdminRouteAccess} from "@/routes/(project)/-local/project-role-guard.ts";
import "./audit-log.css";

export const Route = createFileRoute("/(project)/project/(audit-log)/audit-log")({
	beforeLoad: async ({context}) => {
		await ensureSuperAdminRouteAccess(context.queryClient);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
