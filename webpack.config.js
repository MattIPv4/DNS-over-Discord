import { fileURLToPath } from 'url';
import { createRequire, register } from 'module';
import dotenv from 'dotenv';
import webpack from 'webpack';
import { registerCommands } from 'workers-discord';

dotenv.config();

// Stub cloudflare:workers import for commands dynamic import
register(
    `data:text/javascript,${encodeURIComponent('export const resolve = (spec, ctx, next) => spec === \'cloudflare:workers\' ? { url: \'data:text/javascript,export const env = {};\', shortCircuit: true } : next(spec, ctx);')}`,
    import.meta.url,
);

export default {
    mode: 'none',
    target: 'webworker',
    entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
    output: {
        path: fileURLToPath(new URL('dist', import.meta.url)),
        filename: 'worker.js',
        // Generate an ESM module output for Cloudflare
        module: true,
        chunkFormat: 'module',
        library: { type: 'module' },
    },
    experiments: { outputModule: true },
    plugins: [
        // Hook in the commands registrations process before each Webpack run
        {
            apply: compiler => compiler.hooks.beforeRun.tapPromise(
                'RegisterCommandsBeforeWebpack',
                () => import('./src/commands/index.js')
                    .then(({ default: commands }) => registerCommands(
                        process.env.DISCORD_CLIENT_ID,
                        process.env.DISCORD_CLIENT_SECRET,
                        commands,
                        true,
                        process.env.DISCORD_GUILD_ID,
                    ))
                    .then(res => {
                        console.log(`Registered ${res.length} commands...`);
                        // console.dir(res, { depth: null });
                    }),
            ),
        },

        // Ensure single chunk
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    ].filter(Boolean),
    // Don't webpack node-fetch, rely on fetch global
    // Don't webpack node:async_hooks + cloudflare:workers, Cloudflare Workers provides them
    externals: {
        'node-fetch': 'fetch',
        'node:async_hooks': 'module-import node:async_hooks',
        'cloudflare:workers': 'module-import cloudflare:workers',
    },
    externalsType: 'global',
    // We need to polyfill buffer for DNS packets
    resolve: {
        fallback: {
            buffer: createRequire(import.meta.url).resolve('buffer/'),
        },
    },
    // Always expose a source map
    devtool: 'source-map',
};
