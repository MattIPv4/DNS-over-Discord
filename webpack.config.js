const build = require('./src/build');

class PrepareBuildBeforeWebpack {
    apply(compiler) {
        compiler.hooks.beforeRun.tapPromise('PrepareBuildBeforeWebpack', build);
    }
}

module.exports = {
    entry: './src/index.js',
    plugins: [
        new PrepareBuildBeforeWebpack(),
    ],
};
