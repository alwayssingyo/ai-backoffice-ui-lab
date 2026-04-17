import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ensureSuperAdminRouteAccess} from "@/routes/(project)/-local/project-role-guard.ts";
import "./folders.css";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/(folders)/folders")({
	beforeLoad: async ({context}) => {
		await ensureSuperAdminRouteAccess(context.queryClient);
	},
	component: FoldersLayout,
});

function FoldersLayout() {
	return <Outlet />;
}
