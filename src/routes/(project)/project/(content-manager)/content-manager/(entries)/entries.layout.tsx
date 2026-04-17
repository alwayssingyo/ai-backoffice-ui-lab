import {createFileRoute, Outlet} from "@tanstack/react-router";
import "./entries.css";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/(entries)/entries")({component: EntriesLayout});

function EntriesLayout() {
	return <Outlet />;
}
