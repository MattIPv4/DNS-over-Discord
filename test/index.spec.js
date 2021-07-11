const test = require('ava');
const { Miniflare } = require('miniflare');

test.beforeEach((t) => {
    const mf = new Miniflare({ buildCommand: undefined });
    t.context = { mf };
});

test('', async (t) => {
    const { mf } = t.context;
});
