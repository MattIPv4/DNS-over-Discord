import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const NODE_ENV = process.env.NODE_ENV || 'development';
import dotenv from 'dotenv';
const env = dotenv.config({ path: fileURLToPath(new URL(`${NODE_ENV}.env`, import.meta.url)) });

import webpack from 'webpack';
import WorkersSentryWebpackPlugin from 'workers-sentry/webpack.js';

import commands from './src/commands/index.js';
import registerCommands from './src/core/register.js';

console.log(`Using ${NODE_ENV} environment for build...`);

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
                () => registerCommands(
                    process.env.CLIENT_ID,
                    process.env.CLIENT_SECRET,
                    commands,
                    process.env.TEST_GUILD_ID,
                ),
            ),
        },

        // Expose our environment in the worker
        new webpack.DefinePlugin(Object.entries(env.parsed).reduce((obj, [ key, val ]) => {
            obj[`process.env.${key}`] = JSON.stringify(val);
            return obj;
        }, { 'process.env.NODE_ENV': JSON.stringify(NODE_ENV) })),

        // Ensure single chunk
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),

        // Publish source maps to Sentry on each build
        process.env.SENTRY_AUTH_TOKEN
            && process.env.SENTRY_ORG
            && process.env.SENTRY_PROJECT
            && new WorkersSentryWebpackPlugin(
                process.env.SENTRY_AUTH_TOKEN,
                process.env.SENTRY_ORG,
                process.env.SENTRY_PROJECT,
            ),
    ].filter(Boolean),
    // Don't webpack node-fetch, rely on fetch global
    externals: { 'node-fetch': 'fetch' },
    externalsType: 'global',
    // We need to polyfill buffer for DNS packets
    resolve: {
        fallback: {
            buffer: createRequire(import.meta.url).resolve('buffer/'),
        },
    },
    // Always expose a source map
    // WorkersSentryWebpackPlugin will do the same when there is a Sentry token
    devtool: 'source-map',
};
