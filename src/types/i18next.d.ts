import type {defaultNS, resources} from "@/libraries/i18n/setup-i18n";

declare module "i18next" {
	interface CustomTypeOptions {
		enableSelector: true;
		defaultNS: typeof defaultNS;
		resources: (typeof resources)["en"];
	}
}
