const path = require('path');
require('dotenv').config({ path: path.join(__dirname, `${process.env.NODE_ENV}.env`) });
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
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },
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
