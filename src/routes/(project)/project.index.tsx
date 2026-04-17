import {Fragment} from "react";
import {createFileRoute} from "@tanstack/react-router";
import clsx from "clsx";
import "./project.css";
import WidgetContentBody from "@/components/widget/content/widget-content-body.tsx";
import WidgetContentHeader from "@/components/widget/content/widget-content-header.tsx";
import UiCard from "@/components/ui/card/ui-card.tsx";
import UiTable from "@/components/ui/table/ui-table.tsx";
import UiTypoText from "@/components/ui/typography/ui-typo-text.tsx";
import UiTypoTitle from "@/components/ui/typography/ui-typo-title.tsx";
import {formatDateValue} from "@/libraries/dayjs/setup-dayjs.ts";
import {useHomeDashboardGetBuildNotesSuspense} from "@/services/hooks/home-dashboard/use-home-dashboard-get-build-notes-suspense.ts";
import {useHomeDashboardGetNoticesSuspense} from "@/services/hooks/home-dashboard/use-home-dashboard-get-notices-suspense.ts";
import {useHomeDashboardGetUserActivitiesSuspense} from "@/services/hooks/home-dashboard/use-home-dashboard-get-user-activities-suspense.ts";
import type {BoardPageResponse} from "@/services/types/board-page-response.ts";
import {useTranslation} from "react-i18next";
import {
	type NoticeItemsData,
	type ReleaseNoteItem,
	type ReleaseNoteItemsData,
	type TeamActivityItem,
	type TeamActivityItemsData,
	resolveNoticeGradeToneClassName,
	selectNoticeItems,
	selectReleaseNoteItems,
	selectTeamActivityItems,
} from "./project.ts";

export const Route = createFileRoute("/(project)/project/")({component: ProjectPidIndex});

