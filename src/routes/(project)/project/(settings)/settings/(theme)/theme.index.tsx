import {createFileRoute} from "@tanstack/react-router";
import {Fragment, type CSSProperties} from "react";
import {useQueryClient} from "@tanstack/react-query";
import clsx from "clsx";
import UiButton from "@/components/ui/button/ui-button.tsx";
import UiCard from "@/components/ui/card/ui-card.tsx";
import UiColorpicker, {type UiColorpickerProps} from "@/components/ui/colorpicker/ui-colorpicker.tsx";
import UiSegmented, {type UiSegmentedProps} from "@/components/ui/segmented/ui-segmented.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import {
	DEFAULT_THEME_MODE,
	DEFAULT_THEME_PRIMARY_COLOR,
	THEME_MODE_CONFIG_KEY,
	THEME_PRIMARY_COLOR_CONFIG_KEY,
	type ThemeMode,
	useThemeStore,
} from "@/stores/use-theme-store.ts";
import {useConfigValueUpsert} from "@/services/hooks/config-value/use-config-value-upsert.ts";
import {configValueGetItemQueryKey} from "@/services/hooks/config-value/use-config-value-get-item.ts";
import type {ConfigValueGetItemQueryResponse} from "@/services/types/config-value/config-value-get-item.ts";
import {THEME_PRIMARY_PRESET_ITEMS} from "./theme.ts";

export const Route = createFileRoute("/(project)/project/(settings)/settings/(theme)/theme/")({component: RouteComponent});

/**
 * @summary 프로젝트 테마 설정 화면
 */
function RouteComponent() {
	const queryClient = useQueryClient();
	const themeStore = useThemeStore();

	/**
	 * @description 설정 생성/수정 API
	 */
	const mutationThemeConfigValueUpsert = useConfigValueUpsert({
		mutation: {
			meta: {successToast: null, errorToast: "테마 설정 저장에 실패했습니다"},
			onSuccess: (data) => {
				queryClient.setQueryData<ConfigValueGetItemQueryResponse>(configValueGetItemQueryKey({config: data.config}), {
					result: "SUCCESS",
					data,
				});
			},
		},
	});

	/**
	 * @summary 테마 모드 변경
	 */
	const handleThemeModeChange: UiSegmentedProps["onChange"] = (value) => {
		const nextMode = value as ThemeMode;

		themeStore.setTheme(nextMode);
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_MODE_CONFIG_KEY, value: nextMode}});
	};
	/**
	 * @summary 기본 강조색 변경
	 */
	const handlePrimaryColorChangeComplete: UiColorpickerProps["onChangeComplete"] = (value) => {
		const nextPrimaryColor = value.toHexString().toLowerCase();

		themeStore.setPrimaryColor(nextPrimaryColor);
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_PRIMARY_COLOR_CONFIG_KEY, value: nextPrimaryColor}});
	};
	/**
	 * @summary 추천 강조색 즉시 적용
	 */
	const handlePresetButtonClick = (primaryColor: string) => {
		const nextPrimaryColor = primaryColor.toLowerCase();

		themeStore.setPrimaryColor(nextPrimaryColor);
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_PRIMARY_COLOR_CONFIG_KEY, value: nextPrimaryColor}});
	};
	/**
	 * @summary 기본 테마 설정 복구
	 */
	const handleResetButtonClick = () => {
		themeStore.resetTheme();
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_MODE_CONFIG_KEY, value: DEFAULT_THEME_MODE}});
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_PRIMARY_COLOR_CONFIG_KEY, value: DEFAULT_THEME_PRIMARY_COLOR}});
	};

	return (
		<Fragment>
			<WidgetContentHeader title={"Theme"} desc="Customize workspace appearance and primary brand color." />
			<WidgetContentBody>
				<div className={clsx("rt_pthi__board")}>
					<div className={clsx("rt_pthi__panel")}>
						<UiCard>
							<div className={clsx("rt_pthi__panelHeader")}>
								<div>
									<UiTypoTitle level={4}>Appearance</UiTypoTitle>
								</div>
								<div>
									<UiTypoText type={"secondary"}>Update the workspace theme tokens and sync them through the config-value API.</UiTypoText>
								</div>
							</div>

							<div className={clsx("rt_pthi__fieldList")}>
								<div className={clsx("rt_pthi__field")}>
									<div className={clsx("rt_pthi__fieldMeta")}>
										<div>
											<UiTypoTitle level={5}>Theme mode</UiTypoTitle>
										</div>
										<div>
											<UiTypoText type={"secondary"}>
												Choose the base surface mood used across navigation, content panels, and overlays.
											</UiTypoText>
										</div>
									</div>
									<div>
										<UiSegmented
											block
											value={themeStore.mode}
											options={[
												{label: "Light", value: "light"},
												{label: "Dark", value: "dark"},
											]}
											onChange={handleThemeModeChange}
										/>
									</div>
								</div>

								<div className={clsx("rt_pthi__field")}>
									<div className={clsx("rt_pthi__fieldMeta")}>
										<div>
											<UiTypoTitle level={5}>Primary color</UiTypoTitle>
										</div>
										<div>
											<UiTypoText type={"secondary"}>
												Pick the accent that Ant Design buttons, selected states, and emphasis tokens should follow.
											</UiTypoText>
										</div>
									</div>

									<div className={clsx("rt_pthi__pickerRow")}>
										<div className={clsx("rt_pthi__picker")}>
											<UiColorpicker
												value={themeStore.primaryColor}
												format={"hex"}
												showText
												disabledAlpha
												onChangeComplete={handlePrimaryColorChangeComplete}
											/>
										</div>
										<div className={clsx("rt_pthi__pickerMeta")}>
											<span className={clsx("rt_pthi__token")}>{themeStore.primaryColor.toUpperCase()}</span>
											<UiTypoText type={"secondary"}>Applied instantly and synced as the primary-color config value.</UiTypoText>
										</div>
									</div>

									<div className={clsx("rt_pthi__presetGrid")}>
										{THEME_PRIMARY_PRESET_ITEMS.map((presetItem) => {
											return (
												<button
													key={presetItem.color}
													type={"button"}
													className={clsx(
														"rt_pthi__presetButton",
														themeStore.primaryColor === presetItem.color && "rt_pthi__presetButton--active",
													)}
													style={{"--rt-pthi-preset-color": presetItem.color} as CSSProperties}
													onClick={() => handlePresetButtonClick(presetItem.color)}
												>
													<span className={clsx("rt_pthi__presetLabel")}>{presetItem.label}</span>
													<span className={clsx("rt_pthi__presetDesc")}>{presetItem.description}</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>

							<div className={clsx("rt_pthi__actions")}>
								<div>
									<UiButton type={"primary"} onClick={handleResetButtonClick}>
										Reset to default
									</UiButton>
								</div>
								<div>
									<UiTypoText type={"secondary"}>
										{mutationThemeConfigValueUpsert.isPending
											? "Syncing theme changes to the workspace settings API."
											: `Current state: ${themeStore.mode} mode, ${themeStore.primaryColor.toUpperCase()}. Changes sync automatically to the workspace settings API.`}
									</UiTypoText>
								</div>
							</div>
						</UiCard>
					</div>
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
