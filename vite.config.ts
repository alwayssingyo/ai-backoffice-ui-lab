import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isTanstackDevtoolsDisabled = process.env.DISABLE_TANSTACK_DEVTOOLS_VITE === "true";
  const devtoolsEventBusPort = Number.parseInt(
      process.env.TANSTACK_DEVTOOLS_PORT ?? env.TANSTACK_DEVTOOLS_PORT ?? "42069",
      10
  );
  const resolvedDevtoolsEventBusPort = Number.isNaN(devtoolsEventBusPort) ? 42069 : devtoolsEventBusPort;
  
  return {
    plugins: [
      ...(!isTanstackDevtoolsDisabled
        ? [
            devtools({
              eventBusConfig: {
                port: resolvedDevtoolsEventBusPort,
              },
            }),
          ]
        : []),
      visualizer(),
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routeToken: 'layout',
        routeFileIgnorePattern: '\\.(test|spec|e2e)\\.|\\.css$|\\.ts$',
      }),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            
            if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/') ||
                id.includes('/node_modules/use-sync-external-store/') ||
                id.includes('/node_modules/object-assign/') ||
                id.includes('/node_modules/loose-envify/')
            ) {
              return '@vendor-react';
            }
            
            if (id.includes('/node_modules/antd/')) {
              return '@vendor-antd';
            }
            
            if (
                id.includes('/node_modules/rc-') ||
                id.includes('/node_modules/@rc-component/') ||
                id.includes('/node_modules/@ant-design/')
            ) {
              return '@vendor-antd-rc';
            }
            
            if (id.includes('/node_modules/@tanstack/')) {
              return '@vendor-tanstack';
            }
            
            if (
                id.includes('/node_modules/i18next/') ||
                id.includes('/node_modules/react-i18next/') ||
                id.includes('/node_modules/i18next-browser-languagedetector/')
            ) {
              return '@vendor-i18n';
            }
            
            if (id.includes('/node_modules/axios/')) {
              return '@vendor-axios';
            }
            
            if (id.includes('/node_modules/griddy-icons/')) {
              return '@vendor-icons';
            }
            
            if (id.includes('/node_modules/zod/')) {
              return '@vendor-zod';
            }
            
            return '@vendor';
          },
        },
      },
    },
  } satisfies UserConfig;
})
