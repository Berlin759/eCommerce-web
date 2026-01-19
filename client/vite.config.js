import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "https://25bd5625faa8.ngrok-free.app",
                changeOrigin: true,
            },
        },
        // allowedHosts: [
        //     // "4b0f6a928378.ngrok-free.app"
        //     ".ngrok-free.app",
        // ],
    },
});
