import {Fragment, type ReactNode, useEffect} from "react";
import {App, ConfigProvider, theme} from "antd";
import type {NotificationInstance} from "antd/es/notification/interface";
import type {MessageInstance} from "antd/es/message/interface";
import type {HookAPI} from "antd/es/modal/useModal";
import type {ThemeConfig} from "antd/es/config-provider/context";
import {useThemeStore, type ThemeMode} from "@/stores/use-theme-store";
import {useTranslation} from "react-i18next";
import {getPrimaryThemeToken} from "./ant-design-theme.ts";

export let noti: NotificationInstance;
export let message: MessageInstance;
export let modal: HookAPI;

interface AntDesignProviderProps {
	dontUseThisProp?: never;
	children: ReactNode;
}

const getThemeConfig = (mode: ThemeMode, primaryColor: string): ThemeConfig => {
	const baseConfig: ThemeConfig = {
		cssVar: {key: "variable", prefix: "cms"},
		token: {
			...getPrimaryThemeToken(mode, primaryColor),
			colorBorder: "#e5e5e5",
			borderRadius: 10,
			fontFamily:
				"'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
		},
	};

	if (mode === "dark") {
		return {
			...baseConfig,
			algorithm: theme.darkAlgorithm,
			token: {
				...baseConfig.token,
				colorBorder: "#4a4a4a",
				colorBgBase: "#1a1a1a",
				colorBgContainer: "#242424",
				colorBgElevated: "#2a2a2a",
				colorBgLayout: "#141414",
			} as ThemeConfig["token"],
		};
	}

	return {...baseConfig, algorithm: theme.defaultAlgorithm};
};

const ContextHolder = ({children}: {children: ReactNode}) => {
	const app = App.useApp();

	useEffect(() => {
		noti = app.notification;
		message = app.message;
		modal = app.modal;
	}, [app]);

	return <Fragment>{children}</Fragment>;
};

const AntDesignProvider = (props: AntDesignProviderProps) => {
	const {dontUseThisProp, children} = props;
	const themeStore = useThemeStore();
	const {t} = useTranslation("common");

	return (
		<Fragment>
			{dontUseThisProp}
			<ConfigProvider
				form={{
					validateMessages: {
						required: t(($) => $.ui_form__required),
						string: {min: t(($) => $.ui_form__stringMin), max: t(($) => $.ui_form__stringMax)},
						number: {min: t(($) => $.ui_form__numberMin), max: t(($) => $.ui_form__numberMax)},
						pattern: {mismatch: t(($) => $.ui_form__patternMismatch)},
					},
				}}
				theme={getThemeConfig(themeStore.mode, themeStore.primaryColor)}
			>
				<App>
					<ContextHolder>{children}</ContextHolder>
				</App>
			</ConfigProvider>
		</Fragment>
	);
};

export default AntDesignProvider;
