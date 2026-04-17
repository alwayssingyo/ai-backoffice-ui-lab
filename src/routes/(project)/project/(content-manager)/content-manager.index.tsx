import {createFileRoute, redirect} from "@tanstack/react-router";
import {z} from "zod";

export const Route = createFileRoute("/(project)/project/(content-manager)/content-manager/")({
	component: () => null,
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(1).catch(1),
		size: z.coerce.number().int().min(1).max(100).default(10).catch(10),
		table: z.string().optional(),
	}),
	beforeLoad: ({search}) => {
		throw redirect({to: "/project/content-manager/entries", search, replace: true});
	},
});