function ProjectPidIndex() {
	const {t} = useTranslation("common");

	/**
	 * @description 공지사항 목록 조회 API
	 */
	const responseHomeDashboardGetNoticesSuspense = useHomeDashboardGetNoticesSuspense<NoticeItemsData>({
		query: {
			select: (data) => {
				return selectNoticeItems(data.data.list);
			},
		},
	});

	/**
	 * @description 빌드노트 목록 조회 API
	 */
	const responseHomeDashboardGetBuildNotesSuspense = useHomeDashboardGetBuildNotesSuspense<ReleaseNoteItemsData>({
		query: {
			select: (data) => {
				return selectReleaseNoteItems(data.data.list);
			},
		},
	});

	/**
	 * @description 사용자 활동 목록 조회 API
	 */
	const responseHomeDashboardGetUserActivitiesSuspense = useHomeDashboardGetUserActivitiesSuspense<TeamActivityItemsData>({
		query: {
			select: (data) => {
				return selectTeamActivityItems(data.data.list);
			},
		},
	});

	const noticeColumns = [
		{
			title: t(($) => $.rt_ppi__noticeColLevel),
			dataIndex: "grade",
			className: "ui_table__col",
			width: 110,
			render: (value: BoardPageResponse["grade"]) => {
				return <span className={clsx("rt_ppi__badge", resolveNoticeGradeToneClassName(value))}>{value}</span>;
			},
		},
		{title: t(($) => $.rt_ppi__noticeColTitle), dataIndex: "title", className: "ui_table__col", width: 260},
		{title: t(($) => $.rt_ppi__noticeColDetail), dataIndex: "content", className: "ui_table__col"},
		{title: t(($) => $.rt_ppi__noticeColOwner), dataIndex: "creatorName", className: "ui_table__col", width: 180},
		{
			title: t(($) => $.rt_ppi__noticeColPostedAt),
			dataIndex: "createdAt",
			className: "ui_table__col",
			width: 160,
			render: (value: BoardPageResponse["createdAt"]) => {
				return formatDateValue(value, "DATE_TIME");
			},
		},
	];

	const releaseColumns = [
		{title: t(($) => $.rt_ppi__releaseColVersion), dataIndex: "version", className: "ui_table__col", width: 120},
		{title: t(($) => $.rt_ppi__releaseColSummary), dataIndex: "summary", className: "ui_table__col", width: 280},
		{
			title: t(($) => $.rt_ppi__releaseColHighlights),
			dataIndex: "highlights",
			className: "ui_table__col",
			render: (value: string[]) => {
				return value.join(" · ");
			},
		},
		{
			title: t(($) => $.rt_ppi__releaseColPublishedAt),
			dataIndex: "publishedAt",
			className: "ui_table__col",
			width: 160,
			render: (value: ReleaseNoteItem["publishedAt"]) => {
				return formatDateValue(value, "DATE_TIME");
			},
		},
	];

	const activityColumns = [
		{title: t(($) => $.rt_ppi__activityColActor), dataIndex: "actor", className: "ui_table__col", width: 140},
		{title: t(($) => $.rt_ppi__activityColAction), dataIndex: "action", className: "ui_table__col", width: 150},
		{title: t(($) => $.rt_ppi__activityColTarget), dataIndex: "target", className: "ui_table__col", width: 320},
		{title: t(($) => $.rt_ppi__activityColContext), dataIndex: "context", className: "ui_table__col"},
		{
			title: t(($) => $.rt_ppi__activityColCreatedAt),
			dataIndex: "createdAt",
			className: "ui_table__col",
			width: 160,
			render: (value: TeamActivityItem["createdAt"]) => {
				return formatDateValue(value, "DATE_TIME");
			},
		},
	];

	return (
		<Fragment>
			<WidgetContentHeader title={t(($) => $.rt_ppi__title)} desc={t(($) => $.rt_ppi__desc)} />
			<WidgetContentBody>
				<div className={clsx("rt_ppi")}>
					<div className={clsx("rt_ppi__board")}>
						<UiCard className={clsx("rt_ppi__panel")}>
							<div className={clsx("rt_ppi__sectionHeader")}>
								<UiTypoTitle level={4} className={clsx("rt_ppi__sectionTitle")}>
									{t(($) => $.rt_ppi__noticeTitle)}
								</UiTypoTitle>
								<UiTypoText type={"secondary"} className={clsx("rt_ppi__sectionDesc")}>
									{t(($) => $.rt_ppi__noticeDesc)}
								</UiTypoText>
							</div>
							<UiTable<BoardPageResponse>
								className={clsx("rt_ppi__table")}
								columns={noticeColumns}
								dataSource={responseHomeDashboardGetNoticesSuspense.data.noticeItems}
								rowKey={(record) => record.id}
								pagination={false}
								scroll={{x: "max-content"}}
							/>
						</UiCard>

						<UiCard className={clsx("rt_ppi__panel")}>
							<div className={clsx("rt_ppi__sectionHeader")}>
								<UiTypoTitle level={4} className={clsx("rt_ppi__sectionTitle")}>
									{t(($) => $.rt_ppi__releaseTitle)}
								</UiTypoTitle>
								<UiTypoText type={"secondary"} className={clsx("rt_ppi__sectionDesc")}>
									{t(($) => $.rt_ppi__releaseDesc)}
								</UiTypoText>
							</div>
							<UiTable<ReleaseNoteItem>
								className={clsx("rt_ppi__table")}
								columns={releaseColumns}
								dataSource={responseHomeDashboardGetBuildNotesSuspense.data.releaseNoteItems}
								rowKey={(record) => `${record.version}-${record.publishedAt}`}
								pagination={false}
								scroll={{x: "max-content"}}
							/>
						</UiCard>

						<UiCard className={clsx("rt_ppi__panel")}>
							<div className={clsx("rt_ppi__sectionHeader")}>
								<UiTypoTitle level={4} className={clsx("rt_ppi__sectionTitle")}>
									{t(($) => $.rt_ppi__teamActivityTitle)}
								</UiTypoTitle>
								<UiTypoText type={"secondary"} className={clsx("rt_ppi__sectionDesc")}>
									{t(($) => $.rt_ppi__teamActivityDesc)}
								</UiTypoText>
							</div>
							<UiTable<TeamActivityItem>
								className={clsx("rt_ppi__table")}
								columns={activityColumns}
								dataSource={responseHomeDashboardGetUserActivitiesSuspense.data.teamActivityItems}
								rowKey={(record) => `${record.actor}-${record.createdAt}-${record.target}`}
								pagination={false}
								scroll={{x: "max-content"}}
							/>
						</UiCard>
					</div>
				</div>
			</WidgetContentBody>
		</Fragment>
	);
}
