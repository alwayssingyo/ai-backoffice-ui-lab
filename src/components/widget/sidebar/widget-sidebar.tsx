import {useState} from "react";
import {useNavigate} from "@tanstack/react-router";
import clsx from "clsx";
import UiMenu, {type UiMenuProps} from "@/components/ui/menu/ui-menu.tsx";
import "./widget-sidebar.css";
import {ChevronRightSmall, LogOut, Sidebar, HalloweenGhost, Moon, Sun, Translate} from "griddy-icons";
import UiTooltip from "@/components/ui/tooltip/ui-tooltip";
import type {MouseEventHandler} from "react";
import UiAvatar from "@/components/ui/avatar/ui-avatar";
import UiPopover from "@/components/ui/popover/ui-popover";
import UiTag from "@/components/ui/tag/ui-tag";
import {asset} from "@/entry/asset.ts";
import {useAuthorizationLogout} from "@/services/hooks/authorization/use-authorization-logout.ts";
import {useTokenStore} from "@/stores/use-token-store.ts";
import {useRoleStore} from "@/stores/use-role-store.ts";
import UiButton from "@/components/ui/button/ui-button";
import {useTranslation} from "react-i18next";
import {iconPreset} from "@/assets/icons/icon-preset.ts";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title";
import {useAuthorizationInfoSuspense} from "@/services/hooks/authorization/use-authorization-info-suspense.ts";
import {useQueryClient} from "@tanstack/react-query";
import {configValueGetItemQueryKey} from "@/services/hooks/config-value/use-config-value-get-item.ts";
import {useConfigValueUpsert} from "@/services/hooks/config-value/use-config-value-upsert.ts";
import type {ConfigValueGetItemQueryResponse} from "@/services/types/config-value/config-value-get-item.ts";
import {THEME_MODE_CONFIG_KEY, useThemeStore, type ThemeMode} from "@/stores/use-theme-store.ts";

interface WidgetSidebarProps {
	menuOptions: UiMenuProps;
}

