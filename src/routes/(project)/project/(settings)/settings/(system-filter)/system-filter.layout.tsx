import {createFileRoute, Outlet} from "@tanstack/react-router";
import "../(filter)/filter.css";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(system-filter)/system-filter")({
	component: SystemFilterLayout,
});

function SystemFilterLayout() {
	return <Outlet />;
}
