/**
 * @description 슈퍼관리자 역할명 판별용 키워드
 */
export const superAdminRoleKeywords = ["super_admin", "superadmin", "super admin", "슈퍼 관리자"] as const;

/**
 * @description 역할명 정규화
 */
export const normalizeRoleName = (roleName: string) => {
	return roleName.replaceAll("_", " ").trim().toLowerCase();
};

/**
 * @description 슈퍼관리자 역할명 여부 판별
 */
export const isSuperAdminRoleName = (roleName?: string) => {
	if (typeof roleName !== "string") {
		return false;
	}

	const normalizedRoleName = normalizeRoleName(roleName);

	return superAdminRoleKeywords.some((keyword) => normalizedRoleName === keyword || normalizedRoleName.includes(keyword));
};
