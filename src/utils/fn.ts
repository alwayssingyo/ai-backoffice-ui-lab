/**
 * @description 여러 이벤트 핸들러나 콜백 함수를 하나로 묶어 순차적으로 실행합니다.
 */
export const chain = <T extends unknown[]>(...fns: (((...args: T) => void) | undefined)[]) => {
	return (...args: T) => {
		fns.forEach((fn) => {
			if (fn) {
				fn(...args);
			}
		});
	};
};
