import {createFileRoute} from "@tanstack/react-router";
import {z} from "zod";
import {AUDIT_LOG_DEFAULT_PAGE, AUDIT_LOG_DEFAULT_PAGE_SIZE, normalizeAuditLogListSearch} from "./audit-log.ts";
import AuditLogScreen from "./-local/audit-log-screen.tsx";

export const Route = createFileRoute("/(project)/project/(audit-log)/audit-log/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(AUDIT_LOG_DEFAULT_PAGE).catch(AUDIT_LOG_DEFAULT_PAGE),
		size: z.coerce.number().int().min(1).max(100).default(AUDIT_LOG_DEFAULT_PAGE_SIZE).catch(AUDIT_LOG_DEFAULT_PAGE_SIZE),
	}),
});

export function RouteComponent() {
	const {useSearch} = Route;
	const search = normalizeAuditLogListSearch(useSearch());
	return <AuditLogScreen search={search} />;
}
