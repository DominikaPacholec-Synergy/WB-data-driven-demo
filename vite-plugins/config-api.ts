import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Connect, Plugin } from 'vite';

/**
 * A stand-in for the configuration backend.
 *
 * The point of the demo is that the editor is configured from a server, so the
 * config must arrive over HTTP and be visible in the Network tab — not be
 * imported as a module or served as a static asset. This middleware reads the
 * JSON off disk on every request (no caching), so editing a profile and
 * reloading is the whole iteration loop.
 *
 *   GET /api/profiles              -> the switcher menu
 *   GET /api/profiles/:id          -> the four files, assembled into one document
 *   GET /api/profiles/:id/:part    -> a single file (feeds the Config Studio tabs)
 */

const PARTS = ['profile', 'theme', 'palette', 'workflow'] as const;
type Part = (typeof PARTS)[number];

const ROUTE = /^\/api\/profiles(?:\/([\w-]+))?(?:\/([\w-]+))?\/?$/;

export const configApi = (configDir = 'config/profiles'): Plugin => {
  const root = resolve(process.cwd(), configDir);

  const readJson = async (...segments: string[]) =>
    JSON.parse(await readFile(join(root, ...segments), 'utf8')) as unknown;

  const send = (res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) => {
    const payload = JSON.stringify(body, null, 2);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(payload);
  };

  const listProfiles = async () => {
    try {
      return await readJson('index.json');
    } catch {
      const dirs = await readdir(root, { withFileTypes: true });
      return {
        profiles: dirs
          .filter((entry) => entry.isDirectory())
          .map((entry) => ({
            id: entry.name,
            label: entry.name,
            description: '',
            icon: 'Faders',
          })),
      };
    }
  };

  /** Assembles the four files into the single document `loadProfile()` expects. */
  const assemble = async (id: string) => {
    const [profile, theme, palette, workflow] = await Promise.all(
      PARTS.map((part) => readJson(id, `${part}.json`)),
    );
    return { ...(profile as object), theme, palette, workflow };
  };

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '').split('?')[0];
    const match = ROUTE.exec(url);
    if (!match || req.method !== 'GET') return next();

    const [, id, part] = match;

    void (async () => {
      try {
        if (!id) return send(res, 200, await listProfiles());
        if (!part) return send(res, 200, await assemble(id));
        if (!PARTS.includes(part as Part)) {
          return send(res, 404, { error: `Unknown config part "${part}".` });
        }
        return send(res, 200, await readJson(id, `${part}.json`));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const status = message.includes('ENOENT') ? 404 : 500;
        send(res, status, { error: message });
      }
    })();
  };

  return {
    name: 'wb-config-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    // Keep `npm run build && npm run preview` working too.
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
};
