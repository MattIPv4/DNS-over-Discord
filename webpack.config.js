import path from 'path';
import { fileURLToPath } from 'url';
const NODE_ENV = process.env.NODE_ENV || 'development';
import dotenv from 'dotenv';
const env = dotenv.config({ path: fileURLToPath(new URL(`${NODE_ENV}.env`, import.meta.url)) });

import webpack from 'webpack';
import WorkersSentryWebpackPlugin from 'workers-sentry/webpack';
import build from './src/build';

console.log(`Using ${NODE_ENV} environment for build...`);

export default {
    mode: 'none',
    target: 'webworker',
    entry: './src/index.js',
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

        // Publish source maps to Sentry on each build
        new WorkersSentryWebpackPlugin(
            process.env.SENTRY_AUTH_TOKEN,
            process.env.SENTRY_ORG,
            process.env.SENTRY_PROJECT,
        ),
    ],
    module: {
        rules: [
            {
                test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',
            },
        ],
    },
};
