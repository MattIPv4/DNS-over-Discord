import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const NODE_ENV = process.env.NODE_ENV || 'development';
import dotenv from 'dotenv';
const env = dotenv.config({ path: fileURLToPath(new URL(`${NODE_ENV}.env`, import.meta.url)) });

import webpack from 'webpack';
import WorkersSentryWebpackPlugin from 'workers-sentry/webpack.js';
import build from './src/build/index.js';

console.log(`Using ${NODE_ENV} environment for build...`);

export default {
    mode: 'none',
    target: 'webworker',
    entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
    output: {
        path: fileURLToPath(new URL('dist', import.meta.url)),
        filename: 'worker.js',
    },
    plugins: [
        // Hook in the commands build process before each webpack run
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },

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
    externals: {
        // Don't webpack node-fetch, rely on fetch global
        'node-fetch': 'fetch',
    },
    resolve: {
        fallback: {
            // We need to polyfill buffer for DNS packets
            buffer: createRequire(import.meta.url).resolve('buffer/'),
        },
    },
};
