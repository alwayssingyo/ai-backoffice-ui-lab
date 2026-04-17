import type {BoardPageResponse} from "@/services/types/board-page-response.ts";
import type {UserActivityResponse} from "@/services/types/user-activity-response.ts";

/**
 * @summary 릴리즈 노트 테이블 행 데이터
 * @property version 릴리즈 버전 표시값
 * @property summary 릴리즈 요약
 * @property publishedAt 게시 시각
 * @property highlights 강조 항목 목록
 */
export interface ReleaseNoteItem {
	version: string;
	summary: string;
	publishedAt: string;
	highlights: string[];
}

/**
 * @summary 공지사항 쿼리 선택 결과
 * @property noticeItems 공지사항 테이블 데이터
 */
export interface NoticeItemsData {
	noticeItems: BoardPageResponse[];
}

/**
 * @summary 사용자 활동 테이블 행 데이터
 * @property actor 활동 수행자 이름
 * @property action 수행 메서드
 * @property target 요청 대상 URL
 * @property context 활동 설명
 * @property createdAt 활동 생성 시각
 */
export interface TeamActivityItem {
	actor?: string;
	action?: string;
	target?: string;
	context?: string;
	createdAt: string;
}

/**
 * @summary 릴리즈 노트 쿼리 선택 결과
 * @property releaseNoteItems 릴리즈 노트 테이블 데이터
 */
export interface ReleaseNoteItemsData {
	releaseNoteItems: ReleaseNoteItem[];
}

/**
 * @summary 사용자 활동 쿼리 선택 결과
 * @property teamActivityItems 사용자 활동 테이블 데이터
 */
export interface TeamActivityItemsData {
	teamActivityItems: TeamActivityItem[];
}

/**
 * @summary 공지사항 등급 뱃지 클래스를 계산합니다.
 */
export const resolveNoticeGradeToneClassName = (grade: string) => {
	if (grade.includes("CRITICAL")) {
		return "rt_ppi__badge--critical";
	}

	if (grade.includes("IMPORTANT") || grade.includes("HIGH")) {
		return "rt_ppi__badge--important";
	}

	return "rt_ppi__badge--notice";
};

/**
 * @summary 공지사항 응답 목록을 화면 테이블 데이터로 정규화합니다.
 */
export const selectNoticeItems = (boardPages: BoardPageResponse[]) => {
	return {noticeItems: boardPages};
};

/**
 * @summary 빌드노트 응답 목록을 릴리즈 노트 테이블 데이터로 변환합니다.
 */
export const selectReleaseNoteItems = (boardPages: BoardPageResponse[]) => {
	return {
		releaseNoteItems: boardPages.map((boardPage) => {
			return {
				version: boardPage.grade,
				summary: boardPage.title,
				highlights: boardPage.content ? [boardPage.content] : [],
				publishedAt: boardPage.createdAt,
			};
		}),
	};
};

/**
 * @summary 사용자 활동 응답 목록을 활동 테이블 데이터로 변환합니다.
 */
export const selectTeamActivityItems = (userActivities: UserActivityResponse[]) => {
	return {
		teamActivityItems: userActivities.map((userActivity) => {
			return {
				actor: userActivity.adminName,
				action: userActivity.method,
				target: userActivity.url,
				context: userActivity.description,
				createdAt: userActivity.createdAt,
			};
		}),
	};
};
