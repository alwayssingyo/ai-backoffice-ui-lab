import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ensureSuperAdminRouteAccess} from "@/routes/(project)/-local/project-role-guard.ts";
import "./board.css";

export const Route = createFileRoute("/(project)/project/(board)/board")({
	beforeLoad: async ({context}) => {
		await ensureSuperAdminRouteAccess(context.queryClient);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
