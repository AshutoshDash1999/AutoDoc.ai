import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { generateReadmeHandler, jobStatusHandler } from "./api/generate-readme.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      {
        name: "autodoc-api",
        configureServer(server) {
          server.middlewares.use("/api/generate-readme", (req, res) => {
            generateReadmeHandler(req, res, { ...process.env, ...env });
          });
          server.middlewares.use("/api/job-status", (req, res) => {
            jobStatusHandler(req, res);
          });
        },
      },
    ],
    base: process.env.VITE_BASE_PATH || "/",
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/auth': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});