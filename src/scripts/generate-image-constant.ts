import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {camelCase} from "es-toolkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../assets/images");
const OUTPUT_FILE = path.resolve(__dirname, "../assets/images.ts");

const generateIndex = () => {
	try {
		const files = fs.readdirSync(IMAGES_DIR);
		const imageFiles = files.filter((file) => /\.(png|jpe?g|svg|gif|webp)$/i.test(file));

		if (imageFiles.length === 0) {
			console.log("생성할 이미지가 없어요");
			return;
		}

		const imports: string[] = [];
		const imageEntries: string[] = [];

		imageFiles.forEach((file) => {
			const variableName = camelCase(file);

			imports.push(`import ${variableName} from "@/assets/images/${file}";`);
			imageEntries.push(variableName);
		});

		const content = `// 자동생성이니까 수정하지마세요.
${imports.join("\n")}

export const images = {${imageEntries.join(", ")}} as const;

export type ImageKey = keyof typeof images;
`;

		fs.writeFileSync(OUTPUT_FILE, content);
		console.log(`${imageFiles.length}개 이미지를 상수로 생성했어요`);
	} catch (error) {
		console.error(error);
	}
};

generateIndex();
