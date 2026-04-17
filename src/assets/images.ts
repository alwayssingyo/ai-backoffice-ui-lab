// 자동생성이니까 수정하지마세요.
import logoIntroPng from "@/assets/images/logo-intro.png";
import logoWhitePng from "@/assets/images/logo-white.png";
import logoPng from "@/assets/images/logo.png";

export const images = {logoIntroPng, logoWhitePng, logoPng} as const;

export type ImageKey = keyof typeof images;
