import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_CLINET_ID': JSON.stringify(env.GOOGLE_CLINET_ID),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY':JSON.stringify(env.OPENAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server:{
        allowedHosts:['594cf9ac0196.ngrok-free.app']
      }
    };
});
