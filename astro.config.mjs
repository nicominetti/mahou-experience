import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: 'server', // Habilitar SSR para API endpoints
	vite: {
		server: {
			watch: {
				usePolling: true,
			},
		},
		define: {
			global: 'globalThis', // Para compatibilidad con Fabric.js
		},
	},
	site: "https://mahou.es",
	i18n: {
		defaultLocale: "en",
		locales: ["en", "it"],
	},
	markdown: {
		drafts: true,
		shikiConfig: {
			theme: "css-variables",
		},
	},
	shikiConfig: {
		wrap: true,
		skipInline: false,
		drafts: true,
	},
	integrations: [
		tailwind({
			applyBaseStyles: false,
		}),
		react(), // Añadir React para el diseñador de camisetas
		sitemap(),
		mdx(),
		icon(),
	],
});
