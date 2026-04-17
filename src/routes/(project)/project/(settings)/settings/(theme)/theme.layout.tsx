import {createFileRoute, Outlet} from "@tanstack/react-router";
import "./theme.css";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(theme)/theme")({component: ThemeLayout});

function ThemeLayout() {
	return <Outlet />;
}
