import {defineConfig} from "@kubb/core";
import {pluginClient} from "@kubb/plugin-client";
import {pluginFaker} from "@kubb/plugin-faker";
import {pluginOas} from "@kubb/plugin-oas";
import {pluginReactQuery} from "@kubb/plugin-react-query";
import {pluginTs} from "@kubb/plugin-ts";
import {kebabCase} from "es-toolkit";
import {loadEnv} from "vite";
import {parseArgs} from "node:util";

const args = parseArgs({args: process.argv.slice(2), options: {mode: {type: "string"}}, allowPositionals: true});
const mode = args.values.mode ?? "development";
const env = loadEnv(mode, process.cwd(), "KUBB_");
const API_DOCS_URL = env.KUBB_API_DOCS_URL;
const OUTPUT_ROOT = env.KUBB_OUTPUT_ROOT;

export default defineConfig({
	root: ".",
	input: {path: API_DOCS_URL},
	output: {path: OUTPUT_ROOT, barrelType: false, defaultBanner: "full", clean: true, format: "biome", lint: "biome"},
	plugins: [
		pluginOas({validate: true, collisionDetection: true}),
		pluginClient({
			output: {
				path: "./clients",
				barrelType: false,
				banner:
					"/** biome-ignore-all lint/correctness/noUnusedImports: IDONCARE */\n/** biome-ignore-all lint/suspicious/noExplicitAny: IDONCARE */",
				footer: "",
			},
			bundle: true,
			operations: true,
			parser: "client",
			group: {type: "tag", name: ({group}) => `${group}`},
			dataReturnType: "data",
			client: "axios",
			transformers: {
				name: (name: string, type?: "file" | "function" | "type" | "const") => {
					if (type === "file") {
						return kebabCase(name);
					}
					return name;
				},
			},
		}),
		pluginTs({
			output: {
				path: "./types",
				barrelType: false,
				banner:
					"/** biome-ignore-all lint/correctness/noUnusedImports: IDONCARE */\n/** biome-ignore-all lint/suspicious/noExplicitAny: IDONCARE */",
			},
			group: {type: "tag", name: ({group}) => `${group}`},
			unknownType: "unknown",
			emptySchemaType: "unknown",
			transformers: {
				name: (name: string, type?: "file" | "function" | "type" | "const") => {
					if (type === "file") {
						return kebabCase(name);
					}
					return name;
				},
			},
		}),
		pluginFaker({
			output: {
				path: "./mocks",
				barrelType: false,
				banner:
					"/** biome-ignore-all lint/correctness/noUnusedImports: IDONCARE */\n/** biome-ignore-all lint/suspicious/noExplicitAny: IDONCARE */",
			},
			group: {type: "tag", name: ({group}) => `${group}`},
			transformers: {
				name: (name: string, type?: "file" | "function" | "type" | "const") => {
					if (type === "file") {
						return kebabCase(name);
					}
					return name;
				},
			},
			dateType: "string",
			unknownType: "unknown",
			regexGenerator: "randexp",
			mapper: {
				projectId: "faker.number.int({ min: 0, max: 255 })",
				minLength: "faker.number.int({ min: 0, max: 255 })",
				maxLength: "faker.number.int({ min: 0, max: 255 })",
				minValue: "faker.number.int({ min: 0, max: 255 })",
				maxValue: "faker.number.int({ min: 0, max: 255 })",
				precision: "faker.number.int({ min: 0, max: 255 })",
				scale: "faker.number.int({ min: 0, max: 255 })",
			},
		}),
		pluginReactQuery({
			output: {
				path: "./hooks",
				barrelType: false,
				banner:
					"/** biome-ignore-all lint/correctness/noUnusedImports: IDONCARE */\n/** biome-ignore-all lint/suspicious/noExplicitAny: IDONCARE */",
			},
			group: {type: "tag", name: ({group}) => `${group}`},
			transformers: {
				name: (name: string, type?: "file" | "function" | "type" | "const") => {
					if (type === "file") {
						return kebabCase(name);
					}
					return name;
				},
			},
			client: {dataReturnType: "data"},
			mutation: {methods: ["post", "put", "delete"]},
			infinite: false,
			query: {methods: ["get"], importPath: "@tanstack/react-query"},
			suspense: {},
		}),
	],
});
