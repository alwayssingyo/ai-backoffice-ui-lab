import {create} from "zustand";
import {combine, createJSONStorage, persist, subscribeWithSelector} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";

export const useTokenStore = create(
	persist(
		subscribeWithSelector(
			immer(
				combine({otpToken: null as string | null, accessToken: null as string | null, refreshToken: null as string | null}, (set) => ({
					setOtpToken: (value: string | null) => {
						set((state) => {
							state.otpToken = value;
						});
					},
					setAccessToken: (value: string) => {
						set((state) => {
							state.accessToken = value;
						});
					},
					setRefreshToken: (value: string) => {
						set((state) => {
							state.refreshToken = value;
						});
					},
					setTokens: (accessToken: string, refreshToken: string) => {
						set((state) => {
							state.accessToken = accessToken;
							state.refreshToken = refreshToken;
						});
					},
					reset: () => {
						set((state) => {
							state.otpToken = null;
							state.accessToken = null;
							state.refreshToken = null;
						});
					},
				})),
			),
		),
		{name: "t_s", storage: createJSONStorage(() => sessionStorage)},
	),
);
