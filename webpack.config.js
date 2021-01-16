const build = require('./src/build');

module.exports = {
    entry: './src/index.js',
    plugins: [
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },
    ],
    module: {
        rules: [
            {
                test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',
            },
        ],
    },
};
