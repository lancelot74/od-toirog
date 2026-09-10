import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser',
  timeout:45000,
  workers:2,
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  webServer:{
    command:'GITHUB_ACTIONS=true NEXT_PUBLIC_SUPABASE_URL=https://od-test.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-public-key NEXT_PUBLIC_API_URL=https://api.od-test.invalid corepack pnpm build && python3 -m http.server 4173 --bind 127.0.0.1 --directory out',
    url:'http://127.0.0.1:4173',
    timeout:180000,
    reuseExistingServer:false,
  },
});
