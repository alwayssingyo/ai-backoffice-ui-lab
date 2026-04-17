import {TanStackDevtools} from "@tanstack/react-devtools";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import type {AnyRouter} from "@tanstack/react-router";

interface TanstackDevtoolsProps {
	router: AnyRouter;
}

const TanstackDevtools = ({router}: TanstackDevtoolsProps) => {
	return (
		<TanStackDevtools
			config={{position: "bottom-right"}}
			plugins={[
				{name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel router={router} />},
				{name: "Tanstack Query", render: <ReactQueryDevtoolsPanel />},
			]}
		/>
	);
};

export default TanstackDevtools;
