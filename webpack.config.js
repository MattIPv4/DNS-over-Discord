const path = require('path');
const env = require('dotenv').config({ path: path.join(__dirname, `${process.env.NODE_ENV}.env`) });
const { DefinePlugin } = require('webpack');
const WorkersSentryWebpackPlugin = require('workers-sentry/webpack');
const build = require('./src/build');

module.exports = {
    entry: './src/index.js',
    plugins: [
        // Hook in the commands build process before each webpack run
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },

        // Expose our environment in the worker
        new DefinePlugin(Object.entries(env.parsed || {}).reduce((obj, [ key, val ]) => {
            obj[`process.env.${key}`] = JSON.stringify(val);
            return obj;
        }, { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) })),

        // Publish source maps to Sentry on each build (if Sentry details given)
        process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
            ? new WorkersSentryWebpackPlugin(
                process.env.SENTRY_AUTH_TOKEN,
                process.env.SENTRY_ORG,
                process.env.SENTRY_PROJECT,
            ) : null,
    ].filter(plugin => plugin !== null),
    module: {
        rules: [
            {
                test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',
            },
        ],
    },
};
