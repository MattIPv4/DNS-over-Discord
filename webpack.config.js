const path = require('path');
const env = require('dotenv').config({ path: path.join(__dirname, `${process.env.NODE_ENV}.env`) });
const { DefinePlugin } = require('webpack');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const build = require('./src/build');

module.exports = {
    entry: './src/index.js',
    target: 'webworker',
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: 'dist',
        filename: 'worker.js',
        sourceMapFilename: 'worker.js.map',
    },
    plugins: [
        // Hook in the commands build process before each webpack run
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },

        // Expose our environment in the worker
        new DefinePlugin(Object.entries(env.parsed).reduce((obj, [ key, val ]) => {
            obj[`process.env.${key}`] = JSON.stringify(val);
            return obj;
        }, { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) })),

        // Publish source maps to Sentry on each build
        new SentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            include: './dist',
            ignore: ['node_modules', 'webpack.config.js'],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',
            },
        ],
    },
};
