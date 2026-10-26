import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Local Dev API Middleware plugin
function apiDevMiddlewarePlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
          try {
            // @ts-ignore
            const { default: handler } = await import('./api/[...route].js');
            await handler(req, res);
            return;
          } catch (err: any) {
            console.error('[API Middleware Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v;
  }

  const plugins = [
    react(), 
    tailwindcss(), 
    apiDevMiddlewarePlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/mbbswala/favicon.png', 'images/mbbswala/pwa-icon.jpg'],
      manifest: {
        name: 'MBBS Waala',
        short_name: 'MBBS Waala',
        description: 'Your ultimate NEET UG admission partner',
        theme_color: '#0B0D12',
        background_color: '#0B0D12',
        icons: [
          {
            src: '/images/mbbswala/pwa-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (
      /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) &&
      (key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_') || key.startsWith('SUPABASE_'))
    ) {
      processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    server: {
      port: 5173,
    },
    build: {
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
  }
})
