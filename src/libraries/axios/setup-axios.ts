/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: IDONTCARE */
import {AxiosHeaders, type AxiosError, type AxiosRequestConfig} from "axios";
import {axiosInstance} from "@/services/.kubb/fetch.ts";
import {authorizationLogout} from "@/services/clients/authorization/authorization-logout.ts";
import {authorizationRefreshToken} from "@/services/clients/authorization/authorization-refresh-token.ts";
import {useTokenStore} from "@/stores/use-token-store.ts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
	throw new Error("VITE_API_BASE_URL is required.");
}

axiosInstance.defaults.baseURL = API_BASE_URL;

let isRefreshing = false;
let failedQueue: {resolve: () => void; reject: (error: unknown) => void}[] = [];

axiosInstance.interceptors.request.use((config) => {
	const accessToken = useTokenStore.getState().accessToken;
	const otpToken = useTokenStore.getState().otpToken;
	const headers = new AxiosHeaders(config.headers);

	if (config.url?.includes("/auth/refresh")) {
		return config;
	}

	if (config.url?.includes("/auth/verify-otp") && otpToken) {
		headers.set("Authorization", `Bearer ${otpToken}`);
		config.headers = headers;
		return config;
	}

	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
		config.headers = headers;
	}

	return config;
});

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const config = error.config as AxiosRequestConfig & {_retry?: boolean};
		const tokenStore = useTokenStore.getState();
		const token = tokenStore.refreshToken;

		if (error.response?.status !== 401) {
			return Promise.reject(error);
		}

		if (!config || config._retry) {
			return Promise.reject(error);
		}

		if (config.url?.includes("/auth/refresh")) {
			return Promise.reject(error);
		}

		if (isRefreshing) {
			return new Promise<void>((resolve, reject) => {
				failedQueue.push({resolve, reject});
			}).then(() => axiosInstance.request(config));
		}

		if (!token) {
			return Promise.reject(error);
		}

		config._retry = true;
		isRefreshing = true;

		try {
			const result = await authorizationRefreshToken({refreshToken: token});
			tokenStore.setTokens(result.data.accessToken, result.data.refreshToken);
			failedQueue.forEach(({resolve}) => resolve());

			return axiosInstance.request(config);
		} catch (refreshError) {
			tokenStore.reset();
			failedQueue.forEach(({reject}) => reject(refreshError));
			authorizationLogout({refreshToken: token}).finally();
			window.location.href = "/login";

			return Promise.reject(refreshError);
		} finally {
			failedQueue = [];
			isRefreshing = false;
		}
	},
);
