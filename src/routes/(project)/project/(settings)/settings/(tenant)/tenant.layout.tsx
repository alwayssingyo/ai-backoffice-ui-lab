import {createFileRoute, Outlet} from "@tanstack/react-router";
import "./tenant.css";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(tenant)/tenant")({component: TenantLayout});

function TenantLayout() {
	return <Outlet />;
}
