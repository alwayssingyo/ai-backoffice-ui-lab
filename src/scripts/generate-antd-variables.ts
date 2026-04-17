import {theme} from "antd";
import fs from "node:fs";
import path from "node:path";

const {defaultAlgorithm} = theme;

// ConfigProvider와 반드시 동일해야 함
const themeConfig = {
	algorithm: defaultAlgorithm,
	token: {colorPrimary: "#4945ff", borderRadius: 4, fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"},
};

// kebab-case 변환
function toKebabCase(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
		.toLowerCase();
}

// px 필요 여부
function isPureNumberToken(tokenName: string) {
	return (
		tokenName.includes("zIndex") ||
		tokenName.includes("opacity") ||
		tokenName.includes("lineHeight") ||
		tokenName.includes("fontWeight") ||
		tokenName.includes("motion")
	);
}

// antd 토큰 계산
const designToken = theme.getDesignToken(themeConfig);

// CSS 변수 생성
const lines = Object.entries(designToken)
	.filter(([key]) => !key.startsWith("_"))
	.map(([key, value]) => {
		const cssVarName = `--cms-${toKebabCase(key)}`;

		if (typeof value === "number") {
			const finalValue = isPureNumberToken(key) ? String(value) : `${value}px`;
			return `  ${cssVarName}: ${finalValue};`;
		}

		if (typeof value === "string") {
			return `  ${cssVarName}: ${value};`;
		}

		return null;
	})
	.filter(Boolean);

// 최종 CSS
const css = `:root {\n${lines.join("\n")}\n}\n`;

// 출력 경로
const outputPath = path.resolve(process.cwd(), "src/styles/_variables.css");

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, css, "utf8");

console.log("variables.css generated");
