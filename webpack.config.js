const build = require('./src/build');

module.exports = {
    entry: './src/index.js',
    plugins: [
        { apply: compiler => compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build) },
    ],
};
