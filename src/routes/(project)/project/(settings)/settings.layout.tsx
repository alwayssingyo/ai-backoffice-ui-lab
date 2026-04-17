import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ensureSuperAdminRouteAccess} from "@/routes/(project)/-local/project-role-guard.ts";

export const Route = createFileRoute("/(project)/project/(settings)/settings")({
	beforeLoad: async ({context}) => {
		await ensureSuperAdminRouteAccess(context.queryClient);
	},
	component: ProjectPidSetting,
});

function ProjectPidSetting() {
	return <Outlet />;
}
