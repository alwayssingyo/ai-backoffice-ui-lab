/**
 * @description 쿼리키 첫번째꺼 URL 가져옵니다.
 */
// biome-ignore lint/suspicious/noExplicitAny: IDONTCARE
export const getBaseQueryKey = <T extends (...args: any[]) => readonly any[]>(factory: T): [ReturnType<T>[0]] => {
	const queryKey = factory({})[0];

	if (typeof queryKey === "object" && queryKey !== null && "url" in queryKey) {
		return [{url: queryKey.url} as ReturnType<T>[0]];
	}

	return [queryKey];
};
