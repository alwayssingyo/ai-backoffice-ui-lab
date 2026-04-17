import {createFileRoute, Outlet} from "@tanstack/react-router";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager")({component: ContentManagerLayout});

function ContentManagerLayout() {
	return <Outlet />;
}