const WidgetSidebar = (props: WidgetSidebarProps) => {
	const {menuOptions} = props;
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tokenStore = useTokenStore();
	const roleStore = useRoleStore();
	const themeStore = useThemeStore();
	const {t, i18n} = useTranslation("common");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [themePopoverOpen, setThemePopoverOpen] = useState(false);
	const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? "ko").toLowerCase();
	const isKorean = currentLanguage.startsWith("ko");

	/**
	 * @description 로그인 정보 조회 API
	 */
	const responseAuthorizationInfoSuspense = useAuthorizationInfoSuspense({
		query: {
			select: ({data}) => {
				return {profile: data};
			},
		},
	});
	/**
	 * @description 로그아웃 API
	 */
	const mutationAuthorizationLogout = useAuthorizationLogout({
		mutation: {
			onSuccess: (_data, _variables, _onMutateResult, _context) => {
				tokenStore.reset();
				roleStore.reset();
				navigate({to: "/login"}).then(() => {
					queryClient.clear();
				});
			},
		},
	});
	const mutationThemeConfigValueUpsert = useConfigValueUpsert({
		mutation: {
			meta: {successToast: null, errorToast: "테마 저장에 실패했습니다"},
			onSuccess: (data) => {
				queryClient.setQueryData<ConfigValueGetItemQueryResponse>(configValueGetItemQueryKey({config: data.config}), {
					result: "SUCCESS",
					data,
				});
			},
		},
	});

	/**
	 * @summary 홈으로 이동
	 */
	const handleLogoButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		void navigate({to: "/project"});
	};
	/**
	 * @summary 로그아웃하고 로그인화면으로 ?
	 */
	const handleLogoutButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
		setProfileOpen(false);
		mutationAuthorizationLogout.mutate({params: {refreshToken: tokenStore.refreshToken!}});
	};
	/**
	 * @summary 테마 선택
	 */
	const handleThemeSelect = (mode: ThemeMode) => () => {
		themeStore.setTheme(mode);
		mutationThemeConfigValueUpsert.mutate({data: {config: THEME_MODE_CONFIG_KEY, value: mode}});
		setThemePopoverOpen(false);
	};

	/**
	 * @summary 언어 선택
	 */
	const handleLanguageSelect = (language: "ko" | "en") => () => {
		void i18n.changeLanguage(language);
		setLanguagePopoverOpen(false);
	};

	return (
		<div className={clsx("wg_sidebar", isCollapsed && "wg_sidebar--collapsed")}>
			<div className={clsx("wg_sidebar__title")}>
				<button type={"button"} onClick={handleLogoButtonClick} className={clsx("wg_sidebar__logo")}>
					<img src={asset.images.logoIntroPng} alt={t(($) => $.wg_sidebar__logoAlt)} />
				</button>
				<button type={"button"} className={clsx("wg_sidebar__name")}>
					<UiTypoTitle level={1}>CMS</UiTypoTitle>
				</button>
			</div>
			<div className={clsx("wg_sidebar__menu")}>
				<div className={clsx("wg_sidebar__nav")}>
					<UiMenu mode={"inline"} inlineCollapsed={isCollapsed} rootClassName="wg_sidebar__menuComp" {...menuOptions} />
					<div className={clsx("wg_sidebar__controls")}>
						<div className={clsx("wg_sidebar__collapse")}>
							<UiTooltip placement="right" title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
								<UiButton
									type="text"
									icon={<Sidebar {...iconPreset.outlined()} size={18} />}
									onClick={() => setIsCollapsed((prev) => !prev)}
									aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
								/>
							</UiTooltip>
						</div>
					</div>
				</div>
				{/* 유저 프로필 영역 */}
				<div className={clsx("wg_sidebar__profile")}>
					<UiPopover
						placement="topLeft"
						arrow={false}
						trigger="click"
						open={profileOpen}
						onOpenChange={setProfileOpen}
						content={
							// todo: 데이터 맵핑 어떻게 할 것인지
							<div className={clsx("wg_sidebar__profileCont")}>
								<div className={clsx("wg_sidebar__profileInfo")}>
									<div className={clsx("wg_sidebar__profileTitle")}>{responseAuthorizationInfoSuspense.data.profile.name}</div>
									<div className={clsx("wg_sidebar__profileEmail")}>{responseAuthorizationInfoSuspense.data.profile.loginId}</div>
									<div className={clsx("wg_sidebar__profileRole")}>
										<UiTag>{responseAuthorizationInfoSuspense.data.profile.permissionGroup.name}</UiTag>
									</div>
								</div>
								<div className={clsx("wg_sidebar__profileMenu")}>
									<UiPopover
										placement="rightTop"
										trigger="hover"
										open={themePopoverOpen}
										onOpenChange={setThemePopoverOpen}
										content={
											<div className={clsx("wg_sidebar__popoverList")}>
												<button type="button" className={clsx("wg_sidebar__popoverItem")} onClick={handleThemeSelect("light")}>
													<Sun {...iconPreset.outlined()} />
													<span>{t(($) => $.wg_sidebar__themeLight)}</span>
												</button>
												<button type="button" className={clsx("wg_sidebar__popoverItem")} onClick={handleThemeSelect("dark")}>
													<Moon {...iconPreset.outlined()} />
													<span>{t(($) => $.wg_sidebar__themeDark)}</span>
												</button>
											</div>
										}
										rootClassName="wg_sidebar__popoverSub"
									>
										<button type="button" className={clsx("wg_sidebar__profileMenuItem")}>
											<span className={clsx("wg_sidebar__profileMenuIcon")}>
												{themeStore.mode === "light" ? <Sun {...iconPreset.outlined()} /> : <Moon {...iconPreset.outlined()} />}
											</span>
											<span className={clsx("wg_sidebar__profileMenuText")}>
												{t(($) => (themeStore.mode === "light" ? $.wg_sidebar__themeLight : $.wg_sidebar__themeDark))}
											</span>
											<span className={clsx("wg_sidebar__profileMenuChevron")}>
												<ChevronRightSmall {...iconPreset.outlined()} />
											</span>
										</button>
									</UiPopover>
									<UiPopover
										placement="rightTop"
										trigger="hover"
										open={languagePopoverOpen}
										onOpenChange={setLanguagePopoverOpen}
										content={
											<div className={clsx("wg_sidebar__popoverList")}>
												<button type="button" className={clsx("wg_sidebar__popoverItem")} onClick={handleLanguageSelect("en")}>
													<span>English</span>
												</button>
												<button type="button" className={clsx("wg_sidebar__popoverItem")} onClick={handleLanguageSelect("ko")}>
													<span>한국어</span>
												</button>
											</div>
										}
										rootClassName="wg_sidebar__popoverSub"
									>
										<button type="button" className={clsx("wg_sidebar__profileMenuItem")}>
											<span className={clsx("wg_sidebar__profileMenuIcon")}>
												<Translate {...iconPreset.outlined()} size={17} />
											</span>
											<span className={clsx("wg_sidebar__profileMenuText")}>
												{isKorean ? t(($) => $.wg_sidebar__languageKo) : t(($) => $.wg_sidebar__languageEn)}
											</span>
											<span className={clsx("wg_sidebar__profileMenuChevron")}>
												<ChevronRightSmall {...iconPreset.outlined()} />
											</span>
										</button>
									</UiPopover>
									{/* todo: 추후에 살리든지 말든지 */}
									{/*<button*/}
									{/*	type="button"*/}
									{/*	className={clsx("wg_sidebar__profileMenuItem")}*/}
									{/*	onClick={handleProfileButtonClick}*/}
									{/*>*/}
									{/*	<span className={clsx("wg_sidebar__profileMenuIcon")}>*/}
									{/*		<UserSettings {...iconPreset.outlined()} />*/}
									{/*	</span>*/}
									{/*	{t(($) => $.wg_sidebar__menuProfileSettings)}*/}
									{/*</button>*/}
									<button
										type="button"
										className={clsx("wg_sidebar__profileMenuItem", "wg_sidebar__profileMenuItem--danger")}
										onClick={handleLogoutButtonClick}
									>
										<span className={clsx("wg_sidebar__profileMenuIcon")}>
											<LogOut {...iconPreset.outlined()} />
										</span>
										{t(($) => $.wg_sidebar__menuLogout)}
									</button>
								</div>
							</div>
						}
						rootClassName="wg_sidebar__popover"
					>
						{/* todo: 유저네임의 첫글자 넣기 */}
						<UiAvatar>
							<HalloweenGhost {...iconPreset.outlined()} filled />
						</UiAvatar>
						<div className={clsx("wg_sidebar__profileUserInfo")}>
							<div className={clsx("wg_sidebar__profileUserName")}>{responseAuthorizationInfoSuspense.data.profile.name}</div>
							<div className={clsx("wg_sidebar__profileUserEmail")}>{responseAuthorizationInfoSuspense.data.profile.loginId}</div>
						</div>
					</UiPopover>
				</div>
			</div>
		</div>
	);
};

export default WidgetSidebar;
