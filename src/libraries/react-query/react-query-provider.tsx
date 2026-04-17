import {MutationCache, QueryCache, QueryClient, QueryClientProvider} from "@tanstack/react-query";
import type {ReactNode} from "react";
import {noti} from "@/libraries/ant-design/ant-design-provider";
import type {ResponseErrorConfig} from "@/services/.kubb/fetch.ts";

declare module "@tanstack/react-query" {
	interface Register {
		defaultError: ResponseErrorConfig<Error>;
		queryMeta: {errorToast?: string | null};
		mutationMeta: {errorToast?: string | null; successToast?: string | null};
	}
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (query.meta?.errorToast === null) {
				return;
			}

			noti.error({
				title: query.meta?.errorToast,
				description: error.response?.data?.message ?? error.message,
				placement: "bottomRight",
				showProgress: true,
				pauseOnHover: true,
				duration: 2.5,
			});
		},
	}),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (mutation.meta?.errorToast === null) {
				return;
			}

			noti.error({
				title: mutation.meta?.errorToast,
				description: error.response?.data?.message ?? error.message,
				placement: "bottomRight",
				showProgress: true,
				pauseOnHover: true,
				duration: 2.5,
			});
		},
		onSuccess: (_data, _variables, _context, mutation) => {
			if (mutation.meta?.successToast == null) {
				return;
			}

			noti.success({title: mutation.meta?.successToast, placement: "bottomRight", showProgress: true, pauseOnHover: true, duration: 2.5});
		},
	}),
	defaultOptions: {
		queries: {staleTime: 1000 * 60, gcTime: 1000 * 60 * 5, retry: false, meta: {errorToast: "요청에 실패했습니다"}},
		mutations: {retry: false, meta: {errorToast: "요청에 실패했습니다", successToast: "요청에 성공했습니다"}},
	},
});

interface ReactQueryProviderProps {
	children: ReactNode;
}

const ReactQueryProvider = ({children}: ReactQueryProviderProps) => {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default ReactQueryProvider;
