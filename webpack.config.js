const path = require('path');
const NODE_ENV = process.env.NODE_ENV || 'development';
const env = require('dotenv').config({ path: path.join(__dirname, `${NODE_ENV}.env`) });
const { DefinePlugin } = require('webpack');
const WorkersSentryWebpackPlugin = require('workers-sentry/webpack');
const build = require('./src/build');

console.log(`Using ${NODE_ENV} environment for build...`);

module.exports = {
    target: 'webworker',
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'worker.js',
    },
    plugins: [
        // Hook in the commands build process before each webpack run
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },

        // Expose our environment in the worker
        new DefinePlugin(Object.entries(env.parsed).reduce((obj, [ key, val ]) => {
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
