import {createFileRoute, Outlet} from "@tanstack/react-router";
import "./filter.css";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(filter)/filter")({component: FilterLayout});

function FilterLayout() {
	return <Outlet />;
}
