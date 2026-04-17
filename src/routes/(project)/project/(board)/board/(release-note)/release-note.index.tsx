import {createFileRoute} from "@tanstack/react-router";
import {z} from "zod";
import {BoardManagementScreen} from "../../-local/board-management-screen.tsx";
import {BOARD_DEFAULT_PAGE, BOARD_DEFAULT_PAGE_SIZE, BOARD_ROUTE_CONFIG_MAP, normalizeBoardListSearch} from "../../board.ts";

export const Route = createFileRoute("/(project)/project/(board)/board/(release-note)/release-note/")({
	component: RouteComponent,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(BOARD_DEFAULT_PAGE).catch(BOARD_DEFAULT_PAGE),
		size: z.coerce.number().int().min(1).max(100).default(BOARD_DEFAULT_PAGE_SIZE).catch(BOARD_DEFAULT_PAGE_SIZE),
	}),
});

function RouteComponent() {
	const {useSearch} = Route;
	const search = normalizeBoardListSearch(useSearch());

	return <BoardManagementScreen routeConfig={BOARD_ROUTE_CONFIG_MAP.releaseNote} search={search} />;
}
