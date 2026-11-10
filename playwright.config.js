import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser', timeout:30000,
 use:{baseURL:'http://127.0.0.1:4173',headless:true,viewport:{width:390,height:844},reducedMotion:'reduce'},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:60000},
});
