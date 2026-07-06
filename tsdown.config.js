import { register } from 'node:module';
import dotenv from 'dotenv';
import { defineConfig } from 'tsdown';
import { registerCommands } from 'workers-discord';

dotenv.config();

// Stub cloudflare:workers import for commands dynamic import
register(
    `data:text/javascript,${encodeURIComponent('export const resolve = (spec, ctx, next) => spec === \'cloudflare:workers\' ? { url: \'data:text/javascript,export const env = {};\', shortCircuit: true } : next(spec, ctx);')}`,
    import.meta.url,
);

export default defineConfig({
    entry: 'src/index.js',
    // Include source maps for error tracing in Sentry
    sourcemap: true,
    // Register the commands once the worker is built
    onSuccess: async () => {
        if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
            console.warn('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are required to register commands. Skipping registration.');
            return;
        }

        const { default: commands } = await import(new URL('./src/commands/index.js', import.meta.url));
        const res = await registerCommands(
            process.env.DISCORD_CLIENT_ID,
            process.env.DISCORD_CLIENT_SECRET,
            commands,
            true,
            process.env.DISCORD_GUILD_ID,
        );

        console.log(`Registered ${res.length} commands...`);
    },
    // Don't bundle node:async_hooks + cloudflare:workers, Cloudflare Workers provides them
    deps: {
        alwaysBundle: [/.+/],
        neverBundle: ['node:async_hooks', 'cloudflare:workers'],
    },
    // Replace any node-fetch usages with the native fetch API
    inputOptions: {
        plugins: [
            {
                name: 'node-fetch',
                resolveId: (source) => source === 'node-fetch' ? '\0node-fetch' : null,
                load: (id) => id === '\0node-fetch' ? 'module.exports = fetch;' : null,
            },
        ],
    },
    // Apply no syntax transformations and assume a browser-ish environment, not Node.js
    target: false,
    platform: 'browser',
});
