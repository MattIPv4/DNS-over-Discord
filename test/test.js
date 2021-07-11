const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', `${process.env.NODE_ENV}.env`) });

const test = require('ava');
const { Miniflare } = require('miniflare');

test.beforeEach(t => {
    t.context = { mf: new Miniflare({ buildCommand: undefined }) };
});

module.exports = test;
