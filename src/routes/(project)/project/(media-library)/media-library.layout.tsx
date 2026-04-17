import {createFileRoute, Outlet} from "@tanstack/react-router";
import "./media-library.css";

export const Route = createFileRoute("/(project)/project/(media-library)/media-library")({component: RouteComponent});

function RouteComponent() {
	return <Outlet />;
}
