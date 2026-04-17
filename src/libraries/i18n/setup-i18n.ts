import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {initReactI18next} from "react-i18next";
import en from "@/i18n/en/common.json";
import ko from "@/i18n/ko/common.json";

export const defaultNS = "common";
export const resources = {en: {common: en}, ko: {common: ko}} as const;

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({resources, defaultNS, fallbackLng: "ko", interpolation: {escapeValue: false}});

export default i18n;
